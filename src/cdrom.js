// #define hwr  mem.__hwr

// #define CD_STAT_NO_INTR     0
// #define CD_STAT_ACKNOWLEDGE 3

// #define CD_REG(r)\
//   directMemB(hwr.ub, 0x1800|r)

// #define setResultSize(size)\
//   res.p  = 0;\
//   res.c  = size;\
//   res.ok = true

// #define defaultCtrlAndStat(code)\
//   ctrl |= 0x80;\
//   stat = CD_STAT_NO_INTR;\
//   addIrqQueue(data, code)

// #define CD_INT(end)\
//   cdint = 1

// pseudo.CstrCdrom = (function() {
//   var ctrl, stat, irq, re2;
//   var reads, readed, occupied;
//   var cdint;

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

//   function addIrqQueue(code, end) {
//     irq = code;
    
//     if (stat) {
//       psx.error('addIrqQueue stat');
//       //end_time = end;
//     }
//     else {
//       CD_INT(end);
//     }
//   }

//   function interrupt() {
//     psx.error('CD interrupt');
//   }

//   return {
//     reset() {
//       ctrl = 0;
//       stat = 0;
//        irq = 0;
//        re2 = 0;

//       param.data.fill(0);
//       param.p = 0;
//       param.c = 0;

//       res.data.fill(0);
//       res.  tn.fill(0);
//       res.  td.fill(0);
//       res.p  = 0;
//       res.c  = 0;
//       res.ok = 0;

//       reads    = false;
//       readed   = false;
//       occupied = false;

//       cdint = 0;
//     },

//     scopeW(addr, data) {
//       switch(addr) {
//         case 0x1800:
//           ctrl = data | (ctrl&(~0x03));
    
//           if (!data) {
//             param.p = 0;
//             param.c = 0;
//             res.ok  = false;
//           }
//           return;

//         case 0x1801:
//           occupied = false;
          
//           if (ctrl&0x01) {
//             return;
//           }

//           switch(data) {
//             case 25: // CdlTest
//               defaultCtrlAndStat(0x1000);
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
//                 ctrl &= ~0x03;
//                 param.p = 0;
//                 param.c = 0;
//                 res.ok  = true;
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
//               psx.error('irq == 0xff');
//             }
            
//             if (irq) {
//               psx.error('if (irq)');
//             }
            
//             if (reads && !res.ok) {
//               psx.error('reads && !res.ok');
//             }
            
//             return;
//           }

//           if (data === 0x80 && !(ctrl&0x01) && readed === false) {
//             psx.error('W 0x1803 2nd');
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
//             psx.error('R 0x1803 occupied');
//           }
          
//           ctrl |= 0x18;
//           return CD_REG(0) = ctrl;

//         case 0x1801:
//           if (res.ok) {
//             CD_REG(1) = res.data[res.p++];
        
//             if (res.p === res.c) {
//               res.ok = false;
//             }
//           }
//           else {
//             psx.error('R 0x1801 else');
//             //CD_REG(1) = 0;
//           }
//           return CD_REG(1);

//         case 0x1803:
//           if (stat) {
//             if (ctrl&0x01) {
//               CD_REG(3) = stat | 0xe0;
//             }
//             else {
//               psx.error('R 0x1803 stat 2');
//               //CD_REG(3) = 0xff;
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
//         if (cdint++ === 16) {
//           interrupt();
//           cdint = 0;
//         }
//       }
//     }
//   };
// })();

// #undef hwr

#define CD_NOINTR      0x00
#define CD_ACKNOWLEDGE 0x03

#define CD_CTRL_MODE0 0x01
#define CD_CTRL_MODE1 0x02
#define CD_CTRL_NP    0x08
#define CD_CTRL_PH    0x10
#define CD_CTRL_RES   0x20
#define CD_CTRL_BUSY  0x80

#define CD_STATUS_ERROR   0x01
#define CD_STATUS_STANDBY 0x02

#define	CD_CMD_BLOCKING    0
#define CD_CMD_NONBLOCKING 1

