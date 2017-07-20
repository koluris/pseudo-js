// Based on Mizvekov`s work, circa 2001. Thanks a lot!

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
  if (interrupt.status & 0x7) {\
    bus.interruptSet(IRQ_CD);\
  }

#define parameterClear()\
  resetVals(parameter);\
  control |= CD_CTRL_NP | CD_CTRL_PH

#define resultClear(Cd)\
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
    resetVals(result);
    control &= ~(CD_CTRL_RES | CD_CTRL_BUSY);
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
          invokeBase();
          control |=  CD_CTRL_RES;
          control &= ~CD_CTRL_BUSY;
          motorBase.limit = motorBase.sinc + 39;
          result.value[0] = status;
          result.size = 1;
          result.pointer = 0;
          seeks = false;
          blockEnd = 1;
          return;
        }
      }
    }

    for (var i=0; (i < 8) && (buspar[i] !== 0); buspar[i++] = 0) {
      buspar[i] = param.value[i];
    }
    parameterClear();

    for (var i=0; (i < 8) && (busres[i] !== 0); busres[i++] = 0) {
      control |= CD_CTRL_RES;
      result.value[i] = busres[i];
      result.size     = i + 1;
      result.pointer  = 0;
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

        case 0x0a: // CdlInit
          stopRead();
          status |= CD_STATUS_STANDBY;
          busres[0] = status;
          mode = 0;
          kind = CD_CMD_NONBLOCKING;
          break;

        case 0x0c: // CdlDemute
          mute = 0;
          busres[0] = status;
          kind = CD_CMD_BLOCKING;
          break;

        case 0x0e: // CdlSetMode
          buspar[0] = mode;
          busres[0] = status;
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
          busres.set([0x00, 0x00, 0x00, 0x00, 'S', 'C', 'E', 'A']);
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
      if (psx.trackRead(seekLoc) === -1) {
        psx.error('*** reads 1');
      }
      else if (psx.fetchBuffer() === 0) {
        temp |= 0x02;
      }
      else {
        sector.bfr.set(psx.fetchBuffer());
      }

      if (status & CD_STATUS_SHELL) {
        psx.error('*** status & CD_STATUS_SHELL');
      }

      if (sector.bfr[0] === seekLoc.minute && sector.bfr[1] === seekLoc.sec && sector.bfr[2] === seekLoc.frame) {
        temp |= 0x08;
      }
      
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
        default:
          psx.error('((mode & (CD_MODE_SIZE0 | CD_MODE_SIZE1)) >> 4)');
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
        if ((motorSeek.sinc += (mode & CD_MODE_SPEED ? 2 : 1)) >= motorSeek.limit) {
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
        if ((motorRead.sinc += (mode & CD_MODE_SPEED ? 2 : 1)) >= motorRead.limit) {
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
              }
              psx.error('scopeW 0x1803 00 data '+hex(data));
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
                parameter = interrupt.onholdParam;
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
    }
  };
})();
