#if 0

// Based on Mizvekov`s work, circa 2001. Thanks a lot!

#define ram  mem.__ram
#define hwr  mem.__hwr

// Sector Buffer Status
#define CD_NOINTR          0x00
#define CD_DATAREADY       0x01
#define CD_COMPLETE        0x02
#define CD_ACKNOWLEDGE     0x03
#define CD_DISKERROR       0x05

// Control
#define CD_CTRL_MODE0      0x01
#define CD_CTRL_MODE1      0x02
#define CD_CTRL_NP         0x08
#define CD_CTRL_PH         0x10
#define CD_CTRL_RES        0x20
#define CD_CTRL_DMA        0x40
#define CD_CTRL_BUSY       0x80

// Status
#define CD_STATUS_ERROR    0x01
#define CD_STATUS_STANDBY  0x02
#define CD_STATUS_SHELL    0x10
#define CD_STATUS_READ     0x20
#define CD_STATUS_SEEK     0x40
#define CD_STATUS_PLAY     0x80

// Command Mode
#define	CD_CMD_BLOCKING    0
#define CD_CMD_NONBLOCKING 1

#define CD_MODE_REPT       0x04
#define CD_MODE_SIZE0      0x10
#define CD_MODE_SIZE1      0x20
#define CD_MODE_SPEED      0x80

#define CD_READTIME\
  ((PSX_CLK / 121) / 64)

#define invokeBase()\
  motorBase.enabled = true;\
  motorBase.limit = motorBase.sinc + 0x10;\
  control |= CD_CTRL_BUSY

#define invokeSeek()\
  motorSeek.enabled = true;\
  motorSeek.limit = motorSeek.sinc + (CD_READTIME/2)

#define invokeRead()\
  motorRead.enabled = true;\
  motorRead.limit = motorRead.sinc + (CD_READTIME/2);\
  status |= CD_STATUS_READ

#define invokeInterrupt()\
  if ((interrupt.status & 0x7) !== 0) {\
    bus.interruptSet(IRQ_CD);\
  }

#define parameterClear()\
  resetVals(parameter);\
  control |= CD_CTRL_NP;\
  control |= CD_CTRL_PH

#define resultClear()\
  resetVals(result);\
  control &= ~CD_CTRL_RES

// Must stop CDDA as well
#define stopRead()\
  if (reads) {\
    status &= ~(CD_STATUS_SEEK | CD_STATUS_READ | CD_STATUS_PLAY);\
    motorSeek.enabled = false;\
    motorRead.enabled = false;\
    pause = false;\
    reads = 0;\
  }

