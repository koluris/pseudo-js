



// Preprocessor






// A kind of helper for various data manipulation
function union(size) {
  const bfr = new ArrayBuffer(size);

  return {
    uw: new Uint32Array(bfr),
    uh: new Uint16Array(bfr),
    ub: new Uint8Array (bfr),

    sw: new Int32Array(bfr),
    sh: new Int16Array(bfr),
    sb: new Int8Array (bfr),
  };
}

// Declare our namespace
'use strict';
//let pseudo = window.pseudo || {};
// #define audio//   pseudo.CstrAudio

// #define bus//   pseudo.CstrBus


// #define IRQ_VSYNC 0
// #define IRQ_GPU   1
// #define IRQ_CD    2
// #define IRQ_DMA   3
// #define IRQ_RTC0  4
// #define IRQ_RTC1  5
// #define IRQ_RTC2  6
// #define IRQ_SIO0  7
// #define IRQ_SIO1  8
// #define IRQ_SPU   9
// #define IRQ_PIO   10
// #define cop2//   pseudo.CstrCop2

// #define rootcnt//   pseudo.CstrCounters


// #define PSX_CLK//   33868800


// // Assume NTSC for now
// #define PSX_VSYNC//   (PSX_CLK/60)


// // #define PSX_HSYNC// //   (PSX_CLK/15734)


// // This is uttermost experimental, it's the Achilles' heel
// #define PSX_CYCLE//   64

// #define io//   pseudo.CstrHardware


// #define data32//   directMemW(mem._hwr.uw, 0x1070)


// #define mask32//   directMemW(mem._hwr.uw, 0x1074)


// #define data16//   directMemH(mem._hwr.uh, 0x1070)


// #define mask16//   directMemH(mem._hwr.uh, 0x1074)

// #define mem//   pseudo.CstrMem


// #define directMemW(mem, addr)//   mem[((addr)&(mem.byteLength-1))>>>2]


// #define directMemH(mem, addr)//   mem[((addr)&(mem.byteLength-1))>>>1]


// #define directMemB(mem, addr)//   mem[((addr)&(mem.byteLength-1))>>>0]

// #define cpu//   pseudo.CstrMips


// #define opcode//   ((code>>>26)&0x3f)


// #define rs//   ((code>>>21)&0x1f)


// #define rt//   ((code>>>16)&0x1f)


// #define rd//   ((code>>>11)&0x1f)


// #define shamt//   ((code>>>6)&0x1f)


// #define imm_u//   (code&0xffff)


// #define imm_s//   (SIGN_EXT_16(code))


// #define ob//   (r[rs]+imm_s)


// #define b_addr//   (pc+(imm_s<<2))


// #define s_addr//   ((pc&0xf0000000)|(code&0x3ffffff)<<2)

// #define psx//   pseudo.CstrMain


// // Console output
// #define MSG_INFO  'info'
// #define MSG_ERROR 'error'

// // Format to Hexadecimal
// #define hex(n)//   ('0x'+(n>>>0).toString(16))


// // Arithmetic operations
// #define SIGN_EXT_32(n)//   ((n)<<0>>0)


// #define SIGN_EXT_16(n)//   ((n)<<16>>16)


// #define SIGN_EXT_8(n)//   ((n)<<24>>24)

// #define render//   pseudo.CstrRender

// #define sio//   pseudo.CstrSerial

// #define vs//   pseudo.CstrGraphics


// #define FRAME_W 1024
// #define FRAME_H 512

// #define GPU_DMA_NONE     0
// #define GPU_DMA_UNKNOWN  1
// #define GPU_DMA_MEM2VRAM 2
// #define GPU_DMA_VRAM2MEM 3
// #define tcache//   pseudo.CstrTexCache

// pseudo.CstrAudio = (function() {
//   return {
//     awake() {
//     }
//   };
// })();
// #define IRQ_QUEUED_YES 1
// #define IRQ_QUEUED_NO  0

// #define pcr//   directMemW(mem._hwr.uw, 0x10f0)


// #define icr//   directMemW(mem._hwr.uw, 0x10f4)


// #define madr//   directMemW(mem._hwr.uw, (addr&0xfff0)|0)


// #define bcr//   directMemW(mem._hwr.uw, (addr&0xfff0)|4)


// #define chcr//   directMemW(mem._hwr.uw, (addr&0xfff0)|8)


// pseudo.CstrBus = (function() {
//   const interrupts = [{
//     code: IRQ_VSYNC,
//     target: 1
//   }, {
//     code: IRQ_GPU,
//     target: 1
//   }, {
//     code: IRQ_CD,
//     target: 4
//   }, {
//     code: IRQ_DMA,
//     target: 1
//   }, {
//     code: IRQ_RTC0,
//     target: 1
//   }, {
//     code: IRQ_RTC1,
//     target: 1
//   }, {
//     code: IRQ_RTC2,
//     target: 1
//   }, {
//     code: IRQ_SIO0,
//     target: 8
//   }, {
//     code: IRQ_SIO1,
//     target: 8
//   }, {
//     code: IRQ_SPU,
//     target: 1
//   }, {
//     code: IRQ_PIO,
//     target: 1
//   }];

//   // Exposed class functions/variables
//   return {
//     reset() {
//       for (const item of interrupts) {
//         item.queued = IRQ_QUEUED_NO;
//       }
//     },

//     interruptsUpdate() { // A method to schedule when IRQs should fire
//       for (const item of interrupts) {
//         if (item.queued) {
//           if (item.queued++ === item.target) {
//             data16 |= (1<<item.code);
//             item.queued = IRQ_QUEUED_NO;
//             break;
//           }
//         }
//       }
//     },

//     interruptSet(n) {
//       interrupts[n].queued = IRQ_QUEUED_YES;
//     },

//     checkDMA(addr, data) {
//       const chan = ((addr>>>4)&0xf) - 8;

//       if (pcr&(8<<(chan*4))) { // GPU does not execute sometimes
//         chcr = data;

//         switch(chan) {
//           case 2: vs .executeDMA(addr); break; // GPU
//           case 4: break; // SPU
//           case 6: mem.executeDMA(addr); break; // OTC

//           default:
//             psx.error('DMA Channel '+chan);
//             break;
//         }
//         chcr = data&(~0x01000000);

//         if (icr&(1<<(16+chan))) {
//           icr |= 1<<(24+chan);
//           bus.interruptSet(IRQ_DMA);
//         }
//       }
//     }
//   };
// })();
// // 32-bit accessor
// #define oooo(base, index)//   base[(index)]


// // 16-bit accessor
// #define __oo(base, index, offset)//   base[(index<<1)+offset]


// // 08-bit accessor
// #define ___o(base, index, offset)//   base[(index<<2)+offset]


// // Cop2c
// #define R11R12 oooo(cop2c.sw,  0)
// #define R11    __oo(cop2c.sh,  0, 0)
// #define R12    __oo(cop2c.sh,  0, 1)
// #define R13    __oo(cop2c.sh,  1, 0)
// #define R21    __oo(cop2c.sh,  1, 1)
// #define R22R23 oooo(cop2c.sw,  2)
// #define R22    __oo(cop2c.sh,  2, 0)
// #define R23    __oo(cop2c.sh,  2, 1)
// #define R31    __oo(cop2c.sh,  3, 0)
// #define R32    __oo(cop2c.sh,  3, 1)
// #define R33    __oo(cop2c.sh,  4, 0)
// #define TRX    oooo(cop2c.sw,  5)
// #define TRY    oooo(cop2c.sw,  6)
// #define TRZ    oooo(cop2c.sw,  7)
// #define L11    __oo(cop2c.sh,  8, 0)
// #define L12    __oo(cop2c.sh,  8, 1)
// #define L13    __oo(cop2c.sh,  9, 0)
// #define L21    __oo(cop2c.sh,  9, 1)
// #define L22    __oo(cop2c.sh, 10, 0)
// #define L23    __oo(cop2c.sh, 10, 1)
// #define L31    __oo(cop2c.sh, 11, 0)
// #define L32    __oo(cop2c.sh, 11, 1)
// #define L33    __oo(cop2c.sh, 12, 0)
// #define RBK    oooo(cop2c.sw, 13)
// #define GBK    oooo(cop2c.sw, 14)
// #define BBK    oooo(cop2c.sw, 15)
// #define LR1    __oo(cop2c.sh, 16, 0)
// #define LR2    __oo(cop2c.sh, 16, 1)
// #define LR3    __oo(cop2c.sh, 17, 0)
// #define LG1    __oo(cop2c.sh, 17, 1)
// #define LG2    __oo(cop2c.sh, 18, 0)
// #define LG3    __oo(cop2c.sh, 18, 1)
// #define LB1    __oo(cop2c.sh, 19, 0)
// #define LB2    __oo(cop2c.sh, 19, 1)
// #define LB3    __oo(cop2c.sh, 20, 0)
// #define RFC    oooo(cop2c.sw, 21)
// #define GFC    oooo(cop2c.sw, 22)
// #define BFC    oooo(cop2c.sw, 23)
// #define OFX    oooo(cop2c.sw, 24)
// #define OFY    oooo(cop2c.sw, 25)
// #define H      __oo(cop2c.sh, 26, 0)
// #define DQA    __oo(cop2c.sh, 27, 0)
// #define DQB    oooo(cop2c.sw, 28)
// #define ZSF3   __oo(cop2c.sh, 29, 0)
// #define ZSF4   __oo(cop2c.sh, 30, 0)
// #define FLAG   oooo(cop2c.uw, 31)

