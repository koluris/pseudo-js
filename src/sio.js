// Based on PCSX 1.5

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

#define btnCheck(btn) \
    if (pushed) { \
        btnState &=  (0xffff ^ (1 << btn)); \
    } \
    else { \
        btnState |= ~(0xffff ^ (1 << btn)); \
    }

pseudo.CstrSerial = (function() {
  const PAD_BTN_SELECT   =  0;
  const PAD_BTN_START    =  3;
  const PAD_BTN_UP       =  4;
  const PAD_BTN_RIGHT    =  5;
  const PAD_BTN_DOWN     =  6;
  const PAD_BTN_LEFT     =  7;
  const PAD_BTN_L2       =  8;
  const PAD_BTN_R2       =  9;
  const PAD_BTN_L1       = 10;
  const PAD_BTN_R1       = 11;
  const PAD_BTN_TRIANGLE = 12;
  const PAD_BTN_CIRCLE   = 13;
  const PAD_BTN_CROSS    = 14;
  const PAD_BTN_SQUARE   = 15;

  var baud, control, mode, status, padst, parp;
  var bfr = new UintBcap(256);

  return {
    reset() {
      ioZero(bfr);
      btnState = 0xffff;
      baud     = 0;
      control  = 0;
      mode     = 0;
      status   = SIO_STAT_TX_READY | SIO_STAT_TX_EMPTY;
      padst    = 0;
      parp     = 0;

      bfr[0] = 0x00;
      bfr[1] = 0x41;
      bfr[2] = 0x5a;
      bfr[3] = 0xff;
      bfr[4] = 0xff;
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
              status  &= ~SIO_STAT_IRQ;
              control &= ~SIO_CTRL_RESET_ERROR;
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
        psx.error('SIO write h '+psx.hex(addr)+' <- '+psx.hex(data));
      },

      b(addr, data) {
        switch(addr) {
          case 0x1040:
            switch(padst) {
              case 1:
                if (data&0x40) {
                  padst = 2;
                  parp  = 1;

                  switch(data) {
                    case 0x42:
                      bfr[1] = 0x41;
                      break;

                    case 0x43:
                      bfr[1] = 0x43;
                      break;

                    default:
                      console.dir('SIO write b data '+psx.hex(data));
                      break;
                  }
                }
                bus.interruptSet(IRQ_SIO0);
                return;

              case 2:
                parp++;
                
                if (parp !== 5) {
                  bus.interruptSet(IRQ_SIO0);
                }
                else {
                  padst = 0;
                }
                return;
            }

            if (data === 1) {
              status &= ~SIO_STAT_TX_EMPTY;
              status |=  SIO_STAT_RX_READY;
              padst = 1;
              parp  = 0;

              if (control & SIO_CTRL_DTR) {
                bus.interruptSet(IRQ_SIO0);
              }
            }
            return;
        }
        psx.error('SIO write b '+psx.hex(addr)+' <- '+psx.hex(data));
      }
    },

    read: {
      h(addr) {
        switch(addr) {
          case 0x1044:
            return status;

          case 0x104a:
            return control;

          case 0x104e:
            return baud;
        }
        psx.error('SIO read h '+psx.hex(addr));
      },

      b(addr) {
        switch(addr) {
          case 0x1040:
            {
              if (!(status & SIO_STAT_RX_READY)) {
                return 0;
              }

              if (parp === 5) {
                status &= (~(SIO_STAT_RX_READY));
                status |= SIO_STAT_TX_EMPTY;
              }
              return bfr[parp];
            }
        }
        psx.error('SIO read b '+psx.hex(addr));
      }
    },

    padListener(code, pushed) {
      if (code == 49) { // Start
        btnCheck(PAD_BTN_START);
      }

      if (code == 90) { // X
        btnCheck(PAD_BTN_CROSS);
      }

      bfr[3] = (btnState >>> 0) & 0xff;
      bfr[4] = (btnState >>> 8) & 0xff;
    }
  };
})();
