#define RTC_PORT(addr)\
  (addr>>>4)&3

#define RTC_COUNT  0
#define RTC_MODE   4
#define RTC_TARGET 8

#define RTC_BOUND\
  0xffff

pseudo.CstrCounters = (function() {
  let timer;
  let vbk, dec1;

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

      // timer[0].count += timer[0].mode&0x100 ? PSX_CYCLE : PSX_CYCLE/8;

      // if (timer[0].count >= timer[0].bound) {
      //   timer[0].count = 0;
      //   if (timer[0].mode&0x50) {
      //     //bus.interruptSet(IRQ_RTC0);
      //     psx.error('dude 1');
      //   }
      // }

      // if (!(timer[1].mode&0x100)) {
      //   timer[1].count += PSX_CYCLE;

      //   if (timer[1].count >= timer[1].bound) {
      //     timer[1].count = 0;
      //     if (timer[1].mode&0x50) {
      //       //bus.interruptSet(IRQ_RTC1);
      //       psx.error('dude 2');
      //     }
      //   }
      // }
      // else if ((dec1+=PSX_CYCLE) >= PSX_HSYNC) {
      //   dec1 = 0;
      //   if (++timer[1].count >= timer[1].bound) {
      //     timer[1].count = 0;
      //     if (timer[1].mode&0x50) {
      //       bus.interruptSet(IRQ_RTC1);
      //     }
      //   }
      // }

      // if (!(timer[2].mode&1)) {
      //   timer[2].count += timer[2].mode&0x200 ? PSX_CYCLE/8 : PSX_CYCLE;

      //   if (timer[2].count >= timer[2].bound) {
      //     timer[2].count = 0;
      //     if (timer[2].mode&0x50) {
      //       bus.interruptSet(IRQ_RTC2);
      //     }
      //   }
      // }
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
