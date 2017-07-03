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
  }];

  return {
    reset() {
      // Interrupts
      for (let i=0; i<1; i++) {
        interrupt[i].queued = IRQ_QUEUED_NO;
      }
    },

    interruptsUpdate() {
      for (let i=0; i<1; i++) { // Turn it up to 11 :)
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
      console.dir(chan);
    }
  };
})();