pseudo.CstrCdrom = (function() {
  var busres = new UintBcap(8);
  var buspar = new UintBcap(8);
  var control, status;
  var interrupt = {};
  var kind, blockEnd, reads, mode;
  var motorSeek = {}, motorBase = {}, motorRead = {};
  var seekLoc = {}, destLoc = {};

  // Booleans
  var seeks, pause, mute, retr;

  var sector = {
    bfr: new UintBcap(2352)
  };

  var dma = {
    bfr: new UintBcap(2352)
  };
  
  var parameter = {
    value: new UintBcap(8)
  };

  var result = {
    value: new UintBcap(8)
  };

  function resetMotor(motor) {
    motor.enabled = false;
    motor.sinc  = 0;
    motor.limit = 0;
  }

  function resetVals(val) {
    val.value.fill(0);
    val.size    = 0;
    val.pointer = 0;
  }

  function resetLoc(loc) {
    loc.minute = 0;
    loc.sec    = 0;
    loc.frame  = 0;
  }

  function refreshCDLoc(loc) {
    var minute = BCD2INT(loc.minute);
    var sec    = BCD2INT(loc.sec);
    var frame  = BCD2INT(loc.frame);
    
    if (++frame >= 75) {
      frame = 0;
      if (++sec >= 60) {
        sec = 0;
        minute++;
      }
    }
    
    loc.minute = INT2BCD(minute);
    loc.sec    = INT2BCD(sec);
    loc.frame  = INT2BCD(frame);
  }

  function main() {
    control &= ~CD_CTRL_BUSY;
    resetVals(result);
    control &= ~CD_CTRL_RES;
    interrupt.status = (interrupt.status & 0xf8) | CD_ACKNOWLEDGE;
    
    if (status & CD_STATUS_ERROR) {
      psx.error('status & CD_STATUS_ERROR');
    }
    else {
      if (kind == CD_CMD_NONBLOCKING) {
        if (blockEnd) {
          interrupt.status = (interrupt.status & 0xf8) | CD_COMPLETE;
          blockEnd = 0;
        }
        else {
          blockEnd = 1;
          invokeBase();
          control &= ~CD_CTRL_BUSY;
          motorBase.limit = motorBase.sinc + 39;
          result.value[0] = status;
          result.size = 1;
          result.pointer = 0;
          control |= CD_CTRL_RES;
          seeks = false;
          
          return;
        }
      }
    }

    for (var i=0; (i < 8) && (buspar[i] !== 0); buspar[i++] = 0) {
      buspar[i] = param.value[i];
    }
    parameterClear();

    for (var i=0; (i < 8) && (busres[i] !== 0); busres[i++] = 0) {
      result.value[i] = busres[i];
      result.size = i + 1;
      result.pointer = 0;
      control |= CD_CTRL_RES;
    }
    status &= ~CD_STATUS_ERROR;
  }

  function command(data) {
    if (data < 0x20) {
      switch(data) {
        case 0x01: // CdlNop
          busres[0] = status;
          kind = CD_CMD_BLOCKING;
          break;

        case 0x02: // CdlSetLoc
          stopRead();
          buspar[0] = destLoc.minute;
          buspar[1] = destLoc.sec;
          buspar[2] = destLoc.frame;
          busres[0] = status;
          kind = CD_CMD_BLOCKING;
          break;

        case 0x06: // CdlReadN
          stopRead();
          reads = 1;
          sector.firstRead = true;
          retr = true;
          status |= CD_STATUS_STANDBY;
          status |= CD_STATUS_READ;
          invokeSeek();
          busres[0] = status;
          kind = CD_CMD_BLOCKING;
          break;

        case 0x08: //CdlStop
          stopRead();
          status &= ~CD_STATUS_STANDBY;
          busres[0] = status;
          kind = CD_CMD_NONBLOCKING;
          break;

        case 0x09: // CdlPause
          stopRead();
          status |= CD_STATUS_STANDBY;
          busres[0] = status;
          kind = CD_CMD_NONBLOCKING;
          break;

        case 0x0a: // CdlInit
          stopRead();
          status |= CD_STATUS_STANDBY;
          busres[0] = status;
          mode = 0;
          kind = CD_CMD_NONBLOCKING;
          break;

        case 0x0c: // CdlDemute
          mute = false;
          busres[0] = status;
          kind = CD_CMD_BLOCKING;
          break;

        case 0x0e: // CdlSetMode
          buspar[0] = mode;
          busres[0] = status;
          kind = CD_CMD_BLOCKING;
          break;

        case 0x13: // CdlGetTN
          {
            var tn = [1, 1];
            var result = [0, INT2BCD(tn[0]), INT2BCD(tn[1]), 0, 0, 0, 0, 0];
            busres[0] = status;
            for (var i=1; i<3; i++) {
              busres[i] = result[i];
            }
          }
          kind = CD_CMD_BLOCKING;
          break;

        case 0x14: // CdlGetTD
          {
            var td = [0, 2, 0];
            var result = [0, INT2BCD(td[2]), INT2BCD(td[1]), 0, 0, 0, 0, 0];
            busres[0] = status;
            for (var i=1; i<3; i++) {
              busres[i] = result[i];
            }
          }
          kind = CD_CMD_BLOCKING;
          break;

        case 0x15: // CdlSeekL
          stopRead();
          seekLoc.minute = destLoc.minute;
          seekLoc.sec    = destLoc.sec;
          seekLoc.frame  = destLoc.frame;
          seeks = true;
          status |= CD_STATUS_STANDBY;
          busres[0] = status;
          kind = CD_CMD_NONBLOCKING;
          break;

        case 0x19: // CdlSustem
          switch(parameter.value[0]) {
            case 0x20:
              busres.set([0x98, 0x06, 0x10, 0xc3]);
              break;

            default:
              psx.error('CdlSustem value '+hex(parameter.value[0]));
              break;
          }
          kind = CD_CMD_BLOCKING;
          break;

        case 0x1a: // CdlCheckId
          stopRead();
          busres.set([0x00, 0x00, 0x00, 0x00, 'S', 'C', 'E', 'A']); // 0x08, 0x90 for Audio CD
          kind = CD_CMD_NONBLOCKING;
          break;

        case 0x1e: // CdlReadToc
          busres[0] = status;
          kind = CD_CMD_NONBLOCKING;
          break;

        default:
          psx.error('Execute command '+hex(data));
          break;
      }
    }
    else {
      psx.error('data >= 0x20');
      //busres[0] = status;
      //kind = CD_CMD_BLOCKING;
    }
    invokeBase();
    blockEnd = 0;
  }

  function cdromRead() {
    var temp = 0;

    interrupt.status = (interrupt.status & 0xf8) | CD_DATAREADY;

    if (pause) {
      psx.error('*** pause');
    }

    if (reads === 1) {
      psx.trackRead(seekLoc);
      
      // if (psx.fetchBuffer()[0] === 0) {
      //   temp |= 0x02;
      // }
      // else {
        sector.bfr.set(psx.fetchBuffer());
      //}

      if (status & CD_STATUS_SHELL) {
        psx.error('*** status & CD_STATUS_SHELL');
      }

      // if (sector.bfr[0] === seekLoc.minute && sector.bfr[1] === seekLoc.sec && sector.bfr[2] === seekLoc.frame) {
      //   temp |= 0x08;
      // }
      
      if (temp) {
        result.value[0] = status | CD_STATUS_ERROR;
        result.value[1] = 0;
        result.size = 2;
        control |= CD_CTRL_RES;

        if (!retr) {
          psx.error('retr');
        }
        
        interrupt.status = (interrupt.status & 0xf8) | CD_DISKERROR;
        return;
      }

      switch((mode & (CD_MODE_SIZE0 | CD_MODE_SIZE1)) >> 4) {
        case 0:
          dma.size = 2048;
          break;

        default:
          psx.error('mode size 0 -> '+((mode & (CD_MODE_SIZE0 | CD_MODE_SIZE1)) >> 4));
          break;
      }

      var offset = (dma.size === 2352) ? 0 : 12;
      for (var i=0; i<dma.size; i++) {
        dma.bfr[i] = sector.bfr[i+offset];
      }
      dma.pointer = 0;
      control &= ~CD_CTRL_DMA;
      
      if ((mute === 0) && (mode & CD_MODE_RT) && (sector.firstRead !== -1)) {
        psx.error('(sector.firstRead !== -1)');
      }
    }

    control |= CD_CTRL_RES;
    result.value[0] = status;
    result.size     = 1;
    result.pointer  = 0;

    if (mode & CD_MODE_REPT) {
      psx.error('*** mode & CD_MODE_REPT');
    }

    refreshCDLoc(destLoc);
  }

  return {
    reset() {
      busres.fill(0);
      buspar.fill(0);

      control |= CD_CTRL_PH | CD_CTRL_NP;
      status  |= CD_STATUS_STANDBY;

      interrupt.status = 0xe0;
      interrupt.onhold = false;
      interrupt.onholdCause = 0;
      interrupt.onholdParam = {
        value: new UintBcap(8)
      };

      resetMotor(motorSeek);
      resetMotor(motorBase);
      resetMotor(motorRead);

      // CDVal
      resetVals(parameter);
      resetVals(result);
      resetVals(interrupt.onholdParam);

      // CDLoc
      resetLoc(seekLoc);
      resetLoc(destLoc);

      sector.bfr.fill(0);
      sector.firstRead = false;

      dma.bfr.fill(0);
      dma.size = 0;
      dma.pointer = 0;
      
      // ?
      kind  = blockEnd = reads = mode = 0;
      seeks = false;
      pause = false;
      mute  = false;
      retr  = false;
    },

    update() {
      // Seek
      if (motorSeek.enabled) {
        if ((motorSeek.sinc += ((mode & CD_MODE_SPEED) ? 2 : 1)) >= motorSeek.limit) {
          motorSeek.enabled = false;
          motorSeek.sinc    = 0;

          seekLoc.minute = destLoc.minute;
          seekLoc.sec    = destLoc.sec;
          seekLoc.frame  = destLoc.frame;

          status &= ~CD_STATUS_SEEK;
          invokeRead();
        }
      }

      // Base
      if (motorBase.enabled) {
        if (++motorBase.sinc >= motorBase.limit) {
          motorBase.enabled = false;
          motorBase.sinc    = 0;
          
          if ((interrupt.status & 0x07) === CD_NOINTR) {
            main();
            invokeInterrupt();
          }
          else {
            motorBase.enabled = true;
            motorBase.limit   = 13;
          }
        }
      }

      // Read
      if (motorRead.enabled) {
        if ((motorRead.sinc += ((mode & CD_MODE_SPEED) ? 2 : 1)) >= motorRead.limit) {
          motorRead.enabled = false;
          motorRead.sinc    = 0;
          
          if (((interrupt.status & 0x7) === CD_NOINTR) && (!(control & CD_CTRL_BUSY))) {
            cdromRead();
            if (reads) {
              invokeSeek();
            }
            invokeInterrupt();
          }
          else {
            psx.error('2');
          }
        }
      }
    },

    scopeW(addr, data) {
      switch(addr&0xf) {
        case 0: // Set Mode
          switch(data) {
            case 0x00:
              control &= ~(CD_CTRL_MODE0 | CD_CTRL_MODE1);
              return;

            case 0x01:
              control = (control | CD_CTRL_MODE0) & ~CD_CTRL_MODE1;
              return;

            case 0x02:
              control = (control | CD_CTRL_MODE1) & ~CD_CTRL_MODE0;
              return;

            case 0x03:
              control |= (CD_CTRL_MODE0 | CD_CTRL_MODE1);
              return;
          }
          psx.error('scopeW 0x1800 data '+hex(data));
          return;

        case 1:
          switch(control&0x03) {
            case 0x00:
              if (!interrupt.onhold) {
                if ((interrupt.status & 0x07) || (control & CD_CTRL_BUSY)) {
                  interrupt.onhold = true;
                  interrupt.onholdCause = data;
                  
                  interrupt.onholdParam.value.set(parameter.value);
                  interrupt.onholdParam.size    = parameter.size;
                  interrupt.onholdParam.pointer = parameter.pointer;
                  return;
                }

                command(data);
              }
              return;

            case 0x03:
              return;
          }
          psx.error('scopeW 0x1801 control&0x03 '+hex(control&0x03));
          return;

        case 2:
          switch(control&0x03) {
            case 0x00: // Insert Parameter
              if (parameter.pointer < 8) {
                parameter.value[parameter.pointer++] = data;
                parameter.size = parameter.pointer;
                control &= ~CD_CTRL_NP;
              }
              else {
                control &= ~CD_CTRL_PH;
              }
              return;

            case 0x01: // Parameter Operations
              switch(data) {
                case 0x07:
                case 0x1f:
                  parameterClear();
                  return;

                case 0x18:
                  return;
              }
              psx.error('scopeW 0x1802 01 data '+hex(data));
              return;

            case 0x02:
            case 0x03:
              return;
          }
          psx.error('scopeW 0x1802 control&0x03 '+hex(control&0x03));
          return;

        case 3:
          switch(control&0x03) {
            case 0x00: // Write DMA
              switch(data) {
                case 0x00:
                  return;

                case 0x80:
                  control |= CD_CTRL_DMA;
                  return;

                default:
                  psx.error('scopeW 0x1803 00 data '+hex(data));
                  return;
              }
              return;

            case 0x01: // Write Interrupt
              switch(data) {
                case 0x07:
                case 0x1f:
                  interrupt.status &= ~0x07;
                  break;

                case 0x40:
                  break;

                default:
                  psx.error('scopeW 0x1803 01 data '+hex(data));
                  break;
              }

              if (!(interrupt.status & 0x7) && interrupt.onhold) {
                interrupt.onhold = 0;
                parameter.value.set(interrupt.onholdParam.value);
                parameter.size    = interrupt.onholdParam.size;
                parameter.pointer = interrupt.onholdParam.pointer;
                command(interrupt.onholdCause);
              }
              return;

            case 0x02:
            case 0x03:
              return;
          }
          psx.error('scopeW 0x1803 control&0x03 '+hex(control&0x03));
          return;
      }
      psx.error('CD-ROM scopeW '+hex(addr)+' <- '+hex(data));
    },

    scopeR(addr) {
      switch(addr&0xf) {
        case 0:
          return control;

        case 1:
          switch(control&0x03) {
            case 0x01:
              if (control & CD_CTRL_RES) {
                var temp = result.value[result.pointer];

                if (result.pointer++ + 1 >= result.size) {
                  resultClear();
                }
                return temp;
              }
              return 0;
          }
          psx.error('scopeR 0x1801 control&0x03 '+hex(control&0x03));
          return 0;

        case 3:
          switch(control&0x03) {
            case 0x00: // Read DMA
              return 0xff;

            case 0x01: // Read interrupt
              return interrupt.status;

            default:
              psx.error('scopeR 0x1803 control&0x03 '+hex(control&0x03));
              return 0;
          }
          return 0;
      }
      psx.error('CD-ROM scopeR '+hex(addr));
    },

    executeDMA(addr) {
      var size = ((bcr>>16)*(bcr&0xffff)) * 4;

      if (!(control & CD_CTRL_DMA)) {
        psx.error('CD DMA !(CD->Control & CtrlDMA)');
      }

      if (!size) {
        psx.error('CD DMA !size');
      }

      if ((chcr & 0x01000000) === 0x01000000) {
        if ((dma.pointer + size) >= dma.size) {
          control &= ~CD_CTRL_DMA;
          size -= (dma.pointer + size) - dma.size;
          
          if (dma.pointer > dma.size) {
            psx.error('CD DMA error 1');
          }
        }

        var offset = madr&0x1fffff;
        for (var i=0; i<size; i++) {
          directMemB(ram.ub, i + offset) = dma.bfr[i + dma.pointer];
        }
        dma.pointer += size;
      }
    }
  };
})();