#define invokeBase()\
  motorBase.enabled = 1;\
  motorBase.limit   = motorBase.sinc + 0x10;\
  control |= CD_CTRL_BUSY

#define invokeInterrupt()\
  if (interrupt.status & 0x7) {\
    bus.interruptSet(IRQ_CD);\
  }

pseudo.CstrCdrom = (function() {
  var busres = new UintBcap(8);
  var buspar = new UintBcap(8);
  var control, status;
  var interrupt = {};
  var kind, blockEnd;
  var motorSeek = {}, motorBase = {}, motorRead = {};

  return {
    reset() {
      busres.fill(0);
      buspar.fill(0);

      control |= CD_CTRL_PH | CD_CTRL_NP;
      status  |= CD_STATUS_STANDBY;

      interrupt.status = 0xe0;
      interrupt.onhold = 0;

      // Seek Motor
      motorSeek.enabled = false;
      motorSeek.sinc  = 0;
      motorSeek.limit = 0;

      // Base Motor
      motorBase.enabled = false;
      motorBase.sinc  = 0;
      motorBase.limit = 0;

      // Read Motor
      motorRead.enabled = false;
      motorRead.sinc  = 0;
      motorRead.limit = 0;
      
      // ?
      kind = 0;
      blockEnd = 0;
    },

    update() {
      if (motorSeek.enabled) {
        psx.error('motorSeek.enabled');
      }

      if (motorBase.enabled) {
        if (++motorBase.sinc >= motorBase.limit) {
          motorBase.enabled = 0;
          motorBase.sinc    = 0;
          
          if ((interrupt.status & 0x7) === CD_NOINTR) {
            // Remember to reset "result" here !!!!!!!!!!!!!!!!!!
            control &= ~(CD_CTRL_RES | CD_CTRL_BUSY);
            interrupt.status = (interrupt.status & 0xf8) | CD_ACKNOWLEDGE;
            
            if (status & CD_STATUS_ERROR) {
              psx.error('status & CD_STATUS_ERROR');
            }

            invokeInterrupt();
          }
          else {
            psx.error('(interrupt.status & 0x7) === CD_NOINTR else');
          }

          for (var i=0; (i < 8) && (buspar[i] !== 0); buspar[i++] = 0) {
            buspar[i] = param.value[i];
          }
        }
      }

      if (motorRead.enabled) {
        psx.error('motorRead.enabled');
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
          }
          psx.error('scopeW 0x1800 data '+hex(data));
          return;

        case 1:
          switch(control&0x03) {
            case 0x00:
              if (!interrupt.onhold) {
                if ((interrupt.status & 0x7) || (control & CD_CTRL_BUSY)) {
                  psx.error('(interrupt.status & 0x7) || (control & CD_CTRL_BUSY)');
                  //return;
                }

                // Command
                if (data < 0x20) {
                  switch(data) {
                    case 0x01: // CdlNop
                      busres[0] = status;
                      kind = CD_CMD_BLOCKING;
                      break;

                    default:
                      psx.error('Execute command -> '+hex(data));
                      break;
                  }
                }
                else {
                  psx.error('data < 0x20 else');
                  //busres[0] = status;
                  //kind = CD_CMD_BLOCKING;
                }
                
                invokeBase();
                blockEnd = 0;
              }
              return;
          }
          psx.error('scopeW 0x1801 control&0x03 '+hex(control&0x03));
          return;

        case 3:
          switch(control&0x03) {
            case 0x00: // Write DMA
              switch(data) {
                case 0x00:
                  return;
              }
              psx.error('scopeW 0x1803 data '+hex(data));
              return;
          }
          psx.error('scopeW 0x1803 control&0x03 '+hex(control&0x03));
          return;
      }
      psx.error('CD-ROM scopeW '+hex(addr)+' <- '+hex(data));
    },

    scopeR(addr) {
      switch(addr&0xf) {
        case 3:
          switch(control&0x03) {
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