// // Cop2d
// #define VXY0   oooo(cop2d.uw,  0)
// #define VX0    __oo(cop2d.sh,  0, 0)
// #define VY0    __oo(cop2d.sh,  0, 1)
// #define VZ0    __oo(cop2d.sh,  1, 0)
// #define VXY1   oooo(cop2d.uw,  2)
// #define VX1    __oo(cop2d.sh,  2, 0)
// #define VY1    __oo(cop2d.sh,  2, 1)
// #define VZ1    __oo(cop2d.sh,  3, 0)
// #define VXY2   oooo(cop2d.uw,  4)
// #define VX2    __oo(cop2d.sh,  4, 0)
// #define VY2    __oo(cop2d.sh,  4, 1)
// #define VZ2    __oo(cop2d.sh,  5, 0)
// #define RGB    oooo(cop2d.uw,  6)
// #define R      ___o(cop2d.ub,  6, 0)
// #define G      ___o(cop2d.ub,  6, 1)
// #define B      ___o(cop2d.ub,  6, 2)
// #define CODE   ___o(cop2d.ub,  6, 3)
// #define OTZ    __oo(cop2d.uh,  7, 0)
// #define IR0    __oo(cop2d.sh,  8, 0)
// #define IR1    __oo(cop2d.sh,  9, 0)
// #define IR2    __oo(cop2d.sh, 10, 0)
// #define IR3    __oo(cop2d.sh, 11, 0)
// #define SXY0   oooo(cop2d.uw, 12)
// #define SX0    __oo(cop2d.sh, 12, 0)
// #define SY0    __oo(cop2d.sh, 12, 1)
// #define SXY1   oooo(cop2d.uw, 13)
// #define SX1    __oo(cop2d.sh, 13, 0)
// #define SY1    __oo(cop2d.sh, 13, 1)
// #define SXY2   oooo(cop2d.uw, 14)
// #define SX2    __oo(cop2d.sh, 14, 0)
// #define SY2    __oo(cop2d.sh, 14, 1)
// #define SXYP   oooo(cop2d.uw, 15)
// #define SXP    __oo(cop2d.sh, 15, 0)
// #define SYP    __oo(cop2d.sh, 15, 1)
// #define SZ0    __oo(cop2d.uh, 16, 0)
// #define SZ1    __oo(cop2d.uh, 17, 0)
// #define SZ2    __oo(cop2d.uh, 18, 0)
// #define SZ3    __oo(cop2d.uh, 19, 0)
// #define RGB0   oooo(cop2d.uw, 20)
// #define R0     ___o(cop2d.ub, 20, 0)
// #define G0     ___o(cop2d.ub, 20, 1)
// #define B0     ___o(cop2d.ub, 20, 2)
// #define CODE0  ___o(cop2d.ub, 20, 3)
// #define RGB1   oooo(cop2d.uw, 21)
// #define R1     ___o(cop2d.ub, 21, 0)
// #define G1     ___o(cop2d.ub, 21, 1)
// #define B1     ___o(cop2d.ub, 21, 2)
// #define CODE1  ___o(cop2d.ub, 21, 3)
// #define RGB2   oooo(cop2d.uw, 22)
// #define R2     ___o(cop2d.ub, 22, 0)
// #define G2     ___o(cop2d.ub, 22, 1)
// #define B2     ___o(cop2d.ub, 22, 2)
// #define CODE2  ___o(cop2d.ub, 22, 3)
// #define RES1   oooo(cop2d.uw, 23)
// #define MAC0   oooo(cop2d.sw, 24)
// #define MAC1   oooo(cop2d.sw, 25)
// #define MAC2   oooo(cop2d.sw, 26)
// #define MAC3   oooo(cop2d.sw, 27)
// #define IRGB   oooo(cop2d.uw, 28)
// #define ORGB   oooo(cop2d.uw, 29)
// #define LZCS   oooo(cop2d.uw, 30)
// #define LZCR   oooo(cop2d.uw, 31)

// #define VX(n)  __oo(cop2d.sh, (n<<1)+0, 0)
// #define VY(n)  __oo(cop2d.sh, (n<<1)+0, 1)
// #define VZ(n)  __oo(cop2d.sh, (n<<1)+1, 0)

// #define SX(n)  __oo(cop2d.sh, n+12, 0)
// #define SY(n)  __oo(cop2d.sh, n+12, 1)
// #define SZ(n)  __oo(cop2d.uh, n+17, 0)

// pseudo.CstrCop2 = (function() {
//   const cop2c = union(32*4);
//   const cop2d = union(32*4);

//   return {
//     reset() {
//       cop2c.ub.fill(0);
//       cop2d.ub.fill(0);
//     },

//     execute(code) {
//       switch(code&0x3f) {
//         case 0: // BASIC
//           switch(rs&7) {
//             case 0: // MFC2
//               cpu.setbase(rt, cop2.opcodeMFC2(rd));
//               return;

//             case 2: // CFC2
//               cpu.setbase(rt, oooo(cop2c.uw, rd));
//               return;

//             case 4: // MTC2
//               cop2.opcodeMTC2(rd, cpu.readbase(rt));
//               return;

//             case 6: // CTC2
//               cop2.opcodeCTC2(rd, cpu.readbase(rt));
//               return;
//           }
//           psx.error('COP2 Basic '+(rs&7));
//           return;
//       }
//       //psx.error('COP2 Execute '+hex(code&0x3f));
//     },

//     opcodeMFC2: function(addr) {
//       switch(addr) {
//         case  1:
//         case  3:
//         case  5:
//         case  8:
//         case  9:
//         case 10:
//         case 11:
//           oooo(cop2d.sw, addr) = __oo(cop2d.sh, addr, 0);
//           break;

//         case  7:
//         case 16:
//         case 17:
//         case 18:
//         case 19:
//           oooo(cop2d.uw, addr) = __oo(cop2d.uh, addr, 0);
//           break;

//         case 15:
//           psx.error('opcodeMFC2 -> '+addr);
//           break;

//         case 28:
//         case 29:
//           psx.error('opcodeMFC2 -> '+addr);
//           break;

//         case 30:
//           return 0;
//       }

//       return oooo(cop2d.uw, addr);
//     },

//     opcodeMTC2: function(addr, data) {
//       switch(addr) {
//         case 15:
//           SXY0 = SXY1;
//           SXY1 = SXY2;
//           SXY2 = data;
//           SXYP = data;
//           return;

//         case 28:
//           IRGB = data;
//           IR1  =(data&0x001f)<<7;
//           IR2  =(data&0x03e0)<<2;
//           IR3  =(data&0x7c00)>>3;
//           return;

//         case 30:
//           {
//             LZCS = data;
//             LZCR = 0;
//             let sbit = (LZCS&0x80000000) ? LZCS : (~(LZCS));

//             for ( ; sbit&0x80000000; sbit<<=1) {
//               LZCR++;
//             }
//           }
//           return;

//         case  7:
//         case 29:
//         case 31:
//           return;
//       }

//       oooo(cop2d.uw, addr) = data;
//     },

//     opcodeCTC2: function(addr, data) {
//       switch(addr) {
//         case  4:
//         case 12:
//         case 20:
//         case 26:
//         case 27:
//         case 29:
//         case 30:
//           data = SIGN_EXT_16(data); // ?
//           break;

//         
//         case 31:
//           psx.error('opcodeCTC2 -> '+addr+' <- '+hex(data));
//           break;
//       }

//       oooo(cop2c.uw, addr) = data;
//     }
//   };
// })();
const CstrCounters = function() {
};

// #define RTC_PORT(addr)//   (addr>>>4)&3


// #define RTC_COUNT  0
// #define RTC_MODE   4
// #define RTC_TARGET 8

// #define RTC_BOUND//   0xffff


// pseudo.CstrCounters = (function() {
//   let timer;
//   let vbk;//, dec1;

//   // Exposed class functions/variables
//   return {
//     awake() {
//       timer = [];
//     },

//     reset() {
//       for (let i=0; i<3; i++) {
//         timer[i] = {
//           mode  : 0,
//           count : 0,
//           target  : 0,
//           bound : RTC_BOUND
//         };
//       }

//       vbk = 0;
//     },

//     update() {
//       if ((vbk += PSX_CYCLE) === PSX_VSYNC) { vbk = 0;
//         bus.interruptSet(IRQ_VSYNC);
//          vs.redraw();
//         cpu.setbp();
//       }

//       // timer[0].count += timer[0].mode&0x100 ? PSX_CYCLE : PSX_CYCLE/8;

//       // if (timer[0].count >= timer[0].bound) {
//       //   timer[0].count = 0;
//       //   if (timer[0].mode&0x50) {
//       //     //bus.interruptSet(IRQ_RTC0);
//       //     psx.error('dude 1');
//       //   }
//       // }

//       // if (!(timer[1].mode&0x100)) {
//       //   timer[1].count += PSX_CYCLE;

//       //   if (timer[1].count >= timer[1].bound) {
//       //     timer[1].count = 0;
//       //     if (timer[1].mode&0x50) {
//       //       //bus.interruptSet(IRQ_RTC1);
//       //       psx.error('dude 2');
//       //     }
//       //   }
//       // }
//       // else if ((dec1+=PSX_CYCLE) >= PSX_HSYNC) {
//       //   dec1 = 0;
//       //   if (++timer[1].count >= timer[1].bound) {
//       //     timer[1].count = 0;
//       //     if (timer[1].mode&0x50) {
//       //       bus.interruptSet(IRQ_RTC1);
//       //     }
//       //   }
//       // }

//       // if (!(timer[2].mode&1)) {
//       //   timer[2].count += timer[2].mode&0x200 ? PSX_CYCLE/8 : PSX_CYCLE;

//       //   if (timer[2].count >= timer[2].bound) {
//       //     timer[2].count = 0;
//       //     if (timer[2].mode&0x50) {
//       //       bus.interruptSet(IRQ_RTC2);
//       //     }
//       //   }
//       // }
//     },

//     scopeW(addr, data) {
//       const p = RTC_PORT(addr); // ((addr&0xf)>>>2)

//       switch(addr&0xf) {
//         case RTC_COUNT:
//           timer[p].count = data&0xffff;
//           return;

//         case RTC_MODE:
//           timer[p].mode  = data;
//           timer[p].bound = timer[p].mode&8 ? timer[p].target : RTC_BOUND;
//           return;

//         case RTC_TARGET:
//           timer[p].target  = data&0xffff;
//           timer[p].bound = timer[p].mode&8 ? timer[p].target : RTC_BOUND;
//           return;
//       }

//       psx.error('RTC Write '+hex(addr&0xf)+' <- '+hex(data));
//     },

//     scopeR(addr) {
//       const p = RTC_PORT(addr);

//       switch(addr&0xf) {
//         case RTC_COUNT:
//           return timer[p].count;

//         case RTC_MODE:
//           return timer[p].mode;

//         case RTC_TARGET:
//           return timer[p].target;
//       }

//       psx.error('RTC Read '+hex(addr&0xf));
//       return 0;
//     }
//   };
// })();
// const emu = window.emu || {};

// // const CstrCache = function() {
// //   // public
// //   this.init = function() {
// //   };

// //   this.fetch = function(ctx) {
// //     console.dir('Ctx is '+ctx);
// //   };
// // };

// // const CstrPrim = function() { // I need to pass "ctx" as a parameter to "cache"
// //   this.init = function() {
// //     this.ctx = 10;
// //   };

// //   this.fetch = function(vram) {
// //     console.dir('VRAM is '+vram.hi);
// //     vram.hi = 5;
// //   };
// // };