#undef ram
#undef hwr

#else



































// #define ram  mem.__ram
// #define hwr  mem.__hwr

// #define CD_STAT_NO_INTR     0
// #define CD_STAT_DATA_READY  1
// #define CD_STAT_COMPLETE    2
// #define CD_STAT_ACKNOWLEDGE 3
// #define CD_STAT_DISK_ERROR  5

// #define READ_ACK 250

// #define CD_REG(r)\
//   directMemB(hwr.ub, 0x1800|r)

// #define setResultSize(size)\
//   res.p  = 0;\
//   res.c  = size;\
//   res.ok = 1

// #define defaultCtrlAndStat()\
//   ctrl |= 0x80;\
//   stat = CD_STAT_NO_INTR;\
//   addIrqQueue(data)

// #define CD_INT()\
//   cdint = 1

// #define CDREAD_INT()\
//   cdreadint = 1

// #define startRead()\
//   reads = 1;\
//   readed = 0xff;\
//   addIrqQueue(READ_ACK)

// #define stopRead()\
//   if (reads) {\
//     reads = 0;\
//   }\
//   statP &= ~0x20

// pseudo.CstrCdrom = (function() {
//   var ctrl, stat, statP, irq, re2;
//   var reads, readed, occupied, seeked;
//   var cdint, cdreadint;

