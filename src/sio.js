#define SIO_STAT_TX_READY      0x001
#define SIO_STAT_RX_READY      0x002
#define SIO_STAT_TX_EMPTY      0x004
#define SIO_STAT_PARITY_ERROR  0x008
#define SIO_STAT_RX_OVERRUN    0x010
#define SIO_STAT_FRAMING_ERROR 0x020
#define SIO_STAT_SYNC_DETECT   0x040
#define SIO_STAT_DSR           0x080
#define SIO_STAT_CTS           0x100
#define SIO_STAT_IRQ           0x200

#define SIO_CTRL_TX_PERM       0x001
#define SIO_CTRL_DTR           0x002
#define SIO_CTRL_RX_PERM       0x004
#define SIO_CTRL_BREAK         0x008
#define SIO_CTRL_RESET_ERROR   0x010
#define SIO_CTRL_RTS           0x020
#define SIO_CTRL_RESET         0x040

pseudo.CstrSerial = (function() {
  let baud, control, mode, status, bfr, bfrCount, padst, parp;

  return {
    reset() {
      baud     = 0;
      control  = 0;
      mode     = 0;
      status   = SIO_STAT_TX_READY | SIO_STAT_TX_EMPTY;
      bfr      = new UintBcap(256);
      bufcount = 0;
      padst    = 0;
      parp     = 0;
    },

    write: {
      h(addr, data) {
        switch(addr) {
          case 0x1048: // Mode
            mode = data;
            return;

          case 0x104a: // Control
            control = data;

            if (control&SIO_CTRL_RESET_ERROR) {
              status  &= (~SIO_STAT_IRQ);
              control &= (~SIO_CTRL_RESET_ERROR);
            }

            if (control&SIO_CTRL_RESET || !control) {
              status = SIO_STAT_TX_READY | SIO_STAT_TX_EMPTY;
              padst  = 0;
              parp   = 0;
            }
            return;

          case 0x104e: // Baud
            baud = data;
            return;
        }
        psx.error('SIO write h '+hex(addr)+' <- '+hex(data));
      },

      b(addr, data) {
        switch(addr) {
          case 0x1040:
            {
              switch(padst) {
                case 1:
                  if (data&0x40) {
                    padst = 2;
                    parp  = 1;

                    switch(data) {
                      case 0x42:
                        bfr[1] = 0x41; //parp
                        break;

                      default:
                        console.dir('SIO write b data '+hex(data));
                        break;
                    }
                  }
                  else {
                    psx.error('SIO write b else');
                  }
                  bus.interruptSet(IRQ_SIO0);
                  return;

                case 2:
                  parp++;
                  
                  if (parp !== bfrCount) {
                    bus.interruptSet(IRQ_SIO0);
                  }
                  else {
                    padst = 0;
                  }
                  return;

                default:
                  console.dir('SIO write b 0x1040 padst '+padst);
                  break;
              }

              if (data === 1) {
                status &= !SIO_STAT_TX_EMPTY;
                status |=  SIO_STAT_RX_READY;
                padst = 1;
                parp  = 0;

                if (control&SIO_CTRL_DTR) {
                  switch(control) {
                    case 0x1003:
                    case 0x3003:
                      bfrCount = 4;
                      bfr[0] = 0x00;
                      bfr[1] = 0x41;
                      bfr[2] = 0x5a;
                      bfr[3] = 0xff;
                      bfr[4] = 0xff;
                      bus.interruptSet(IRQ_SIO0);
                      return;
                  }
                  psx.error('SIO write b control '+hex(control));
                }
              }
              else if (data === 0x81) {
                psx.error('SIO write b data === 0x81');
              }
            }
            return;
        }
        psx.error('SIO write b '+hex(addr)+' <- '+hex(data));
      }
    },

    read: {
      h(addr) {
        switch(addr) {
          case 0x1044:
            return status;

          case 0x104a:
            return control;
        }
        psx.error('SIO read h '+hex(addr));
      },

      b(addr) {
        switch(addr) {
          case 0x1040:
            {
              if (!(status&SIO_STAT_RX_READY)) {
                return 0;
              }

              const data = bfr[parp];

              if (parp === bfrCount) {
                status &= (~(SIO_STAT_RX_READY));
                status |= SIO_STAT_TX_EMPTY;

                if (padst === 2) {
                  //padst = 0;
                  psx.error('SIO read b padst == 2');
                }
              }
              return data;
            }
        }
        psx.error('SIO read b '+hex(addr));
      }
    }
  };
})();
