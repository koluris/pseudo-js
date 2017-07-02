#define PSX_CLK\
  33868800

#define PSX_VSYNC\
  PSX_CLK/60

#define PSX_CYCLE\
  64

#define PSX_BOUND\
  0xffff

pseudo.CstrCounters = (function() {
  var timer;
  var vbk;

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
        interrupts.set(IRQ_VSYNC);
      }
    }
  };
})();