//   var param = {
//     data: new UintBcap(8),
//        p: 0,
//        c: 0,
//   };

//   var res = {
//     data: new UintBcap(8),
//       tn: new UintBcap(6),
//       td: new UintBcap(4),
//        p: 0,
//        c: 0,
//       ok: 0,
//   };

//   var sector = {
//     data: new UintBcap(4),
//     prev: new UintBcap(4)
//   };

//   var transfer = {
//     data: new UintBcap(2352),
//     p: 0
//   };

//   function addIrqQueue(code) {
//     irq = code;

//     if (stat) {
//     }
//     else {
//       CD_INT();
//     }
//   }

//   function interrupt() {
//     var prevIrq = irq;

//     if (stat) {
//       psx.error('CD interrupt / stat');
//     }

//     irq = 0xff;
//     ctrl &= ~0x80;

//     switch(prevIrq) {
//       case 1: // CdlNop
//         setResultSize(1);
//         statP |= 0x2;
//         res.data[0] = statP;
//         stat = CD_STAT_ACKNOWLEDGE; //More stuff here...
//         res.data[0] |= 0x2;
//         break;

//       case  2: // CdlSetLoc
//       case 14: // CdlSetMode
//         setResultSize(1);
//         statP |= 0x02;
//         res.data[0] = statP;
//         stat = CD_STAT_ACKNOWLEDGE;
//         break;