// // emu.fx = (function() {
// //   let vram  = { hi: 1 };
// //   let cache = new CstrCache();
// //   let prim  = new CstrPrim();

// //   cache.init();
// //    prim.init();

// //   cache.fetch(prim.ctx);
// //    prim.fetch(vram);

// //   console.dir(vram.hi);
// // })();
// #define hwr mem._hwr

// pseudo.CstrHardware = (function() {
//   // Exposed class functions/variables
//   return {
//     write: {
//       w(addr, data) {
//         if (addr >= 0x1080 && addr <= 0x10e8) { // DMA
//           if (addr&8) {
//             bus.checkDMA(addr, data);
//             return;
//           }
//           directMemW(hwr.uw, addr) = data;
//           return;
//         }

//         if (addr >= 0x1104 && addr <= 0x1124) { // Rootcounters
//           rootcnt.scopeW(addr, data);
//           return;
//         }

//         if (addr >= 0x1810 && addr <= 0x1814) { // Graphics
//           vs.scopeW(addr, data);
//           return;
//         }

//         switch(addr) {
//           case 0x1070:
//             data32 &= data&mask32;
//             return;

//           case 0x10f4: // Thanks Calb, Galtor :)
//             icr = (icr&(~((data&0xff000000)|0xffffff)))|(data&0xffffff);
//             return;

//           
//           case 0x1000:
//           case 0x1004:
//           case 0x1008:
//           case 0x100c:
//           case 0x1010:
//           case 0x1014: // SPU
//           case 0x1018: // DV5
//           case 0x101c:
//           case 0x1020: // COM
//           case 0x1060: // RAM Size
//           case 0x1074:
//           case 0x10f0:
//             directMemW(hwr.uw, addr) = data;
//             return;
//         }
//         psx.error('Hardware Write w '+hex(addr)+' <- '+hex(data));
//       },

//       h(addr, data) {
//         if (addr >= 0x1048 && addr <= 0x104e) { // Controls
//           sio.write.h(addr, data);
//           return;
//         }

//         if (addr >= 0x1100 && addr <= 0x1128) { // Rootcounters
//           rootcnt.scopeW(addr, data);
//           return;
//         }
        
//         if (addr >= 0x1c00 && addr <= 0x1dfe) { // Audio
//           directMemH(hwr.uh, addr) = data;
//           return;
//         }

//         switch(addr) {
//           case 0x1070:
//             data16 &= data&mask16;
//             return;
          
//           
//           case 0x1014:
//           case 0x1074:
//             directMemH(hwr.uh, addr) = data;
//             return;
//         }
//         psx.error('Hardware Write h '+hex(addr)+' <- '+hex(data));
//       },

//       b(addr, data) {
//         switch(addr) {
//           case 0x1040:
//             sio.write.b(addr, data);
//             return;

//           
//           case 0x2041: // DIP Switch?
//             directMemB(hwr.ub, addr) = data;
//             return;
//         }
//         psx.error('Hardware Write b '+hex(addr)+' <- '+hex(data));
//       }
//     },

//     read: {
//       w(addr) {
//         if (addr >= 0x1080 && addr <= 0x10e8) { // DMA
//           return directMemW(hwr.uw, addr);
//         }

//         if (addr >= 0x1100 && addr <= 0x1110) { // Rootcounters
//           return rootcnt.scopeR(addr);
//         }

//         if (addr >= 0x1810 && addr <= 0x1814) { // Graphics
//           return vs.scopeR(addr);
//         }

//         switch(addr) {
//           
//           case 0x1014:
//           case 0x1070:
//           case 0x1074:
//           case 0x10f0:
//           case 0x10f4:
//             return directMemW(hwr.uw, addr);
//         }
//         psx.error('Hardware Read w '+hex(addr));
//       },

//       h(addr) {
//         if (addr >= 0x1044 && addr <= 0x104a) { // Controls
//           return sio.read.h(addr);
//         }

//         if (addr >= 0x1110 && addr <= 0x1124) { // Rootcounters
//           return rootcnt.scopeR(addr);
//         }

//         if (addr >= 0x1c00 && addr <= 0x1e0e) { // Audio
//           return directMemH(hwr.uh, addr);
//         }

//         switch(addr) {
//           
//           case 0x1014:
//           case 0x1070:
//           case 0x1074:
//             return directMemH(hwr.uh, addr);
//         }
//         psx.error('Hardware Read h '+hex(addr));
//       },

//       b(addr) {
//         switch(addr) {
//           case 0x1040: // Controls
//             return sio.read.b(addr);
//         }
//         psx.error('Hardware Read b '+hex(addr));
//       }
//     }
//   };
// })();

// #undef hwr
const CstrMem = function() {
};

// #define ram mem._ram
// #define rom mem._rom
// #define hwr mem._hwr

// #define MSB(x)//   x>>>20


// pseudo.CstrMem = (function() {
//   // Exposed class functions/variables
//   return {
//     _ram: union(0x200000),
//     _rom: union(0x80000),
//     _hwr: union(0x4000),

//     reset() {
//       // Reset all, except for BIOS?
//       ram.ub.fill(0);
//       hwr.ub.fill(0);
//     },

//     write: {
//       w(addr, data) {
//         switch(MSB(addr)) {
//           case 0x000: // Base RAM
//           case 0x001: // Base RAM

//           case 0x800: // Mirror
//           case 0x801: // Mirror
//           case 0x807: // Mirror

//           case 0xa00: // Mirror
//             if (cpu.writeOK()) {
//               directMemW(ram.uw, addr) = data;
//             }
//             return;

//           case 0x1f8: // Scratchpad + Hardware
//             addr&=0xffff;
//             if (addr <= 0x3ff) {
//               directMemW(hwr.uw, addr) = data;
//               return;
//             }
//             io.write.w(addr, data);
//             return;
//         }

//         if (addr === 0xfffe0130) { // Mem Access
//           return;
//         }
//         psx.error('Mem Write w '+hex(addr)+' <- '+hex(data));
//       },

//       h(addr, data) {
//         switch(MSB(addr)) {
//           case 0x000: // Base RAM
//           case 0x001: // Base RAM

//           case 0x800: // Mirror
//           case 0x801: // Mirror
//           case 0x807: // Mirror

//           case 0xa00: // Mirror
//             directMemH(ram.uh, addr) = data;
//             return;

//           case 0x1f8: // Scratchpad + Hardware
//             addr&=0xffff;
//             if (addr <= 0x3ff) {
//               directMemH(hwr.uh, addr) = data;
//               return;
//             }
//             io.write.h(addr, data);
//             return;
//         }
//         psx.error('Mem Write h '+hex(addr)+' <- '+hex(data));
//       },

//       b(addr, data) {
//         switch(MSB(addr)) {
//           case 0x000: // Base RAM
//           case 0x001: // Base RAM

//           case 0x800: // Mirror
//           case 0x801: // Mirror
//           case 0x807: // Mirror

//           case 0xa00: // Mirror
//             directMemB(ram.ub, addr) = data;
//             return;

//           case 0x1f8: // Scratchpad + Hardware
//             addr&=0xffff;
//             if (addr <= 0x3ff) {
//               directMemB(hwr.ub, addr) = data;
//               return;
//             }
//             io.write.b(addr, data);
//             return;
//         }
//         psx.error('Mem Write b '+hex(addr)+' <- '+hex(data));
//       }
//     },

//     read: {
//       w(addr) {
//         switch(MSB(addr)) {
//           case 0x000: // Base RAM
//           case 0x001: // Base RAM

//           case 0x800: // Mirror
//           case 0x801: // Mirror
//           case 0x807: // Mirror

//           case 0xa00: // Mirror
//             return directMemW(ram.uw, addr);

//           case 0xbfc: // BIOS
//             return directMemW(rom.uw, addr);

//           case 0x1f8: // Scratchpad + Hardware
//             addr&=0xffff;
//             if (addr <= 0x3ff) {
//               return directMemW(hwr.uw, addr);
//             }
//             return io.read.w(addr);
//         }
//         psx.error('Mem Read w '+hex(addr));
//         return 0;
//       },

//       h(addr) {
//         switch(MSB(addr)) {
//           case 0x000: // Base RAM
//           case 0x001: // Base RAM

//           case 0x800: // Mirror
//           case 0x801: // Mirror
//           case 0x807: // Mirror
//             return directMemH(ram.uh, addr);

//           case 0x1f8: // Scratchpad + Hardware
//             addr&=0xffff;
//             if (addr <= 0x3ff) {
//               return directMemH(hwr.uh, addr);
//             }
//             return io.read.h(addr);
//         }
//         psx.error('Mem Read h '+hex(addr));
//         return 0;
//       },

//       b(addr) {
//         switch(MSB(addr)) {
//           case 0x000: // Base RAM
//           case 0x001: // Base RAM

//           case 0x800: // Mirror
//           case 0x801: // Mirror
//           case 0x807: // Mirror
//             return directMemB(ram.ub, addr);

//           case 0xbfc: // BIOS
//             return directMemB(rom.ub, addr);

//           case 0x1f8: // Scratchpad + Hardware
//             addr&=0xffff;
//             if (addr <= 0x3ff) {
//               return directMemB(hwr.ub, addr);
//             }
//             return io.read.b(addr);

//           case 0x1f0: // PIO? What do u want?
//             return 0;
//         }
//         psx.error('Mem Read b '+hex(addr));
//         return 0;
//       }
//     },

//     executeDMA: function(addr) {
//       if (!bcr || chcr !== 0x11000002) {
//         return;
//       }
//       madr&=0xffffff;

//       while (--bcr) {
//         directMemW(ram.uw, madr) = (madr-4)&0xffffff;
//         madr-=4;
//       }
//       directMemW(ram.uw, madr) = 0xffffff;
//     }
//   };
// })();

// #undef ram
// #undef rom
// #undef hwr
const CstrMips = function() {
};

// #define pc r[32]
// #define lo r[33]
// #define hi r[34]

// // Inline functions for speedup
// #define opcodeMul(a, b)//   cacheAddr = a * b;//   //   lo = cacheAddr&0xffffffff;//   hi = (cacheAddr/power32) | 0





// #define opcodeDiv(a, b)//   if (b) {//     lo = a / b;//     hi = a % b;//   }





// #define exception(code, inslot)//   copr[12] = (copr[12]&0xffffffc0)|((copr[12]<<2)&0x3f);//   copr[13] = code;//   copr[14] = pc;//   //   pc = 0x80






