// Based on Mizvekov's work, circa 2001. Thanks a lot!

// Sector Buffer Status
#define CD_NOINTR      0x00
#define CD_COMPLETE    0x02
#define CD_ACKNOWLEDGE 0x03

// Control
#define CD_CTRL_MODE0 0x01
#define CD_CTRL_MODE1 0x02
#define CD_CTRL_NP    0x08
#define CD_CTRL_PH    0x10
#define CD_CTRL_RES   0x20
#define CD_CTRL_BUSY  0x80

// Status
#define CD_STATUS_ERROR   0x01
#define CD_STATUS_STANDBY 0x02
#define CD_STATUS_READ    0x20
#define CD_STATUS_SEEK    0x40
#define CD_STATUS_PLAY    0x80

// Command Mode
#define	CD_CMD_BLOCKING    0
#define CD_CMD_NONBLOCKING 1

#define invokeBase()\
  motorBase.enabled = true;\
  motorBase.limit = motorBase.sinc + 0x10;\
  control |= CD_CTRL_BUSY

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
  var kind, blockEnd, seeks, reads, pause, mute;
  var motorSeek = {}, motorBase = {}, motorRead = {};
  
  var parameter = {
    value: new UintBcap(8)
  };

  var result = {
    value: new UintBcap(8)
  }

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

  return {
    reset() {
      busres.fill(0);
      buspar.fill(0);

      control |= CD_CTRL_PH | CD_CTRL_NP;
      status  |= CD_STATUS_STANDBY;

      interrupt.status = 0xe0;
      interrupt.onhold = 0;

      resetMotor(motorSeek);
      resetMotor(motorBase);
      resetMotor(motorRead);

      // CDVal
      resetVals(parameter);
      resetVals(result);
      
      // ?
      kind  = blockEnd = seeks = reads = 0;
      pause = false;
      mute  = false;
    },

    update() {
      // Seek
      if (motorSeek.enabled) {
        psx.error('motorSeek.enabled');
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
              return;

            case 0x03:
              return;
          }
          psx.error('scopeW 0x1801 control&0x03 '+hex(control&0x03));
          return;

        case 2:
          switch(control&0x03) {
            case 0x01: // Parameter Operations
              switch(data) {
                case 0x07:
                  parameterClear();
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
                  interrupt.status &= ~0x07;
                  return;
              }
              psx.error('scopeW 0x1803 01 data '+hex(data));
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