//       case 9: // CdlPause
//         setResultSize(1);
//         res.data[0] = statP;
//         stat = CD_STAT_ACKNOWLEDGE;
//         addIrqQueue(9 + 0x20);
//         ctrl |= 0x80;
//         break;
      
//       case 9 + 0x20: // CdlPause
//         setResultSize(1);
//         statP &= ~0x20;
//         statP |= 0x02;
//         res.data[0] = statP;
//         stat = CD_STAT_COMPLETE;
//         break;

//       case 10: // CdlInit
//         setResultSize(1);
//         statP |= 0x02;
//         res.data[0] = statP;
//         stat = CD_STAT_ACKNOWLEDGE;
//         addIrqQueue(10 + 0x20);
//         break;

//       case 10 + 0x20: // CdlInit
//         setResultSize(1);
//         res.data[0] = statP;
//         stat = CD_STAT_COMPLETE;
//         break;

//       case 21: // CdlSeekL
//         setResultSize(1);
//         statP |= 0x02;
//         res.data[0] = statP;
//         statP |= 0x40;
//         stat = CD_STAT_ACKNOWLEDGE;
//         seeked = 1;
//         addIrqQueue(21 + 0x20);
//         break;

//       case 21 + 0x20: // CdlSeekL
//         setResultSize(1);
//         statP |= 0x02;
//         statP &= ~0x40;
//         res.data[0] = statP;
//         stat = CD_STAT_COMPLETE;
//         break;