// #define print()//   if (pc === 0xb0) {//     if (r[9] === 59 || r[9] === 61) {//       const char = String.fromCharCode(r[4]&0xff).replace(/\n/, '<br/>');//       output.append(char.toUpperCase());//     }//   }







// pseudo.CstrMips = (function() {
//   // Base + Coprocessor
//   let r, copr;
//   let opcodeCount;
//   let cacheAddr, power32; // Cache for expensive calculation

//   // Emulation loop handlers
//   let bp, requestAF;
//   let output;

//   const mask = [
//     [0x00ffffff, 0x0000ffff, 0x000000ff, 0x00000000],
//     [0x00000000, 0xff000000, 0xffff0000, 0xffffff00],
//     [0xffffff00, 0xffff0000, 0xff000000, 0x00000000],
//     [0x00000000, 0x000000ff, 0x0000ffff, 0x00ffffff],
//   ];

//   const shift = [
//     [0x18, 0x10, 0x08, 0x00],
//     [0x00, 0x08, 0x10, 0x18],
//     [0x18, 0x10, 0x08, 0x00],
//     [0x00, 0x08, 0x10, 0x18],
//   ];

//   // Base CPU stepper
//   function step(inslot) {
//     const code = pc>>>20 === 0xbfc ? directMemW(mem._rom.uw, pc) : directMemW(mem._ram.uw, pc);
//     opcodeCount++;
//     pc  += 4;
//     r[0] = 0; // As weird as this seems, it is needed

//     switch(opcode) {
//       case 0: // SPECIAL
//         switch(code&0x3f) {
//           case 0: // SLL
//             r[rd] = r[rt] << shamt;
//             return;

//           case 2: // SRL
//             r[rd] = r[rt] >>> shamt;
//             return;

//           case 3: // SRA
//             r[rd] = SIGN_EXT_32(r[rt]) >> shamt;
//             return;

//           case 4: // SLLV
//             r[rd] = r[rt] << (r[rs]&0x1f);
//             return;

//           case 6: // SRLV
//             r[rd] = r[rt] >>> (r[rs]&0x1f);
//             return;

//           case 7: // SRAV
//             r[rd] = SIGN_EXT_32(r[rt]) >> (r[rs]&0x1f);
//             return;

//           case 8: // JR
//             branch(r[rs]);
//             print();
//             return;

//           case 9: // JALR
//             r[rd] = pc+4;
//             branch(r[rs]);
//             return;

//           case 12: // SYSCALL
//             pc-=4;
//             exception(0x20, inslot);
//             return;

//           case 13: // BREAK
//             return;

//           case 16: // MFHI
//             r[rd] = hi;
//             return;

//           case 17: // MTHI
//             hi = r[rs];
//             return;

//           case 18: // MFLO
//             r[rd] = lo;
//             return;

//           case 19: // MTLO
//             lo = r[rs];
//             return;

//           case 24: // MULT
//             opcodeMul(SIGN_EXT_32(r[rs]), SIGN_EXT_32(r[rt]));
//             return;

//           case 25: // MULTU
//             opcodeMul(r[rs], r[rt]);
//             return;

//           case 26: // DIV
//             opcodeDiv(SIGN_EXT_32(r[rs]), SIGN_EXT_32(r[rt]));
//             return;

//           case 27: // DIVU
//             opcodeDiv(r[rs], r[rt]);
//             return;

//           case 32: // ADD
//           case 33: // ADDU
//             r[rd] = r[rs] + r[rt];
//             return;

//           case 34: // SUB
//           case 35: // SUBU
//             r[rd] = r[rs] - r[rt];
//             return;

//           case 36: // AND
//             r[rd] = r[rs] & r[rt];
//             return;

//           case 37: // OR
//             r[rd] = r[rs] | r[rt];
//             return;

//           case 38: // XOR
//             r[rd] = r[rs] ^ r[rt];
//             return;

//           case 39: // NOR
//             r[rd] = ~(r[rs] | r[rt]);
//             return;

//           case 42: // SLT
//             r[rd] = SIGN_EXT_32(r[rs]) < SIGN_EXT_32(r[rt]);
//             return;

//           case 43: // SLTU
//             r[rd] = r[rs] < r[rt];
//             return;
//         }
//         psx.error('Special CPU instruction '+(code&0x3f));
//         return;

//       case 1: // REGIMM
//         switch (rt) {
//           case 0: // BLTZ
//             if (SIGN_EXT_32(r[rs]) < 0) {
//               branch(b_addr);
//             }
//             return;

//           case 1: // BGEZ
//             if (SIGN_EXT_32(r[rs]) >= 0) {
//               branch(b_addr);
//             }
//             return;

//           case 17: // BGEZAL
//             r[31] = pc+4;
//             if (SIGN_EXT_32(r[rs]) >= 0) {
//               branch(b_addr);
//             }
//             return;
//         }
//         psx.error('Bcond CPU instruction '+rt);
//         return;

//       case 2: // J
//         branch(s_addr);
//         return;

//       case 3: // JAL
//         r[31] = pc+4;
//         branch(s_addr);
//         return;

//       case 4: // BEQ
//         if (r[rs] === r[rt]) {
//           branch(b_addr);
//         }
//         return;

//       case 5: // BNE
//         if (r[rs] !== r[rt]) {
//           branch(b_addr);
//         }
//         return;

//       case 6: // BLEZ
//         if (SIGN_EXT_32(r[rs]) <= 0) {
//           branch(b_addr);
//         }
//         return;

//       case 7: // BGTZ
//         if (SIGN_EXT_32(r[rs]) > 0) {
//           branch(b_addr);
//         }
//         return;

//       case 8: // ADDI
//       case 9: // ADDIU
//         r[rt] = r[rs] + imm_s;
//         return;

//       case 10: // SLTI
//         r[rt] = SIGN_EXT_32(r[rs]) < imm_s;
//         return;

//       case 11: // SLTIU
//         r[rt] = r[rs] < imm_u;
//         return;

//       case 12: // ANDI
//         r[rt] = r[rs] & imm_u;
//         return;

//       case 13: // ORI
//         r[rt] = r[rs] | imm_u;
//         return;

//       case 14: // XORI
//         r[rt] = r[rs] ^ imm_u;
//         return;

//       case 15: // LUI
//         r[rt] = code<<16;
//         return;

//       case 16: // COP0
//         switch (rs) {
//           case 0: // MFC0
//             r[rt] = copr[rd];
//             return;

//           case 4: // MTC0
//             copr[rd] = r[rt];
//             return;

//           case 16: // RFE
//             copr[12] = (copr[12]&0xfffffff0)|((copr[12]>>>2)&0xf);
//             return;
//         }
//         psx.error('Coprocessor 0 instruction '+rs);
//         return;

//       case 18: // COP2
//         cop2.execute(code);
//         return;

//       case 32: // LB
//         r[rt] = SIGN_EXT_8(mem.read.b(ob));
//         return;

//       case 33: // LH
//         r[rt] = SIGN_EXT_16(mem.read.h(ob));
//         return;

//       case 34: // LWL
//         cacheAddr = ob;
//         r[rt] = (r[rt]&mask[0][cacheAddr&3]) | (mem.read.w(cacheAddr&~3)<<shift[0][cacheAddr&3]);
//         return;

//       case 35: // LW
//         r[rt] = mem.read.w(ob);
//         return;

//       case 36: // LBU
//         r[rt] = mem.read.b(ob);
//         return;

//       case 37: // LHU
//         r[rt] = mem.read.h(ob);
//         return;

//       case 38: // LWR
//         cacheAddr = ob;
//         r[rt] = (r[rt]&mask[1][cacheAddr&3]) | (mem.read.w(cacheAddr&~3)>>shift[1][cacheAddr&3]);
//         return;

//       case 40: // SB
//         mem.write.b(ob, r[rt]);
//         return;

//       case 41: // SH
//         mem.write.h(ob, r[rt]);
//         return;

//       case 42: // SWL
//         cacheAddr = ob;
//         mem.write.w(cacheAddr&~3, (r[rt]>>shift[2][cacheAddr&3]) | (mem.read.w(cacheAddr&~3)&mask[2][cacheAddr&3]));
//         return;

//       case 43: // SW
//         mem.write.w(ob, r[rt]);
//         return;

//       case 46: // SWR
//         cacheAddr = ob;
//         mem.write.w(cacheAddr&~3, (r[rt]<<shift[3][cacheAddr&3]) | (mem.read.w(cacheAddr&~3)&mask[3][cacheAddr&3]));
//         return;

//       case 50: // LWC2
//         cop2.opcodeMTC2(mem.read.w(ob), rt);
//         return;

//       case 58: // SWC2
//         mem.write.w(ob, cop2.opcodeMFC2(rt));
//         return;
//     }
//     psx.error('Basic CPU instruction '+opcode);
//   }

//   function branch(addr) {
//     // Execute instruction in slot
//     step(true);
//     pc = addr;

//     if (opcodeCount >= PSX_CYCLE) {
//       // Rootcounters, interrupts
//       rootcnt.update();
//       bus.interruptsUpdate();

//       // Exceptions
//       if (data32&mask32) {
//         if ((copr[12]&0x401) === 0x401) {
//           exception(0x400, false);
//         }
//       }
//       opcodeCount %= PSX_CYCLE;
//     }
//   }

//   // Exposed class functions/variables
//   return {
//     awake(element) {
//          r = new Uint32Array(32 + 3); // + pc, lo, hi
//       copr = new Uint32Array(16);

//       // Cache
//       power32 = Math.pow(2, 32); // Btw, pure multiplication is faster
//       output  = element;
//     },

//     reset() {
//       // Break emulation loop
//       cancelAnimationFrame(requestAF);
//       requestAF = undefined;

//       // Reset processors
//          r.fill(0);
//       copr.fill(0);

//       copr[12] = 0x10900000;
//       copr[15] = 0x2;

//       pc = 0xbfc00000;
//       opcodeCount = 0;

//       // Clear console out
//       output.text(' ');

//       // BIOS bootstrap
//       cpu.consoleWrite(MSG_INFO, 'BIOS file has been written to ROM');
//       const start = performance.now();

//       while (pc !== 0x80030000) {
//         step(false);
//       }
//       const delta = parseFloat(performance.now()-start).toFixed(2);
//       cpu.consoleWrite(MSG_INFO, 'Bootstrap completed in '+delta+' ms');
//     },

//     run() {
//       bp = false;

//       while (!bp) { // No sleep till BROOKLYN
//         step(false);
//       }
//       requestAF = requestAnimationFrame(cpu.run);
//     },

