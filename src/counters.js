#define RTC_PORT(addr)\
  (addr>>>4)&3

#define RTC_COUNT  0
#define RTC_MODE   4
#define RTC_TARGET 8

#define RTC_BOUND\
  0xffff

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
          mode  : 0,
          count : 0,
          dest  : 0,
          bound : RTC_BOUND
        };
      }

      vbk = 0;
    },

    update() {
      if ((vbk += PSX_CYCLE) === PSX_VSYNC) { vbk = 0;
         bus.interruptSet(IRQ_VSYNC);
          vs.redraw();
        r3ka.setbp();
      }
    },

    scopeW(addr, data) {
      //console.dir(((addr&0xf)>>>2)+' '+(RTC_PORT(addr)));
      const p = RTC_PORT(addr);

      switch (addr&0xf) {
        case RTC_COUNT:
          timer[p].count = data&0xffff;
          return;

        case RTC_MODE:
          timer[p].mode  = data;
          timer[p].bound = timer[p].mode&8 ? timer[p].dest : RTC_BOUND;
          return;

        case RTC_TARGET:
          timer[p].dest  = data&0xffff;
          timer[p].bound = timer[p].mode&8 ? timer[p].dest : RTC_BOUND;
          return;
      }

      psx.error('RTC Write '+hex(addr&0xf)+' <- '+hex(data));
    },

    scopeR(addr) {
      const p = RTC_PORT(addr);

      switch (addr&0xf) {
        case RTC_COUNT:
          return timer[p].count;

        case RTC_MODE:
          return timer[p].mode;

        case RTC_TARGET:
          return timer[p].dest;
      }

      psx.error('RTC Read '+hex(addr&0xf));
      return 0;
    }
  };
})();