//       case 25: // CdlTest
//         stat = CD_STAT_ACKNOWLEDGE;
        
//         switch(param.data[0]) {
//           case 0x20:
//             setResultSize(4);
//             res.data.set([0x98, 0x06, 0x10, 0xc3]);
//             break;

//           default:
//             psx.error('CD interrupt / CdlTest -> '+param.data[0]);
//             break;
//         }
//         break;

//       case 26: // CdlId
//         setResultSize(1);
//         statP |= 0x02;
//         res.data[0] = statP;
//         stat = CD_STAT_ACKNOWLEDGE;
//         addIrqQueue(26 + 0x20);
//         break;

//       case 26 + 0x20: // CdlId
//         setResultSize(8);
//         res.data[0] = 0x00; //More stuff here...
//         res.data[1] = 0x00; // |= 0x80 for BIOS shell
//         res.data[2] = 0x00;
//         res.data[3] = 0x00;
//         stat = CD_STAT_COMPLETE;
//         break;

//       case 30: // CdlReadToc
//         setResultSize(1);
//         statP |= 0x02;
//         res.data[0] = statP;
//         stat = CD_STAT_ACKNOWLEDGE;
//         addIrqQueue(30 + 0x20);
//         break;

//       case READ_ACK:
//         if (!reads) {
//           psx.error('READ_ACK return');
//           //return;
//         }
//         setResultSize(1);
//         statP |= 0x02;
//         res.data[0] = statP;
        
//         if (!seeked) {
//           psx.error('READ_ACK !seeked');
//           // seeked = true;
//           // statP |= 0x40;
//         }
//         statP |= 0x20;
//         stat = CD_STAT_ACKNOWLEDGE;
        
//         CDREAD_INT();
//         break;

//       default:
//         psx.error('CD interrupt / prevIrq -> '+prevIrq);
//         break;
//     }

//     if (stat !== CD_STAT_NO_INTR && re2 !== 0x18) {
//         bus.interruptSet(IRQ_CD);
//     }
//   }

//   function trackRead() {
//     //console.log(sector.data[0]+' '+sector.data[1]+' '+sector.data[2]);
//     sector.prev[0] = INT2BCD(sector.data[0]);
//     sector.prev[1] = INT2BCD(sector.data[1]);
//     sector.prev[2] = INT2BCD(sector.data[2]);
    
//     psx.trackRead(sector.prev);
//   }

//   function interruptRead() {
//     if (!reads) {
//       psx.error('interruptRead !reads');
//       //return;
//     }
    
//     if (stat) {
//       psx.error('interruptRead stat');
//       // CDREAD_INT();
//       // return;
//     }

//     occupied = 1;
//     setResultSize(1);
//     statP |= 0x22;
//     statP &= ~0x40;
//     res.data[0] = statP;

//     trackRead();
    
//     var buf = psx.fetchBuffer();

//     // if (buf[0] === 0 && buf[1] === 0 && buf[2] === 0 & buf[3] === 0 && buf[4] === 0 && buf[5] === 0 && buf[6] === 0 && buf[7] === 0) {
//     //   transfer.data.fill(0);
//     //   stat = CD_STAT_DISK_ERROR;
//     //   res.data[0] |= 0x01;
//     //   CDREAD_INT();
//     //   return;
//     // }

//     for (var i=0; i<DATASIZE; i++) {
//       transfer.data[i] = buf[i];
//     }
//     stat = CD_STAT_DATA_READY;
    