//     exeHeader(hdr) {
//       pc    = hdr[2+ 2];
//       r[28] = hdr[2+ 3];
//       r[29] = hdr[2+10];
//     },

//     writeOK() {
//       return !(copr[12]&0x10000);
//     },

//     consoleWrite(kind, str) {
//       output.append('<div class="'+kind+'"><span>PSeudo:: </span>'+str+'</div>');
//     },

//     setbp() {
//       bp = true;
//     },

//     setbase: function(addr, data) {
//       r[addr] = data;
//     },

//     readbase: function(addr) {
//       return r[addr];
//     },
//   };
// })();

// #undef pc
// #undef lo
// #undef hi
pseudo = function() {
  // Private
  const cpu   = new CstrMips();
  const io    = new CstrMem();
  const rootc = new CstrCounters();
  const vs    = new CstrGraphics();

  let unusable;
  let file;

  // AJAX function
  function request(path, fn) {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if (xhr.status === 404) {
        cpu.consoleWrite(MSG_ERROR, 'Unable to read file "'+path+'"');
        unusable = true;
      }
      else {
        fn(xhr.response);
      }
    };
    xhr.responseType = 'arraybuffer';
    xhr.open('GET', path);
    xhr.send();
  }

  // Chunk reader function
  function chunkReader(file, start, size, fn) {
    const end = start+size;

    // Check boundaries
    if (file.size > end) {
      const reader  = new FileReader();
      reader.onload = function(e) { // Callback
        fn(e.target.result);
      };
      // Read sliced area
      reader.readAsText(file.slice(start, end));
    }
  }

  function reset() {
    // Prohibit all user actions
    if (unusable) {
      return false;
    }

    // Reset all emulator components
       vs.reset();
    rootc.reset();
       io.reset();
      cpu.reset();

    return true;
  }

  function prepareExe(resp) {
    const header = new Uint32Array(resp, 0, EXE_HEADER_SIZE);
    const offset = header[2+4]&(io.ram.ub.byteLength-1); // Offset needs boundaries... huh?
    const size   = header[2+5];

    // Set mem
    io.ram.ub.set(new Uint8Array(resp, EXE_HEADER_SIZE, size), offset);
    
    // Set processor
    cpu.exeHeader(header);
    cpu.consoleWrite(MSG_INFO, 'PSX-EXE has been transferred to RAM');
  }

  // Public
  this.awake = function() {
    unusable = false;
    file = undefined;

    $(function() { // DOMContentLoaded
         vs.awake($('#screen'), $('#resolution'));
      rootc.awake();
        cpu.awake($('#output'));

      request('bios/scph1001.bin', function(resp) {
        // Move BIOS to Mem
        io.rom.ub.set(new Uint8Array(resp));
      });
    });
  };

  this.run = function(path) {
    if (reset()) {
      if (path === 'bios') { // BIOS run
        cpu.run();
      }
      else { // Homebrew run
        request(path, function(resp) {
          prepareExe(resp);
          cpu.run();
        });
      }
    }
  };

  return this;
};

// #define ram mem._ram
// #define rom mem._rom

// #define EXE_HEADER_SIZE//   0x800


// pseudo.CstrMain = (function() {
//   let unusable;
//   let file;

//   // AJAX function
//   function request(path, fn) {
//     const xhr = new XMLHttpRequest();
//     xhr.onload = function() {
//       if (xhr.status === 404) {
//         cpu.consoleWrite(MSG_ERROR, 'Unable to read file "'+path+'"');
//         unusable = true;
//       }
//       else {
//         fn(xhr.response);
//       }
//     };
//     xhr.responseType = 'arraybuffer';
//     xhr.open('GET', path);
//     xhr.send();
//   }

//   // Chunk reader function
//   function chunkReader(file, start, size, fn) {
//     const end = start+size;

//     // Check boundaries
//     if (file.size > end) {
//       const reader  = new FileReader();
//       reader.onload = function(e) { // Callback
//         fn(e.target.result);
//       };
//       // Read sliced area
//       reader.readAsText(file.slice(start, end));
//     }
//   }

//   function reset() {
//     // Prohibit all user actions
//     if (unusable) {
//       return false;
//     }

//     // Reset all emulator components
//      render.reset();
//          vs.reset();
//         mem.reset();
//     rootcnt.reset();
//         bus.reset();
//         sio.reset();
//        cop2.reset();
//         cpu.reset();

//     return true;
//   }

//   function prepareExe(resp) {
//     const header = new Uint32Array(resp, 0, EXE_HEADER_SIZE);
//     const offset = header[2+4]&(ram.ub.byteLength-1); // Offset needs boundaries... huh?
//     const size   = header[2+5];

//     // Set mem
//     ram.ub.set(new Uint8Array(resp, EXE_HEADER_SIZE, size), offset);
    
//     // Set processor
//     cpu.exeHeader(header);
//     cpu.consoleWrite(MSG_INFO, 'PSX-EXE has been transferred to RAM');
//   }

//   // Exposed class functions/variables
//   return {
//     awake() {
//       unusable = false;
//       file = undefined;

//       $(function() { // DOMContentLoaded
//          render.awake($('#screen'), $('#resolution'));
//              vs.awake();
//         rootcnt.awake();
//             sio.awake();
//             cpu.awake($('#output'));

//         request('bios/scph1001.bin', function(resp) {
//           // Move BIOS to Mem
//           rom.ub.set(new Uint8Array(resp));
//         });
//       });
//     },

//     run(path) {
//       if (reset()) {
//         if (path === 'bios') { // BIOS run
//           cpu.run();
//         }
//         else { // Homebrew run
//           request(path, function(resp) {
//             prepareExe(resp);
//             cpu.run();
//           });
//         }
//       }
//     },

//     fileDrop(e) {
//       e.preventDefault();
//       const dt = e.dataTransfer;

//       if (dt.files) {
//         file = dt.files[0];
        
//         // PS-X EXE
//         chunkReader(file, 0x0000, 8, function(id) {
//           if (id === 'PS-X EXE') {
//             const reader  = new FileReader();
//             reader.onload = function(e) { // Callback
//               if (reset()) {
//                 prepareExe(e.target.result);
//                 cpu.run();
//               }
//             };
//             // Read file
//             reader.readAsArrayBuffer(file);
//           }
//         });

//         // ISO 9660
//         chunkReader(file, 0x9319, 5, function(id) {
//           if (id === 'CD001') {
//             chunkReader(file, 0x9340, 32, function(name) { // Get Name
//               cpu.consoleWrite(MSG_ERROR, 'CD ISO with code "'+name.trim()+'" not supported for now');
//             });
//           }
//         });
//       }
//     },

//     dropPrevent(e) {
//       e.preventDefault();
//     },

//     error(out) {
//       throw new Error('PSeudo / '+out);
//     }
//   };
// })();

// #undef ram
// #undef rom
// #define inn vs._inn
// #define vac vs._vac

// #define COLOR_MAX//   255


// #define COLOR_HALF//   COLOR_MAX>>>1


// #define iBlend(a)//   const b = [//     a&2 ? inn.blend : 0,//     a&2 ? bit[inn.blend].opaque : COLOR_MAX//   ];//   //   ctx.blendFunc(bit[b[0]].src, bit[b[0]].target)







// #define iColor(a)//   ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c);//   ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0);//   ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(a), ctx.DYNAMIC_DRAW)




// #define iVertex(a)//   ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v);//   ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0);//   ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(a), ctx.DYNAMIC_DRAW)




// #define iTexture(a)//   for (let i in a) {//     a[i]/=256.0;//   }//   //   ctx.uniform1i(attrib._e, true);//   ctx.enableVertexAttribArray(attrib._t);//   ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._t);//   ctx.vertexAttribPointer(attrib._t, 2, ctx.FLOAT, false, 0, 0);//   ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(a), ctx.DYNAMIC_DRAW)


// #define iTextureNone()//   ctx.uniform1i(attrib._e, false);//   ctx.disableVertexAttribArray(attrib._t)



// 



// #define RGBC(data) {//   _R: (data>>> 0)&0xff,//   _G: (data>>> 8)&0xff,//   _B: (data>>>16)&0xff,//   _A: (data>>>24)&0xff,// }






// // Fix: SIGN_EXT_16
// #define POINT(data) {//   _X: (data>> 0)&0xffff,//   _Y: (data>>16)&0xffff,// }




// #define UV(data) {//   _U: (data>>>0)&0xff,//   _V: (data>>>8)&0xff,// }




// #define TPAGE(data)//   (data>>>16)&0xffff  


// 



// #define PFx(data) {//   cr: [//     RGBC(data[0])//   ],//   vx: [//     POINT(data[1]),//     POINT(data[2]),//     POINT(data[3]),//     POINT(data[4]),//   ]// }


// #define PGx(data) {//   cr: [//     RGBC(data[0]),//     RGBC(data[2]),//     RGBC(data[4]),//     RGBC(data[6]),//   ],//   vx: [//     POINT(data[1]),//     POINT(data[3]),//     POINT(data[5]),//     POINT(data[7]),//   ]// }


// #define PFTx(data) {//   cr: [//     RGBC(data[0])//   ],//   vx: [//     POINT(data[1]),//     POINT(data[3]),//     POINT(data[5]),//     POINT(data[7]),//   ],//   tx: [//     UV(data[2]),//     UV(data[4]),//     UV(data[6]),//     UV(data[8]),//   ],//   tp: [//     TPAGE(data[2]),//     TPAGE(data[4]),//   ]// }


// #define PGTx(data) {//   cr: [//     RGBC(data[0]),//     RGBC(data[3]),//     RGBC(data[6]),//     RGBC(data[9]),//   ],//   vx: [//     POINT(data[ 1]),//     POINT(data[ 4]),//     POINT(data[ 7]),//     POINT(data[10]),//   ]// }


// #define BLKFx(data) {//   cr: [//     RGBC(data[0])//   ],//   vx: [//     POINT(data[1]),//     POINT(data[2]),//   ]// }









// #define SPRTx(data) {//   cr: [//     RGBC(data[0])//   ],//   vx: [//     POINT(data[1]),//     POINT(data[3]),//   ]// }









// 



// #define drawF(size, mode)//   const k  = PFx(data);//   const cr = [];//   const vx = [];//   //   iBlend(k.cr[0]._A);//   //   for (let i=0; i<size; i++) {//     cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]);//     vx.push(k.vx[i]._X, k.vx[i]._Y);//   }//   //   iColor(cr);//   iVertex(vx);//   iTextureNone();//   ctx.drawArrays(mode, 0, size)


