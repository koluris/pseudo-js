#define IRQ_QUEUED_YES 1
#define IRQ_QUEUED_NO  0

#define pcr\
  directMemW(mem._hwr.uw, 0x10f0)

#define icr\
  directMemW(mem._hwr.uw, 0x10f4)

#define madr\
  directMemW(mem._hwr.uw, (addr&0xfff0)|0)

#define bcr\
  directMemW(mem._hwr.uw, (addr&0xfff0)|4)

#define chcr\
  directMemW(mem._hwr.uw, (addr&0xfff0)|8)

pseudo.CstrBus = (function() {
  const interrupt = [{
    code: IRQ_VSYNC,
    dest: 1
  }, {
    code: IRQ_GPU,
    dest: 1
  }, {
    code: IRQ_CD,
    dest: 4
  }, {
    code: IRQ_DMA,
    dest: 1
  }, {
    code: IRQ_RTC0,
    dest: 1
  }, {
    code: IRQ_RTC1,
    dest: 1
  }, {
    code: IRQ_RTC2,
    dest: 1
  }, {
    code: IRQ_SIO0,
    dest: 8
  }, {
    code: IRQ_SIO1,
    dest: 8
  }, {
    code: IRQ_SPU,
    dest: 1
  }, {
    code: IRQ_PIO,
    dest: 1
  }];

  return {
    reset() {
      // Interrupts
      for (let i=0; i<11; i++) {
        interrupt[i].queued = IRQ_QUEUED_NO;
      }
    },

    interruptsUpdate() {
      for (let i=0; i<11; i++) { // Turn it up to 11 :)
        var irq = interrupt[i];
        if (irq.queued) {
          if (irq.queued++ === irq.dest) {
            data16 |= (1<<irq.code);
            irq.queued = IRQ_QUEUED_NO;
            break;
          }
        }
      }
    },

    interruptSet(n) {
      interrupt[n].queued = IRQ_QUEUED_YES;
    },

    executeDMA(addr, data) {
      const chan = ((addr>>>4)&0xf) - 8;

      if (pcr&(8<<(chan*4))) { //GPU does not execute sometimes.
        chcr = data;
        console.dir(chan);
        chcr = data&(~(0x01000000));

        if (icr&(1<<(16+chan))) {
          icr |= 1<<(24+chan);
          bus.interruptSet(IRQ_DMA);
        }
      }
    }
  };
})();