//     sector.data[2]++;
//     if (sector.data[2] === 75) {
//       sector.data[2] = 0;
        
//       sector.data[1]++;
//       if (sector.data[1] === 60) {
//         sector.data[1] = 0;
//         sector.data[0]++;
//       }
//     }
//     readed = 0;
    
//     if ((transfer.data[4+2]&0x80) && (mode&0x02)) {
//       addIrqQueue(9); // CdlPause
//     }
//     else {
//       CDREAD_INT();
//     }
//     bus.interruptSet(IRQ_CD);
//   }

//   return {
//     reset() {
//       ctrl  = 0;
//       stat  = 0;
//       statP = 0;
//        irq  = 0;
//        re2  = 0;

//       param.data.fill(0);
//       param.p = 0;
//       param.c = 0;

//       res.data.fill(0);
//       res.  tn.fill(0);
//       res.  td.fill(0);
//       res.p  = 0;
//       res.c  = 0;
//       res.ok = 0;

//       sector.data.fill(0);
//       sector.prev.fill(0);

//       transfer.data.fill(0);
//       transfer.p = 0;

//       reads    = 0;
//       readed   = 0;
//       occupied = 0;
//       seeked   = 0;

//       cdint = cdreadint = 0;
//     },

//     scopeW(addr, data) {
//       switch(addr) {
//         case 0x1800:
//           ctrl = data | (ctrl & ~0x03);
    
//           if (!data) {
//             param.p = 0;
//             param.c = 0;
//             res.ok  = false;
//           }
//           return;

//         case 0x1801:
//           occupied = 0;
          
//           if (ctrl&0x01) {
//             return;
//           }

//           switch(data) {
//             case  1: // CdlNop
//             case 21: // CdlSeekL
//             case 25: // CdlTest
//             case 26: // CdlId
//             case 30: // CdlReadToc
//               defaultCtrlAndStat();
//               break;

//             case 2: // CdlSetLoc
//               stopRead();
//               seeked = 0;

//               for (var i=0; i<3; i++) {
//                 sector.data[i] = BCD2INT(param.data[i]);
//               }
//               sector.data[3] = 0;
//               defaultCtrlAndStat();
//               break;

//             case 6: // CdlReadN
//               irq = 0;
//               stopRead();
//               ctrl |= 0x80;
//               stat = CD_STAT_NO_INTR;
//               startRead();
//               break;

//             case 9: // CdlPause
//               stopRead();
//               defaultCtrlAndStat();
//               break;

//             case 10: // CdlInit
//               stopRead();
//               defaultCtrlAndStat();
//               break;

//             case 14: // CdlSetMode
//               mode = param.data[0];
//               defaultCtrlAndStat();
//               break;

//             default:
//               psx.error('S1 Command -> '+data);
//               break;
//           }

//           if (stat !== CD_STAT_NO_INTR) {
//             bus.interruptSet(IRQ_CD);
//           }
//           return;

//         case 0x1802:
//           if (ctrl&0x01) {
//             switch(data) {
//               case 7:
//                 param.p = 0;
//                 param.c = 0;
//                 res.ok  = 1;
//                 ctrl &= ~0x03;
//                 return;

//               default:
//                 re2 = data;
//                 return;
//             }
//           }
//           else if (!(ctrl&0x01) && param.p < 8) {
//             param.data[param.p++] = data;
//             param.c++;
//           }
//           return;

//         case 0x1803:
//           if (data === 0x07 && ctrl&0x01) {
//             stat = 0;
            
//             if (irq === 0xff) {
//               irq = 0;
//               return;
//             }
            
//             if (irq) {
//               CD_INT();
//             }
            
//             if (reads && !res.ok) {
//               CDREAD_INT();
//             }
            
//             return;
//           }

//           if (data === 0x80 && !(ctrl&0x01) && readed === 0) {
//             readed = 1;
//             transfer.p = 0;

//             switch(mode&0x30) {
//               case 0x00:
//                 transfer.p += 12;
//                 break;

//               default:
//                 psx.error('W 0x1803 2nd mode&0x30 '+(mode&0x30));
//                 break;
//             }
//           }
//           return;
//       }
//       psx.error('CD-ROM Write '+hex(addr)+' <- '+hex(data));
//     },

//     scopeR(addr) {
//       switch(addr) {
//         case 0x1800:
//           if (res.ok) {
//             ctrl |= 0x20;
//           }
//           else {
//             ctrl &= ~0x20;
//           }
          