// 



// #define drawG(size, mode)//   const k  = PGx(data);//   const cr = [];//   const vx = [];//   //   iBlend(k.cr[0]._A);//   //   for (let i=0; i<size; i++) {//     cr.push(k.cr[i]._R, k.cr[i]._G, k.cr[i]._B, b[1]);//     vx.push(k.vx[i]._X, k.vx[i]._Y);//   }//   //   iColor(cr);//   iVertex(vx);//   iTextureNone();//   ctx.drawArrays(mode, 0, size)


// 



// #define drawFT(size)//   const k  = PFTx(data);//   const cr = [];//   const vx = [];//   const tx = [];//   //   for (let i=0; i<size; i++) {//     if (k.cr._A&1) {//       cr.push(COLOR_HALF, COLOR_HALF, COLOR_HALF, COLOR_MAX);//     }//     else {//       cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, COLOR_MAX);//     }//     vx.push(k.vx[i]._X, k.vx[i]._Y);//     tx.push(k.tx[i]._U, k.tx[i]._V);//   }//   vs.tcache.fetchTexture(ctx, k.tp[1], k.tp[0]);//   //   iColor(cr);//   iVertex(vx);//   iTexture(tx);//   ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, size)


// 



// #define drawGT(size)//   const k  = PGTx(data);//   const cr = [];//   const vx = [];//   //   for (let i=0; i<size; i++) {//     cr.push(k.cr[i]._R, k.cr[i]._G, k.cr[i]._B, COLOR_MAX);//     vx.push(k.vx[i]._X, k.vx[i]._Y);//   }//   //   iColor(cr);//   iVertex(vx);//   iTextureNone();//   ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, size)


// 



// #define drawTile(size)//   const k  = BLKFx(data);//   const cr = [];//   //   iBlend(k.cr[0]._A);//   //   if (size) {//       k.vx[1]._X = size;//       k.vx[1]._Y = size;//   }//   //   for (let i=0; i<4; i++) {//     cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]);//   }//   //   const vx = [//     k.vx[0]._X,            k.vx[0]._Y,//     k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y,//     k.vx[0]._X,            k.vx[0]._Y+k.vx[1]._Y,//     k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y+k.vx[1]._Y,//   ];//   //   iColor(cr);//   iVertex(vx);//   iTextureNone();//   ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4)


// 



// #define drawSprite(size)//   const k  = SPRTx(data);//   const cr = [];//   //   iBlend(k.cr[0]._A);//   //   if (size) {//     k.vx[1]._X = size;//     k.vx[1]._Y = size;//   }//   //   for (let i=0; i<4; i++) {//     if (k.cr[0]._A&1) {//       cr.push(COLOR_HALF, COLOR_HALF, COLOR_HALF, b[1]);//     }//     else {//       cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]);//     }//   }//   //   const vx = [//     k.vx[0]._X,            k.vx[0]._Y,//     k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y,//     k.vx[0]._X,            k.vx[0]._Y+k.vx[1]._Y,//     k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y+k.vx[1]._Y,//   ];//   //   iColor(cr);//   iVertex(vx);//   iTextureNone();//   ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4)


// pseudo.CstrRender = (function() {
//   // HTML elements
//   let screen, resolution;
  
//   let ctx;      // 'webgl', { preserveDrawingBuffer: true } Context
//   let attrib;   // Enable/Disable Attributes on demand
//   let bfr;      // Draw buffers
//   let res, bit; // Resolution & Blend

//   // Generic function for shaders
//   function createShader(kind, content) {
//     const shader = ctx.createShader(kind);
//     ctx.shaderSource (shader, content);
//     ctx.compileShader(shader);
//     ctx.getShaderParameter(shader, ctx.COMPILE_STATUS);

//     return shader;
//   }

//   function READIMG(data) {
//     return {
//       _2: (data[1]>>> 0)&0xffff,
//       _3: (data[1]>>>16)&0xffff,
//       _4: (data[2]>>> 0)&0xffff,
//       _5: (data[2]>>>16)&0xffff,
//     };
//   }

//   // Exposed class functions/variables
//   return {
//     awake(divScreen, divResolution) {
//       // Get HTML elements
//       screen     = divScreen[0];
//       resolution = divResolution[0];

//       // 'webgl', { preserveDrawingBuffer: true } Canvas
//       ctx = screen.getContext('webgl', { preserveDrawingBuffer: true });
//       ctx. enable(ctx.BLEND);
//       ctx.disable(ctx.DEPTH_TEST);
//       ctx.disable(ctx.CULL_FACE);
//       ctx.clearColor(0.0, 0.0, 0.0, 1.0);

//       // Shaders
//       const func = ctx.createProgram();
//       ctx.attachShader(func, createShader(ctx.  VERTEX_SHADER, '  attribute vec2 a_position;  attribute vec4 a_color;  attribute vec2 a_texCoord;  uniform vec2 u_resolution;  varying vec4 v_color;  varying vec2 v_texCoord;    void main() {    gl_Position = vec4(((a_position / u_resolution) - 1.0) * vec2(1, -1), 0, 1);    v_color = a_color;    v_texCoord = a_texCoord;  }'));
//       ctx.attachShader(func, createShader(ctx.FRAGMENT_SHADER, '  precision mediump float;  uniform sampler2D u_texture;  uniform bool u_enabled;  varying vec4 v_color;  varying vec2 v_texCoord;    void main() {    if (u_enabled) {      gl_FragColor = texture2D(u_texture, v_texCoord) * v_color;    }    else {      gl_FragColor = v_color;    }  }'));
//       ctx.linkProgram(func);
//       ctx.getProgramParameter(func, ctx.LINK_STATUS);
//       ctx.useProgram (func);

//       // Attributes
//       attrib = {
//         _c: ctx.getAttribLocation(func, 'a_color'),
//         _p: ctx.getAttribLocation(func, 'a_position'),
//         _t: ctx.getAttribLocation(func, 'a_texCoord'),
//         _r: ctx.getUniformLocation  (func, 'u_resolution'),
//         _e: ctx.getUniformLocation  (func, 'u_enabled')
//       };

//       ctx.enableVertexAttribArray(attrib._c);
//       ctx.enableVertexAttribArray(attrib._p);
//       ctx.enableVertexAttribArray(attrib._t);

//       // Buffers
//       bfr = {
//         _c: ctx.createBuffer(),
//         _v: ctx.createBuffer(),
//         _t: ctx.createBuffer(),
//       };

//       // Blend
//       bit = [
//         { src: ctx.SRC_ALPHA, target: ctx.ONE_MINUS_SRC_ALPHA, opaque: 128 },
//         { src: ctx.ONE,       target: ctx.ONE_MINUS_SRC_ALPHA, opaque:   0 },
//         { src: ctx.ZERO,      target: ctx.ONE_MINUS_SRC_COLOR, opaque:   0 },
//         { src: ctx.SRC_ALPHA, target: ctx.ONE,                 opaque:  64 },
//       ];

//       // Standard value
//       res = {
//         native     : { w:   0, h:   0 },
//         override   : { w: 320, h: 240 },
//         multiplier : 1
//       };
//     },

//     reset() {
//       render.resize({ w: 320, h: 240 });
//       ctx.clear(ctx.COLOR_BUFFER_BIT);
//     },

//     resize(data) {
//       // Check if we have a valid resolution
//       if (data.w > 0 && data.h > 0) {
//         // Store valid resolution
//         res.native.w = data.w;
//         res.native.h = data.h;

//         // Native PSX resolution
//         ctx.uniform2f(attrib._r, data.w/2, data.h/2);
//         resolution.innerText = data.w+' x '+data.h;

//         // Construct desired resolution
//         let w = (res.override.w || data.w) * res.multiplier;
//         let h = (res.override.h || data.h) * res.multiplier;

//         screen.width = w;
//         screen.height   = h;
//         ctx.viewport(0, 0, w, h);
//       }
//       else {
//         console.info('Not a valid resolution');
//       }
//     },

//     doubleResolution() {
//       res.multiplier = res.multiplier === 1 ? 2 : 1;

//       // Show/hide elements
//       if (res.multiplier === 1) {
//         $('#bar-boxes').show();
//       }
//       else {
//         $('#bar-boxes').hide();
//       }

//       // Redraw
//       render.resize({ w: res.native.w, h: res.native.h });
//     },

//     prim(addr, data) {
//       switch(addr) {
//         case 0x01: // FLUSH
//           return;

//         case 0x02: // BLOCK FILL
//           {
//             const k  = BLKFx(data);
//             const cr = [];

//             for (let i=0; i<4; i++) {
//               cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, COLOR_MAX);
//             }

//             const vx = [
//               k.vx[0]._X,            k.vx[0]._Y,
//               k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y,
//               k.vx[0]._X,            k.vx[0]._Y+k.vx[1]._Y,
//               k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y+k.vx[1]._Y,
//             ];

//             iColor(cr);
//             iVertex(vx);
//             iTextureNone();
//             ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
//           }
//           return;

//         case 0x20:
//         case 0x21:
//         case 0x22:
//         case 0x23: // POLY F3
//           {
//             drawF(3, ctx.TRIANGLE_STRIP);
//           }
//           return;

//         case 0x24:
//         case 0x25:
//         case 0x26:
//         case 0x27: // POLY FT3
//           {
//             drawFT(3);
//           }
//           return;

//         case 0x28:
//         case 0x29:
//         case 0x2a:
//         case 0x2b: // POLY F4
//           {
//             drawF(4, ctx.TRIANGLE_STRIP);
//           }
//           return;

//         case 0x2c:
//         case 0x2d:
//         case 0x2e:
//         case 0x2f: // POLY FT4
//           {
//             drawFT(4);
//           }
//           return;

//         case 0x30:
//         case 0x31:
//         case 0x32:
//         case 0x33: // POLY G3
//           {
//             drawG(3, ctx.TRIANGLE_STRIP);
//           }
//           return;

//         case 0x34:
//         case 0x35:
//         case 0x36:
//         case 0x37: // POLY GT3
//           {
//             drawGT(3);
//           }
//           return;

//         case 0x38:
//         case 0x39:
//         case 0x3a:
//         case 0x3b: // POLY G4
//           {
//             drawG(4, ctx.TRIANGLE_STRIP);
//           }
//           return;

//         case 0x3c:
//         case 0x3d:
//         case 0x3e:
//         case 0x3f: // POLY GT4
//           {
//             drawGT(4);
//           }
//           return;

