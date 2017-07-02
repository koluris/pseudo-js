pseudo.CstrInterrupts = (function() {
  const ints = [{
    code: IRQ_VSYNC,
    dest: 1
  }];

  return {
    reset() {
      for (let i=0; i<1; i++) {
        ints[i].queued = 0;
      }
    },

    update() {
      for (let i=0; i<1; i++) {
        if (ints[i].queued) {
          if (ints[i].queued++ === ints[i].dest) {
            data16 |= (1<<ints[i].code);
            ints[i].queued = 0;
            break;
          }
        }
      }
    },

    set(code) {
      ints[code].queued = 1;
    }
  };
})();