//           if (occupied) {
//             ctrl |= 0x40;
//           }
//           ctrl |= 0x18;

//           return (CD_REG(0) = ctrl);

//         case 0x1801:
//           if (res.ok) {
//             CD_REG(1) = res.data[res.p++];
        
//             if (res.p === res.c) {
//               res.ok = 0;
//             }
//           }
//           else {
//             CD_REG(1) = 0;
//           }
//           return CD_REG(1);

//         case 0x1803:
//           if (stat) {
//             if (ctrl&0x01) {
//               CD_REG(3) = stat | 0xe0;
//             }
//             else {
//               CD_REG(3) = 0xff;
//             }
//           }
//           else {
//             CD_REG(3) = 0;
//           }
//           return CD_REG(3);
//       }
//       psx.error('CD-ROM Read '+hex(addr));
//     },

//     update() {
//       if (cdint) {
//         if (cdint++ >= 16) {
//           interrupt();
//           cdint = 0;
//         }
//       }

//       if (cdreadint) {
//         if (cdreadint++ >= 1024) {
//           interruptRead();
//           cdreadint = 0;
//         }
//       }
//     },

//     executeDMA(addr) {
//       var size = (bcr&0xffff) * 4;

//       switch(chcr) {
//         case 0x11000000:
//           if (!readed) {
//             break;
//           }
          
//           for (var i=0; i<size; i++) {
//             directMemB(ram.ub, i + madr) = transfer.data[i + transfer.p];
//           }
//           transfer.p += size;
//           break;

//         default:
//           psx.error('CD DMA -> '+hex(chcr));
//           break;
//       }
//     }
//   };
// })();

// #undef ram
// #undef hwr

// #endif

#define hwr  mem.__hwr

#define CD_REG(r)\
  directMemB(hwr.ub, 0x1800|r)

pseudo.CstrCdrom = (function() {
  var ctrl;
  var readed;
  var re2;
  var occupied;

  var param = {
    p: undefined
  };

  var res = {
    ok: undefined
  };

  function resetParam(prm) {
    prm.p = 0;
  }

  function resetRes(rrs) {
    rrs.ok = 0;
  }
  
  return {
    reset() {
      resetParam(param);
      resetRes(res);

      ctrl = 0;
      readed = 0;
      re2 = 0;
      occupied = 0;
    },

    update() {
    },

    scopeW(addr, data) {
      switch(addr&0xf) {
        case 0:
          ctrl = data | (ctrl & ~0x03);
          console.dir('0x1800 Ctrl -> '+hex(ctrl));

          if (!data) {
            psx.error('CD W 0x1800 !data');
          }
          break;

        case 1:
          psx.error('CD W '+hex(addr)+' <- '+hex(data));
          break;

        case 2:
          if (ctrl&0x01) {
            console.dir('CD W 0x1802 case 1 -> '+data);
            switch(data) {
              case 31:
                re2 = data;
                break;
                
              default:
                psx.error('CD W 0x1802 case 1 -> '+data);
                break;
            }
          }
          else if (!(ctrl&0x01) && param.p < 8) {
            psx.error('CD W 0x1802 case 2');
          }
          break;

        case 3:
          if (data == 0x07 && ctrl&0x01) {
            psx.error('CD W 0x1803 case 1');
          }
          
          if (data == 0x80 && !(ctrl&0x01) && readed == 0) {
            psx.error('CD W 0x1803 case 2');
          }
          break;
      }
    },

    scopeR(addr) {
      switch(addr&0xf) {
        case 0:
          if (res.ok) {
            psx.error('CD R 0x1800 case 1');
          }
          else {
            psx.error('CD R 0x1800 case 2');
          }
          
          if (occupied) {
            psx.error('CD R 0x1800 case 3');
          }
          
          ctrl |= 0x18;
          CD_REG(0) = ctrl;
          console.dir('CD R 0x1800 CD_REG(0) -> '+hex(CD_REG(0)));
          return CD_REG(0);

        case 1:
          psx.error('CD R '+hex(addr));
          return 0;

        case 2:
          psx.error('CD R '+hex(addr));
          return 0;

        case 3:
          psx.error('CD R '+hex(addr));
          return 0;
      }
    },

    executeDMA(addr) {
      psx.error('CD DMA '+hex(addr));
    }
  };
})();

#undef hwr

#endif