//         case 0x40:
//         case 0x41:
//         case 0x42:
//         case 0x43: // LINE F2
//           {
//             drawF(2, ctx.LINE_STRIP);
//           }
//           return;

//         case 0x48:
//         case 0x49:
//         case 0x4a:
//         case 0x4b: // LINE F3
//           {
//             drawF(3, ctx.LINE_STRIP);
//           }
//           return;

//         case 0x4c:
//         case 0x4d:
//         case 0x4e:
//         case 0x4f: // LINE F4
//           {
//             drawF(4, ctx.LINE_STRIP);
//           }
//           return;

//         case 0x50:
//         case 0x51:
//         case 0x52:
//         case 0x53: // LINE G2
//           {
//             drawG(2, ctx.LINE_STRIP);
//           }
//           return;

//         case 0x58:
//         case 0x59:
//         case 0x5a:
//         case 0x5b: // LINE G3
//           {
//             drawG(3, ctx.LINE_STRIP);
//           }
//           return;

//         case 0x5c:
//         case 0x5d:
//         case 0x5e:
//         case 0x5f: // LINE G4
//           {
//             drawG(4, ctx.LINE_STRIP);
//           }
//           return;

//         case 0x60:
//         case 0x61:
//         case 0x62:
//         case 0x63: // TILE S
//           {
//             drawTile(0);
//           }
//           return;

//         case 0x64:
//         case 0x65:
//         case 0x66:
//         case 0x67: // SPRITE S
//           {
//             drawSprite(0);
//           }
//           return;

//         case 0x68:
//         case 0x69:
//         case 0x6a:
//         case 0x6b: // TILE 1
//           {
//             drawTile(1);
//           }
//           return;

//         case 0x70:
//         case 0x71:
//         case 0x72:
//         case 0x73: // TILE 8
//           {
//             drawTile(8);
//           }
//           return;

//         case 0x74:
//         case 0x75:
//         case 0x76:
//         case 0x77: // SPRITE 8
//           {
//             drawSprite(8);
//           }
//           return;

//         case 0x78:
//         case 0x79:
//         case 0x7a:
//         case 0x7b: // TILE 16
//           {
//             drawTile(16);
//           }
//           return;

//         case 0x7c:
//         case 0x7d:
//         case 0x7e:
//         case 0x7f: // SPRITE 16
//           {
//             drawSprite(16);
//           }
//           return;

//         case 0x80: // MOVE IMAGE
//           return;

//         case 0xa0: // LOAD IMAGE
//           {
//             const k = READIMG(data);

//             inn.modeDMA = GPU_DMA_MEM2VRAM;
//             vac.h.p     = vac.h.start = k._2;
//             vac.v.p     = vac.v.start = k._3;
//             vac.h.end   = vac.h.start + k._4;
//             vac.v.end   = vac.v.start + k._5;
//             vac.pvaddr  = vac.v.p*FRAME_W;
//             vac.enabled = true;
//           }
//           return;

//         case 0xc0: // STORE IMAGE
//           return;

//         case 0xe1: // TEXTURE PAGE
//           inn.blend  = (data[0]>>>5)&3;
//           ctx.blendFunc(bit[inn.blend].src, bit[inn.blend].target);
//           return;

//         case 0xe2: // TEXTURE WINDOW
//           return;

//         case 0xe3: // DRAW AREA START
//           return;

//         case 0xe4: // DRAW AREA END
//           return;

//         case 0xe5: // DRAW OFFSET
//           return;

//         case 0xe6: // STP
//           inn.status = (inn.status&(~(3<<11))) | ((data[0]&3)<<11);
//           return;
//       }
//       cpu.consoleWrite(MSG_ERROR, 'GPU Render Primitive '+hex(addr));
//     }
//   };
// })();

// #undef inn
// #undef vac
// // Based on PCSX 1.5

// #define SIO_STAT_TX_READY      0x001
// #define SIO_STAT_RX_READY      0x002
// #define SIO_STAT_TX_EMPTY      0x004
// #define SIO_STAT_PARITY_ERROR  0x008
// #define SIO_STAT_RX_OVERRUN    0x010
// #define SIO_STAT_FRAMING_ERROR 0x020
// #define SIO_STAT_SYNC_DETECT   0x040
// #define SIO_STAT_DSR           0x080
// #define SIO_STAT_CTS           0x100
// #define SIO_STAT_IRQ           0x200

// #define SIO_CTRL_TX_PERM       0x001
// #define SIO_CTRL_DTR           0x002
// #define SIO_CTRL_RX_PERM       0x004
// #define SIO_CTRL_BREAK         0x008
// #define SIO_CTRL_RESET_ERROR   0x010
// #define SIO_CTRL_RTS           0x020
// #define SIO_CTRL_RESET         0x040

// pseudo.CstrSerial = (function() {
//   let baud, control, mode, status, bfr, bfrCount, padst, parp;

//   return {
//     awake() {
//       bfr = new Uint8Array(256);
//     },

//     reset() {
//       bfr.fill(0);
//       baud     = 0;
//       control  = 0;
//       mode     = 0;
//       status   = SIO_STAT_TX_READY | SIO_STAT_TX_EMPTY;
//       bfrCount = 0;
//       padst    = 0;
//       parp     = 0;
//     },

//     write: {
//       h(addr, data) {
//         switch(addr) {
//           case 0x1048: // Mode
//             mode = data;
//             return;

//           case 0x104a: // Control
//             control = data;

//             if (control&SIO_CTRL_RESET_ERROR) {
//               status  &= (~SIO_STAT_IRQ);
//               control &= (~SIO_CTRL_RESET_ERROR);
//             }

//             if (control&SIO_CTRL_RESET || !control) {
//               status = SIO_STAT_TX_READY | SIO_STAT_TX_EMPTY;
//               padst  = 0;
//               parp   = 0;
//             }
//             return;

//           case 0x104e: // Baud
//             baud = data;
//             return;
//         }
//         psx.error('SIO write h '+hex(addr)+' <- '+hex(data));
//       },

//       b(addr, data) {
//         switch(addr) {
//           case 0x1040:
//             switch(padst) {
//               case 1:
//                 if (data&0x40) {
//                   padst = 2;
//                   parp  = 1;

//                   switch(data) {
//                     case 0x42:
//                       bfr[1] = 0x41; //parp
//                       break;

//                     default:
//                       console.dir('SIO write b data '+hex(data));
//                       break;
//                   }
//                 }
//                 bus.interruptSet(IRQ_SIO0);
//                 return;

//               case 2:
//                 parp++;
                
//                 if (parp !== bfrCount) {
//                   bus.interruptSet(IRQ_SIO0);
//                 }
//                 else {
//                   padst = 0;
//                 }
//                 return;
//             }

//             if (data === 1) {
//               status &= !SIO_STAT_TX_EMPTY;
//               status |=  SIO_STAT_RX_READY;
//               padst = 1;
//               parp  = 0;

//               if (control&SIO_CTRL_DTR) {
//                 switch(control) {
//                   case 0x1003:
//                   case 0x3003:
//                     bfrCount = 4;
//                     bfr[0] = 0x00;
//                     bfr[1] = 0x41;
//                     bfr[2] = 0x5a;
//                     bfr[3] = 0xff;
//                     bfr[4] = 0xff;
//                     bus.interruptSet(IRQ_SIO0);
//                     return;
//                 }
//               }
//             }
//             return;
//         }
//         psx.error('SIO write b '+hex(addr)+' <- '+hex(data));
//       }
//     },

//     read: {
//       h(addr) {
//         switch(addr) {
//           case 0x1044:
//             return status;

//           case 0x104a:
//             return control;
//         }
//         psx.error('SIO read h '+hex(addr));
//       },

//       b(addr) {
//         switch(addr) {
//           case 0x1040:
//             {
//               if (!(status&SIO_STAT_RX_READY)) {
//                 return 0;
//               }

//               if (parp === bfrCount) {
//                 status &= ~SIO_STAT_RX_READY;
//                 status |=  SIO_STAT_TX_EMPTY;
//               }
//               return bfr[parp];
//             }
//         }
//         psx.error('SIO read b '+hex(addr));
//       }
//     }
//   };
// })();
const CstrGraphics = function() {
};

// #define ram mem._ram
// #define inn vs._inn
// #define vac vs._vac

// #define GPU_COMMAND(x)//   (x>>>24)&0xff


// #define GPU_DATA   0
// #define GPU_STATUS 4

// #define GPU_ODDLINES 0x80000000

// pseudo.CstrGraphics = (function() {
//   let pipe;

//   const sizePrim = [
//     0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x00
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x10
//     4, 4, 4, 4, 7, 7, 7, 7, 5, 5, 5, 5, 9, 9, 9, 9, // 0x20
//     6, 6, 6, 6, 9, 9, 9, 9, 8, 8, 8, 8,12,12,12,12, // 0x30
//     3, 3, 3, 3, 0, 0, 0, 0, 5, 5, 5, 5, 6, 6, 6, 6, // 0x40
//     4, 4, 4, 4, 0, 0, 0, 0, 7, 7, 7, 7, 9, 9, 9, 9, // 0x50
//     3, 3, 3, 3, 4, 4, 4, 4, 2, 2, 2, 2, 0, 0, 0, 0, // 0x60
//     2, 2, 2, 2, 3, 3, 3, 3, 2, 2, 2, 2, 3, 3, 3, 3, // 0x70
//     4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x80
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x90
//     3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xa0
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xb0
//     3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xc0
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xd0
//     0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xe0
//     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xf0
//   ];

//   const resMode = [
//     256, 320, 512, 640, 368, 384, 512, 640
//   ];

//   function fetchFromVRAM(addr, size) {
//     let count = 0;

//     if (!vac.enabled) {
//       inn.modeDMA = GPU_DMA_NONE;
//       return 0;
//     }
//     size <<= 1;

//     while (vac.v.p < vac.v.end) {
//       while (vac.h.p < vac.h.end) {
//         // Keep position of vram.
//         const pos = (vac.v.p<<10)+vac.h.p;
//         inn.vram.uh[pos] = directMemH(ram.uh, addr);

//         addr+=2;
//         vac.h.p++;

//         if (++count === size) {
//           if (vac.h.p === vac.h.end) {
//             vac.h.p = vac.h.start;
//             vac.v.p++;
//           }
//           return fetchEnd(count);
//         }
//       }

//       vac.h.p = vac.h.start;
//       vac.v.p++;
//     }
//     return fetchEnd(count);
//   }

