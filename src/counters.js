pseudo.CstrCounters = (function() {
  let timer;
  let vbk;

  // Exposed class functions/variables
  return {
    awake() {
      timer = [];
    },

    reset() {
      for (let i=0; i<3; i++) {
        timer[i] = {
          bound: PSX_BOUND
        };
      }

      vbk = 0;
    },

    update() {
      if ((vbk += PSX_CYCLE) === PSX_VSYNC) { vbk = 0;
        bus.interruptSet(IRQ_VSYNC);
        r3ka.setbp();
      }
    }
  };
})();
