#define IRQ_QUEUED_YES 1
#define IRQ_QUEUED_NO  0

pseudo.CstrInterrupts = (function() {
  const ints = [{
    code: IRQ_VSYNC,
    dest: 1
  }];

  return {
    reset() {
      for (let i=0; i<1; i++) {
        ints[i].queued = IRQ_QUEUED_NO;
      }
    },

    update() {
      for (let i=0; i<1; i++) {
        if (ints[i].queued) {
          if (ints[i].queued++ === ints[i].dest) {
            data16 |= (1<<ints[i].code);
            ints[i].queued = IRQ_QUEUED_NO;
            break;
          }
        }
      }
    },

    set(code) {
      ints[code].queued = IRQ_QUEUED_YES;
    }
  };
})();