//   function fetchEnd(count) {
//     if (vac.v.p >= vac.v.end) {
//       inn.modeDMA = GPU_DMA_NONE;
//       vac.enabled = false;

//       


//     }
//     return count>>1;
//   }

//   const write = {
//     data(addr) {
//       if (!pipe.size) {
//         const prim = GPU_COMMAND(addr);
//         const size = sizePrim[prim];

//         if (size) {
//           pipe.data[0] = addr;
//           pipe.prim = prim;
//           pipe.size = size;
//           pipe.row  = 1;
//         }
//         else {
//           return;
//         }
//       }
//       else {
//         pipe.data[pipe.row] = addr;
//         pipe.row++;
//       }

//       // Render primitive
//       if (pipe.size === pipe.row) {
//         pipe.size = 0;
//         pipe.row  = 0;
//         render.prim(pipe.prim, pipe.data);
//       }
//     },

//     dataMem(addr, size) {
//       let i = 0;

//       while (i < size) {
//         if (inn.modeDMA === GPU_DMA_MEM2VRAM) {
//           if ((i += fetchFromVRAM(addr, size-i)) >= size) {
//             continue;
//           }
//           addr += i;
//         }

//         inn.data = directMemW(ram.uw, addr);
//         addr += 4;
//         i++;
//         write.data(inn.data);
//       }
//     }
//   }

//   function pipeReset() {
//     pipe.data.fill(0);
//     pipe.prim = 0;
//     pipe.size = 0;
//     pipe.row  = 0;
//   }

//   // Exposed class functions/variables
//   return {
//     _inn: undefined,
//     _vac: undefined,

//     awake() {
//       this.tcache = new pseudo.CstrTexCache(this);
//       this.tcache.awake();

//       inn = {
//         vram: union(FRAME_W*FRAME_H*2),
//       };

//       // VRAM Operations
//       vac = {
//         h: {},
//         v: {},
//       };

//       // Command Pipe
//       pipe = {
//         data: new Uint32Array(100)
//       };
//     },

//     reset() {
//       this.tcache.reset();

//       inn.vram.uh.fill(0);
//       inn.blend   = 0;
//       inn.data    = 0x400;
//       inn.modeDMA = GPU_DMA_NONE;
//       inn.status  = 0x14802000;

//       // VRAM Operations
//       vac.enabled = false;
//       vac.pvaddr  = 0;
//       vac.h.p     = 0;
//       vac.h.start = 0;
//       vac.h.end   = 0;
//       vac.v.p     = 0;
//       vac.v.start = 0;
//       vac.v.end   = 0;

//       // Command Pipe
//       pipeReset();
//     },

//     redraw() {
//       inn.status ^= GPU_ODDLINES;
//     },

//     scopeW(addr, data) {
//       switch(addr&0xf) {
//         case GPU_DATA:
//           write.data(data);
//           return;

//         case GPU_STATUS:
//           switch(GPU_COMMAND(data)) {
//             case 0x00:
//               inn.status = 0x14802000;
//               return;

//             case 0x01:
//               pipeReset();
//               return;

//             case 0x04:
//               inn.modeDMA = data&3;
//               return;

//             case 0x08:
//               render.resize({
//                 w: resMode[(data&3) | ((data&0x40)>>>4)],
//                 h: (data&4) ? 480 : 240
//               });
//               return;

//             
//             case 0x02:
//             case 0x03:
//             case 0x05:
//             case 0x06:
//             case 0x07:
//             case 0x10:
//               return;
//           }
//           psx.error('GPU Write Status '+hex(GPU_COMMAND(data)));
//           return;
//       }
//     },

//     scopeR(addr) {
//       switch(addr&0xf) {
//         case GPU_DATA:
//           return inn.data;

//         case GPU_STATUS:
//           return inn.status;
//       }
//     },

//     executeDMA(addr) {
//       const size = (bcr>>16)*(bcr&0xffff);

//       switch(chcr) {
//         case 0x00000401: // Disable DMA?
//           return;

//         case 0x01000201:
//           write.dataMem(madr, size);
//           return;

//         case 0x01000401:
//           do {
//             const count = directMemW(ram.uw, madr);
//             write.dataMem((madr+4)&0x1ffffc, count>>>24);
//             madr = count&0xffffff;
//           }
//           while (madr !== 0xffffff);
//           return;
//       }
//       psx.error('GPU DMA '+hex(chcr));
//     }
//   };
// })();

// #undef ram
// #undef inn
// #undef vac
// // Based on FPSE 0.08

// #define	TCACHE_MAX//   2048


// #define TEX_SIZE//   256


// pseudo.CstrTexCache = function(parent) {
//   // private
//   let stack, bTex, ctbl2, idx;

//   function pixel2texel(tx, p, n) {
//     do {
//       const c = parent._inn.vram.uh[p++];
//       tx.ub[idx++] = (c>>0x0)<<3;
//       tx.ub[idx++] = (c>>0x5)<<3;
//       tx.ub[idx++] = (c>>0xa)<<3;
//       tx.ub[idx++] = c ? COLOR_MAX : 0;
//     }
//     while (--n);
//   }

//   // public
//   this.awake = function() {
//     bTex  = union(TEX_SIZE*TEX_SIZE*4);
//     ctbl2 = union(TEX_SIZE*4);
//   };

//   this.reset = function() {
//     stack = [];
//   };

//   this.fetchTexture = function(ctx, tp, clut) {
//     const id = tp | (clut<<16);
    
//     if (stack[id]) {
//       ctx.bindTexture(ctx.TEXTURE_2D, stack[id]);
//       return;
//     }

//     let tex  = (tp&15)*64+(tp&16)*(FRAME_W*256/16);
//     let ctbl = (clut&0x7fff)*16;

//     switch((tp>>7)&3) {
//       case 0: // 04-bit
//         idx = 0;
//         pixel2texel(ctbl2, ctbl, 16);
//         idx = 0;
//         for (let v=0; v<256; v++) {
//           for (let h=0; h<256/4; h++) {
//             const c = parent._inn.vram.uh[tex+h];
//             bTex.uw[idx++] = ctbl2.uw[(c>> 0)&15];
//             bTex.uw[idx++] = ctbl2.uw[(c>> 4)&15];
//             bTex.uw[idx++] = ctbl2.uw[(c>> 8)&15];
//             bTex.uw[idx++] = ctbl2.uw[(c>>12)&15];
//           }
//           tex += FRAME_W;
//         }
//         break;

//       case 1: // 08-bit
//         idx = 0;
//         pixel2texel(ctbl2, ctbl, 256);
//         idx = 0;
//         for (let v=0; v<256; v++) {
//           for (let h=0; h<256/2; h++) {
//             const c = parent._inn.vram.uh[tex+h];
//             bTex.uw[idx++] = ctbl2.uw[(c>>0)&255];
//             bTex.uw[idx++] = ctbl2.uw[(c>>8)&255];
//           }
//           tex += FRAME_W;
//         }
//         break;

//       case 2: // 16-bit
//         idx = 0;
//         for (let v=0; v<256; v++) {
//           pixel2texel(bTex, tex, 256);
//           tex += FRAME_W;
//         }
//         break;
//     }

//     // Create texture
//     stack[id] = ctx.createTexture();
//     ctx.bindTexture  (ctx.TEXTURE_2D, stack[id]);
//     ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
//     ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
//     ctx.texImage2D   (ctx.TEXTURE_2D, 0, ctx.RGBA, TEX_SIZE, TEX_SIZE, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, bTex.ub);
//   };
// }

// #undef inn

// // #define inn vs._inn

// // #define	TCACHE_MAX// //   2048


// // #define TEX_SIZE// //   256


// // pseudo.CstrTexCache = (function() {
// //   let stack, bTex, ctbl2, idx;

// //   function pixel2texel(tx, p, n) {
// //     do {
// //       const c = inn.vram.uh[p++];
// //       tx.ub[idx++] = (c>>0x0)<<3;
// //       tx.ub[idx++] = (c>>0x5)<<3;
// //       tx.ub[idx++] = (c>>0xa)<<3;
// //       tx.ub[idx++] = c ? COLOR_MAX : 0;
// //     }
// //     while (--n);
// //   }

// //   return {
// //     awake: function() {
// //       bTex  = union(TEX_SIZE*TEX_SIZE*4);
// //       ctbl2 = union(TEX_SIZE*4);
// //     },

// //     reset() {
// //       stack = [];
// //     },

// //     fetchTexture(ctx, tp, clut) {
// //       const id = tp | (clut<<16);
      
// //       if (stack[id]) {
// //         ctx.bindTexture(ctx.TEXTURE_2D, stack[id]);
// //         return;
// //       }

// //       var tex  = (tp&15)*64+(tp&16)*(FRAME_W*256/16);
// //       var ctbl = (clut&0x7fff)*16;

// //       switch((tp>>7)&3) {
// //         case 0: // 04-bit
// //           idx = 0;
// //           pixel2texel(ctbl2, ctbl, 16);
// //           idx = 0;
// //           for (let v=0; v<256; v++) {
// //             for (let h=0; h<256/4; h++) {
// //               const c = inn.vram.uh[tex+h];
// //               bTex.uw[idx++] = ctbl2.uw[(c>> 0)&15];
// //               bTex.uw[idx++] = ctbl2.uw[(c>> 4)&15];
// //               bTex.uw[idx++] = ctbl2.uw[(c>> 8)&15];
// //               bTex.uw[idx++] = ctbl2.uw[(c>>12)&15];
// //             }
// //             tex += FRAME_W;
// //           }
// //           break;

// //         case 1: // 08-bit
// //           idx = 0;
// //           pixel2texel(ctbl2, ctbl, 256);
// //           idx = 0;
// //           for (let v=0; v<256; v++) {
// //             for (let h=0; h<256/2; h++) {
// //               const c = inn.vram.uh[tex+h];
// //               bTex.uw[idx++] = ctbl2.uw[(c>>0)&255];
// //               bTex.uw[idx++] = ctbl2.uw[(c>>8)&255];
// //             }
// //             tex += FRAME_W;
// //           }
// //           break;

// //         case 2: // 16-bit
// //           idx = 0;
// //           for (let v=0; v<256; v++) {
// //             pixel2texel(bTex, tex, 256);
// //             tex += FRAME_W;
// //           }
// //           break;
// //       }

// //       // Create texture
// //       ctx.bindTexture(ctx.TEXTURE_2D, (stack[id] = ctx.createTexture()));
// //       ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
// //       ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
// //       ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, TEX_SIZE, TEX_SIZE, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, bTex.ub);
// //     }
// //   };
// // })();

