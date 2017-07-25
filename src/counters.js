#define hwr  mem.__hwr

#define count(n) directMemH(hwr.uh, 0x1100+(n<<4))
#define  mode(n) directMemW(hwr.uw, 0x1104+(n<<4))
#define   dst(n) directMemH(hwr.uh, 0x1108+(n<<4))
#define bound(n) timer[n].__bound

#define RTC_PORT(addr)\
  (addr>>>4)&3

#define RTC_BOUND\
  0xffff

pseudo.CstrCounters = (function() {
  var timer = [];
  var vbk, hsc;

  return {
    reset() {
      for (var i=0; i<3; i++) {
        timer[i] = {
          __bound : RTC_BOUND
        };
      }

      vbk = 0;
      hsc = 0;
    },

    update() {
      count(0) += mode(0)&0x100 ? PSX_CYCLE : PSX_CYCLE/8;

      if (count(0) >= bound(0)) {
        count(0) = 0;
        if (mode(0)&0x50) {
          //bus.interruptSet(IRQ_RTC0);
          psx.error('IRQ_RTC0');
        }
      }

      if (!(mode(1)&0x100)) {
        count(1) += PSX_CYCLE;

        if (count(1) >= bound(1)) {
          count(1) = 0;
          if (mode(1)&0x50) {
            //bus.interruptSet(IRQ_RTC1);
            psx.error('IRQ_RTC1');
          }
        }
      }
      else if ((hsc += PSX_CYCLE) >= PSX_HSYNC) { hsc = 0;
        if (++count(1) >= bound(1)) {
          count(1) = 0;
          if (mode(1)&0x50) {
            bus.interruptSet(IRQ_RTC1);
          }
        }
      }

      if (!(mode(2)&1)) {
        count(2) += mode(2)&0x200 ? PSX_CYCLE/8 : PSX_CYCLE;

        if (count(2) >= bound(2)) {
          count(2) = 0;
          if (mode(2)&0x50) {
            bus.interruptSet(IRQ_RTC2);
          }
        }
      }

      if ((vbk += PSX_CYCLE) >= PSX_VSYNC) { vbk = 0;
        bus.interruptSet(IRQ_VSYNC);
         vs.redraw();
        cpu.setbp();
      }
    },

    scopeW(addr, data) {
      var p = RTC_PORT(addr);

      switch(addr&0xf) {
        case 0:
          count(p) = data&0xffff;
          return;

        case 4:
           mode(p) = data;
          bound(p) = mode(p)&8 ? dst(p) : RTC_BOUND;
          return;

        case 8:
            dst(p) = data&0xffff;
          bound(p) = mode(p)&8 ? dst(p) : RTC_BOUND;
          return;
      }

      psx.error('RTC Write '+hex(addr&0xf)+' <- '+hex(data));
    },

    scopeR(addr) {
      var p = RTC_PORT(addr);

      switch(addr&0xf) {
        case 0:
          return count(p);

        case 4:
          return mode(p);

        case 8:
          return dst(p);
      }

      psx.error('RTC Read '+hex(addr&0xf));
      return 0;
    }
  };
})();

#undef hwr

// #define RTC_COUNT  0
// #define RTC_MODE   4
// #define RTC_TARGET 8

// #define RTC_PORT(addr)\
//   (addr>>>4)&3

// #define RTC_BOUND\
//   0xffff

// pseudo.CstrCounters = (function() {
//   var timer = [];
//   var vbk, hsc;

//   // Exposed class functions/variables
//   return {
//     reset() {
//       for (var i=0; i<3; i++) {
//         timer[i] = {
//           mode  : 0,
//           count : 0,
//           dest  : 0,
//           bound : RTC_BOUND
//         };
//       }

//       vbk = 0;
//       hsc = 0;
//     },

//     update() {
//       timer[0].count += timer[0].mode&0x100 ? PSX_CYCLE : PSX_CYCLE/8;

//       if (timer[0].count >= timer[0].bound) {
//         timer[0].count = 0;
//         if (timer[0].mode&0x50) {
//           //bus.interruptSet(IRQ_RTC0);
//           psx.error('IRQ_RTC0');
//         }
//       }

//       if (!(timer[1].mode&0x100)) {
//         timer[1].count += PSX_CYCLE;

//         if (timer[1].count >= timer[1].bound) {
//           timer[1].count = 0;
//           if (timer[1].mode&0x50) {
//             //bus.interruptSet(IRQ_RTC1);
//             psx.error('IRQ_RTC1');
//           }
//         }
//       }
//       else if ((hsc += PSX_CYCLE) >= PSX_HSYNC) { hsc = 0;
//         if (++timer[1].count >= timer[1].bound) {
//           timer[1].count = 0;
//           if (timer[1].mode&0x50) {
//             bus.interruptSet(IRQ_RTC1);
//           }
//         }
//       }

//       if (!(timer[2].mode&1)) {
//         timer[2].count += timer[2].mode&0x200 ? PSX_CYCLE/8 : PSX_CYCLE;

//         if (timer[2].count >= timer[2].bound) {
//           timer[2].count = 0;
//           if (timer[2].mode&0x50) {
//             bus.interruptSet(IRQ_RTC2);
//           }
//         }
//       }

//       if ((vbk += PSX_CYCLE) >= PSX_VSYNC) { vbk = 0;
//         bus.interruptSet(IRQ_VSYNC);
//          vs.redraw();
//         cpu.setbp();
//       }
//     },

//     scopeW(addr, data) {
//       var p = RTC_PORT(addr); // ((addr&0xf)>>>2)

//       switch(addr&0xf) {
//         case RTC_COUNT:
//           timer[p].count = data&0xffff;
//           return;

//         case RTC_MODE:
//           timer[p].mode  = data;
//           timer[p].bound = timer[p].mode&8 ? timer[p].dest : RTC_BOUND;
//           return;

//         case RTC_TARGET:
//           timer[p].dest  = data&0xffff;
//           timer[p].bound = timer[p].mode&8 ? timer[p].dest : RTC_BOUND;
//           return;
//       }

//       psx.error('RTC Write '+hex(addr&0xf)+' <- '+hex(data));
//     },

//     scopeR(addr) {
//       var p = RTC_PORT(addr);

//       switch(addr&0xf) {
//         case RTC_COUNT:
//           return timer[p].count;

//         case RTC_MODE:
//           return timer[p].mode;

//         case RTC_TARGET:
//           return timer[p].dest;
//       }

//       psx.error('RTC Read '+hex(addr&0xf));
//       return 0;
//     }
//   };
// })();

// pseudo.CstrCounter = (function() {
//   return {
//     tick() {
//       timer[1].count += time*15;

//       if (!(timer[1].mode&0x0008)) {
//         if (timer[1].count >= 0xffff) {
//           timer[1].count = 0;
//           if ((timer[1].mode&0x0040)&&(hardINTmask&0x0020)) {
//             bus.interruptSet(IRQ_RTC1);
//           }
//         }
//       }
//       else {
//         if (timer[1].count >= timer[1].dest) {
//           timer[1].count = 0;
//           if ((timer[1].mode&0x0040)&&(hardINTmask&0x0020)) {
//             bus.interruptSet(IRQ_RTC1);
//           }
//         }
//       }

//       if (!(timer[2].mode&0x0001)) {
//         timer[2].count += time*4125;
//       }
//     }
//   }
// });
