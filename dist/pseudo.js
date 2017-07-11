



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
const pseudo = window.pseudo || {};










// Assume NTSC for now



// #define PSX_HSYNC//   (33868800/15734)


// This is uttermost experimental, it's the Achilles' heel






























































// Console output



// Format to Hexadecimal



// Arithmetic operations














pseudo.CstrAudio = (function() {
  return {
    awake() {
    }
  };
})();


















pseudo.CstrBus = (function() {
  const interrupts = [{
    code: 0,
    target: 1
  }, {
    code: 1,
    target: 1
  }, {
    code: 2,
    target: 4
  }, {
    code: 3,
    target: 1
  }, {
    code: 4,
    target: 1
  }, {
    code: 5,
    target: 1
  }, {
    code: 6,
    target: 1
  }, {
    code: 7,
    target: 8
  }, {
    code: 8,
    target: 8
  }, {
    code: 9,
    target: 1
  }, {
    code: 10,
    target: 1
  }];

  // Exposed class functions/variables
  return {
    reset() {
      for (const item of interrupts) {
        item.queued = 0;
      }
    },

    interruptsUpdate() { // A method to schedule when IRQs should fire
      for (const item of interrupts) {
        if (item.queued) {
          if (item.queued++ === item.target) {
            pseudo.CstrMem._hwr.uh[((0x1070)&(pseudo.CstrMem._hwr.uh.byteLength-1))>>>1] |= (1<<item.code);
            item.queued = 0;
            break;
          }
        }
      }
    },

    interruptSet(n) {
      interrupts[n].queued = 1;
    },

    checkDMA(addr, data) {
      const chan = ((addr>>>4)&0xf) - 8;

      if (pseudo.CstrMem._hwr.uw[((0x10f0)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2]&(8<<(chan*4))) { // GPU does not execute sometimes
        pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|8)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2] = data;

        switch(chan) {
          case 2: pseudo.CstrGraphics .executeDMA(addr); break; // GPU
          case 4: break; // SPU
          case 6: pseudo.CstrMem.executeDMA(addr); break; // OTC

          default:
            pseudo.CstrMain.error('DMA Channel '+chan);
            break;
        }
        pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|8)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2] = data&(~0x01000000);

        if (pseudo.CstrMem._hwr.uw[((0x10f4)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2]&(1<<(16+chan))) {
          pseudo.CstrMem._hwr.uw[((0x10f4)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2] |= 1<<(24+chan);
          pseudo.CstrBus.interruptSet(3);
        }
      }
    }
  };
})();
// 32-bit accessor



// 16-bit accessor



// 08-bit accessor



// Cop2c


// Cop2d










pseudo.CstrCop2 = (function() {
  const cop2c = union(32*4);
  const cop2d = union(32*4);

  return {
    reset() {
      cop2c.ub.fill(0);
      cop2d.ub.fill(0);
    },

    execute(code) {
      switch(code&0x3f) {
        case 0: // BASIC
          switch(((code>>>21)&0x1f)&7) {
            case 0: // MFC2
              pseudo.CstrMips.setbase(((code>>>16)&0x1f), pseudo.CstrCop2.opcodeMFC2(((code>>>11)&0x1f)));
              return;

            case 2: // CFC2
              pseudo.CstrMips.setbase(((code>>>16)&0x1f), cop2c.uw[( ((code>>>11)&0x1f))]);
              return;

            case 4: // MTC2
              pseudo.CstrCop2.opcodeMTC2(((code>>>11)&0x1f), pseudo.CstrMips.readbase(((code>>>16)&0x1f)));
              return;

            case 6: // CTC2
              pseudo.CstrCop2.opcodeCTC2(((code>>>11)&0x1f), pseudo.CstrMips.readbase(((code>>>16)&0x1f)));
              return;
          }
          pseudo.CstrMain.error('COP2 Basic '+(((code>>>21)&0x1f)&7));
          return;
      }
      //pseudo.CstrMain.error('COP2 Execute '+('0x'+(code&0x3f>>>0).toString(16)));
    },

    opcodeMFC2: function(addr) {
      switch(addr) {
        case  1:
        case  3:
        case  5:
        case  8:
        case  9:
        case 10:
        case 11:
          cop2d.sw[( addr)] = cop2d.sh[( addr<<1)+ 0];
          break;

        case  7:
        case 16:
        case 17:
        case 18:
        case 19:
          cop2d.uw[( addr)] = cop2d.uh[( addr<<1)+ 0];
          break;

        case 15:
          pseudo.CstrMain.error('opcodeMFC2 -> '+addr);
          break;

        case 28:
        case 29:
          pseudo.CstrMain.error('opcodeMFC2 -> '+addr);
          break;

        case 30:
          return 0;
      }

      return cop2d.uw[( addr)];
    },

    opcodeMTC2: function(addr, data) {
      switch(addr) {
        case 15:
          cop2d.uw[(12)] = cop2d.uw[(13)];
          cop2d.uw[(13)] = cop2d.uw[(14)];
          cop2d.uw[(14)] = data;
          cop2d.uw[(15)] = data;
          return;

        case 28:
          cop2d.uw[(28)] = data;
          cop2d.sh[(9<<1)+0]  =(data&0x001f)<<7;
          cop2d.sh[(10<<1)+0]  =(data&0x03e0)<<2;
          cop2d.sh[(11<<1)+0]  =(data&0x7c00)>>3;
          return;

        case 30:
          {
            cop2d.uw[(30)] = data;
            cop2d.uw[(31)] = 0;
            let sbit = (cop2d.uw[(30)]&0x80000000) ? cop2d.uw[(30)] : (~(cop2d.uw[(30)]));

            for ( ; sbit&0x80000000; sbit<<=1) {
              cop2d.uw[(31)]++;
            }
          }
          return;

        case  7:
        case 29:
        case 31:
          return;
      }

      cop2d.uw[( addr)] = data;
    },

    opcodeCTC2: function(addr, data) {
      switch(addr) {
        case  4:
        case 12:
        case 20:
        case 26:
        case 27:
        case 29:
        case 30:
          data = ((data)<<16>>16); // ?
          break;

        
        case 31:
          pseudo.CstrMain.error('opcodeCTC2 -> '+addr+' <- '+('0x'+(data>>>0).toString(16)));
          break;
      }

      cop2c.uw[( addr)] = data;
    }
  };
})();










pseudo.CstrCounters = (function() {
  let timer;
  let vbk;//, dec1;

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
          target  : 0,
          bound : 0xffff
        };
      }

      vbk = 0;
    },

    update() {
      if ((vbk += 64) === (33868800/60)) { vbk = 0;
        pseudo.CstrBus.interruptSet(0);
         pseudo.CstrGraphics.redraw();
        pseudo.CstrMips.setbp();
      }

      // timer[0].count += timer[0].mode&0x100 ? 64 : 64/8;

      // if (timer[0].count >= timer[0].bound) {
      //   timer[0].count = 0;
      //   if (timer[0].mode&0x50) {
      //     //pseudo.CstrBus.interruptSet(4);
      //     pseudo.CstrMain.error('dude 1');
      //   }
      // }

      // if (!(timer[1].mode&0x100)) {
      //   timer[1].count += 64;

      //   if (timer[1].count >= timer[1].bound) {
      //     timer[1].count = 0;
      //     if (timer[1].mode&0x50) {
      //       //pseudo.CstrBus.interruptSet(5);
      //       pseudo.CstrMain.error('dude 2');
      //     }
      //   }
      // }
      // else if ((dec1+=64) >= PSX_HSYNC) {
      //   dec1 = 0;
      //   if (++timer[1].count >= timer[1].bound) {
      //     timer[1].count = 0;
      //     if (timer[1].mode&0x50) {
      //       pseudo.CstrBus.interruptSet(5);
      //     }
      //   }
      // }

      // if (!(timer[2].mode&1)) {
      //   timer[2].count += timer[2].mode&0x200 ? 64/8 : 64;

      //   if (timer[2].count >= timer[2].bound) {
      //     timer[2].count = 0;
      //     if (timer[2].mode&0x50) {
      //       pseudo.CstrBus.interruptSet(6);
      //     }
      //   }
      // }
    },

    scopeW(addr, data) {
      const p = (addr>>>4)&3; // ((addr&0xf)>>>2)

      switch(addr&0xf) {
        case 0:
          timer[p].count = data&0xffff;
          return;

        case 4:
          timer[p].mode  = data;
          timer[p].bound = timer[p].mode&8 ? timer[p].target : 0xffff;
          return;

        case 8:
          timer[p].target  = data&0xffff;
          timer[p].bound = timer[p].mode&8 ? timer[p].target : 0xffff;
          return;
      }

      pseudo.CstrMain.error('RTC Write '+('0x'+(addr&0xf>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
    },

    scopeR(addr) {
      const p = (addr>>>4)&3;

      switch(addr&0xf) {
        case 0:
          return timer[p].count;

        case 4:
          return timer[p].mode;

        case 8:
          return timer[p].target;
      }

      pseudo.CstrMain.error('RTC Read '+('0x'+(addr&0xf>>>0).toString(16)));
      return 0;
    }
  };
})();


pseudo.CstrHardware = (function() {
  // Exposed class functions/variables
  return {
    write: {
      w(addr, data) {
        if (addr >= 0x1080 && addr <= 0x10e8) { // DMA
          if (addr&8) {
            pseudo.CstrBus.checkDMA(addr, data);
            return;
          }
          pseudo.CstrMem._hwr.uw[(( addr)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2] = data;
          return;
        }

        if (addr >= 0x1104 && addr <= 0x1124) { // Rootcounters
          pseudo.CstrCounters.scopeW(addr, data);
          return;
        }

        if (addr >= 0x1810 && addr <= 0x1814) { // Graphics
          pseudo.CstrGraphics.scopeW(addr, data);
          return;
        }

        switch(addr) {
          case 0x1070:
            pseudo.CstrMem._hwr.uw[((0x1070)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2] &= data&pseudo.CstrMem._hwr.uw[((0x1074)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2];
            return;

          case 0x10f4: // Thanks Calb, Galtor :)
            pseudo.CstrMem._hwr.uw[((0x10f4)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2] = (pseudo.CstrMem._hwr.uw[((0x10f4)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2]&(~((data&0xff000000)|0xffffff)))|(data&0xffffff);
            return;

          
          case 0x1000:
          case 0x1004:
          case 0x1008:
          case 0x100c:
          case 0x1010:
          case 0x1014:
          case 0x1018:
          case 0x101c:
          case 0x1020:
          case 0x1060:
          case 0x1074:
          case 0x10f0:
            pseudo.CstrMem._hwr.uw[(( addr)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2] = data;
            return;
        }
        pseudo.CstrMain.error('Hardware Write w '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      h(addr, data) {
        if (addr >= 0x1048 && addr <= 0x104e) { // Controls
          pseudo.CstrSerial.write.h(addr, data);
          return;
        }

        if (addr >= 0x1100 && addr <= 0x1128) { // Rootcounters
          pseudo.CstrCounters.scopeW(addr, data);
          return;
        }
        
        if (addr >= 0x1c00 && addr <= 0x1dfe) { // Audio
          pseudo.CstrMem._hwr.uh[(( addr)&(pseudo.CstrMem._hwr.uh.byteLength-1))>>>1] = data;
          return;
        }

        switch(addr) {
          case 0x1070:
            pseudo.CstrMem._hwr.uh[((0x1070)&(pseudo.CstrMem._hwr.uh.byteLength-1))>>>1] &= data&pseudo.CstrMem._hwr.uh[((0x1074)&(pseudo.CstrMem._hwr.uh.byteLength-1))>>>1];
            return;
          
          
          case 0x1014:
          case 0x1074:
            pseudo.CstrMem._hwr.uh[(( addr)&(pseudo.CstrMem._hwr.uh.byteLength-1))>>>1] = data;
            return;
        }
        pseudo.CstrMain.error('Hardware Write h '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      b(addr, data) {
        switch(addr) {
          case 0x1040:
            pseudo.CstrSerial.write.b(addr, data);
            return;

          
          case 0x2041: // DIP Switch?
            pseudo.CstrMem._hwr.ub[(( addr)&(pseudo.CstrMem._hwr.ub.byteLength-1))>>>0] = data;
            return;
        }
        pseudo.CstrMain.error('Hardware Write b '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      }
    },

    read: {
      w(addr) {
        if (addr >= 0x1080 && addr <= 0x10e8) { // DMA
          return pseudo.CstrMem._hwr.uw[(( addr)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2];
        }

        if (addr >= 0x1100 && addr <= 0x1110) { // Rootcounters
          return pseudo.CstrCounters.scopeR(addr);
        }

        if (addr >= 0x1810 && addr <= 0x1814) { // Graphics
          return pseudo.CstrGraphics.scopeR(addr);
        }

        switch(addr) {
          
          case 0x1014:
          case 0x1070:
          case 0x1074:
          case 0x10f0:
          case 0x10f4:
            return pseudo.CstrMem._hwr.uw[(( addr)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2];
        }
        pseudo.CstrMain.error('Hardware Read w '+('0x'+(addr>>>0).toString(16)));
      },

      h(addr) {
        if (addr >= 0x1044 && addr <= 0x104a) { // Controls
          return pseudo.CstrSerial.read.h(addr);
        }

        if (addr >= 0x1110 && addr <= 0x1124) { // Rootcounters
          return pseudo.CstrCounters.scopeR(addr);
        }

        if (addr >= 0x1c00 && addr <= 0x1e0e) { // Audio
          return pseudo.CstrMem._hwr.uh[(( addr)&(pseudo.CstrMem._hwr.uh.byteLength-1))>>>1];
        }

        switch(addr) {
          
          case 0x1014:
          case 0x1070:
          case 0x1074:
            return pseudo.CstrMem._hwr.uh[(( addr)&(pseudo.CstrMem._hwr.uh.byteLength-1))>>>1];
        }
        pseudo.CstrMain.error('Hardware Read h '+('0x'+(addr>>>0).toString(16)));
      },

      b(addr) {
        switch(addr) {
          case 0x1040: // Controls
            return pseudo.CstrSerial.read.b(addr);
        }
        pseudo.CstrMain.error('Hardware Read b '+('0x'+(addr>>>0).toString(16)));
      }
    }
  };
})();









pseudo.CstrMem = (function() {
  // Exposed class functions/variables
  return {
    _ram: union(0x200000),
    _rom: union(0x80000),
    _hwr: union(0x4000),

    reset() {
      // Reset all, except for BIOS?
      pseudo.CstrMem._ram.ub.fill(0);
      pseudo.CstrMem._hwr.ub.fill(0);
    },

    write: {
      w(addr, data) {
        switch(addr>>>24) {
          case 0x00: // Base RAM
          case 0x80: // Mirror
          case 0xa0: // Mirror
            if (pseudo.CstrMips.writeOK()) {
              pseudo.CstrMem._ram.uw[(( addr)&(pseudo.CstrMem._ram.uw.byteLength-1))>>>2] = data;
            }
            return;

          case 0x1f: // Scratchpad + Hardware
            addr&=0xffff;
            if (addr <= 0x3ff) {
              pseudo.CstrMem._hwr.uw[(( addr)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2] = data;
              return;
            }
            pseudo.CstrHardware.write.w(addr, data);
            return;
        }

        if (addr === 0xfffe0130) { // Mem Access
          return;
        }
        pseudo.CstrMain.error('Mem Write w '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      h(addr, data) {
        switch(addr>>>24) {
          case 0x00: // Base RAM
          case 0x80: // Mirror
            pseudo.CstrMem._ram.uh[(( addr)&(pseudo.CstrMem._ram.uh.byteLength-1))>>>1] = data;
            return;

          case 0x1f: // Hardware
            addr&=0xffff;
            if (addr <= 0x3ff) {
              pseudo.CstrMem._hwr.uh[(( addr)&(pseudo.CstrMem._hwr.uh.byteLength-1))>>>1] = data;
              return;
            }
            pseudo.CstrHardware.write.h(addr, data);
            return;
        }
        pseudo.CstrMain.error('Mem Write h '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      b(addr, data) {
        switch(addr>>>24) {
          case 0x00: // Base RAM
          case 0x80: // Mirror
          case 0xa0: // Mirror
            pseudo.CstrMem._ram.ub[(( addr)&(pseudo.CstrMem._ram.ub.byteLength-1))>>>0] = data;
            return;

          case 0x1f: // Hardware
            addr&=0xffff;
            if (addr <= 0x3ff) {
              pseudo.CstrMem._hwr.ub[(( addr)&(pseudo.CstrMem._hwr.ub.byteLength-1))>>>0] = data;
              return;
            }
            pseudo.CstrHardware.write.b(addr, data);
            return;
        }
        pseudo.CstrMain.error('Mem Write b '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      }
    },

    read: {
      w(addr) {
        switch(addr>>>24) {
          case 0x00: // Base RAM
          case 0x80: // Mirror
          case 0xa0: // Mirror
            return pseudo.CstrMem._ram.uw[(( addr)&(pseudo.CstrMem._ram.uw.byteLength-1))>>>2];

          case 0xbf: // BIOS
            return pseudo.CstrMem._rom.uw[(( addr)&(pseudo.CstrMem._rom.uw.byteLength-1))>>>2];

          case 0x1f: // Hardware
            addr&=0xffff;
            if (addr <= 0x3ff) {
              return pseudo.CstrMem._hwr.uw[(( addr)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2];
            }
            return pseudo.CstrHardware.read.w(addr);
        }
        pseudo.CstrMain.error('Mem Read w '+('0x'+(addr>>>0).toString(16)));
        return 0;
      },

      h(addr) {
        switch(addr>>>24) {
          case 0x00: // Base RAM
          case 0x80: // Mirror
            return pseudo.CstrMem._ram.uh[(( addr)&(pseudo.CstrMem._ram.uh.byteLength-1))>>>1];

          case 0x1f: // Hardware
            addr&=0xffff;
            if (addr <= 0x3ff) {
              return pseudo.CstrMem._hwr.uh[(( addr)&(pseudo.CstrMem._hwr.uh.byteLength-1))>>>1];
            }
            return pseudo.CstrHardware.read.h(addr);
        }
        pseudo.CstrMain.error('Mem Read h '+('0x'+(addr>>>0).toString(16)));
        return 0;
      },

      b(addr) {
        switch(addr>>>24) {
          case 0x00: // Base RAM
          case 0x80: // Mirror
            return pseudo.CstrMem._ram.ub[(( addr)&(pseudo.CstrMem._ram.ub.byteLength-1))>>>0];

          case 0xbf: // BIOS
            return pseudo.CstrMem._rom.ub[(( addr)&(pseudo.CstrMem._rom.ub.byteLength-1))>>>0];

          case 0x1f: // Hardware
            // if (addr === 0x1f000084) { // PIO?
            //   return 0;
            // }
            addr&=0xffff;
            if (addr <= 0x3ff) {
              return pseudo.CstrMem._hwr.ub[(( addr)&(pseudo.CstrMem._hwr.ub.byteLength-1))>>>0];
            }
            return pseudo.CstrHardware.read.b(addr);
        }
        pseudo.CstrMain.error('Mem Read b '+('0x'+(addr>>>0).toString(16)));
        return 0;
      }
    },

    executeDMA: function(addr) {
      if (!pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|4)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2] || pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|8)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2] !== 0x11000002) {
        return;
      }
      pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2]&=0xffffff;

      while (--pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|4)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2]) {
        pseudo.CstrMem._ram.uw[(( pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2])&(pseudo.CstrMem._ram.uw.byteLength-1))>>>2] = (pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2]-4)&0xffffff;
        pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2]-=4;
      }
      pseudo.CstrMem._ram.uw[(( pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2])&(pseudo.CstrMem._ram.uw.byteLength-1))>>>2] = 0xffffff;
    }
  };
})();








// Inline functions for speedup



























pseudo.CstrMips = (function() {
  // Base + Coprocessor
  let r, copr;
  let opcodeCount;
  let cacheAddr, power32; // Cache for expensive calculation

  // Emulation loop handlers
  let bp, requestAF;
  let output;

  const mask = [
    [0x00ffffff, 0x0000ffff, 0x000000ff, 0x00000000],
    [0x00000000, 0xff000000, 0xffff0000, 0xffffff00],
    [0xffffff00, 0xffff0000, 0xff000000, 0x00000000],
    [0x00000000, 0x000000ff, 0x0000ffff, 0x00ffffff],
  ];

  const shift = [
    [0x18, 0x10, 0x08, 0x00],
    [0x00, 0x08, 0x10, 0x18],
    [0x18, 0x10, 0x08, 0x00],
    [0x00, 0x08, 0x10, 0x18],
  ];

  // Base CPU stepper
  function step(inslot) {
    const code = r[32]>>>20 === 0xbfc ? pseudo.CstrMem._rom.uw[(( r[32])&(pseudo.CstrMem._rom.uw.byteLength-1))>>>2] : pseudo.CstrMem._ram.uw[(( r[32])&(pseudo.CstrMem._ram.uw.byteLength-1))>>>2];
    opcodeCount++;
    r[32]  += 4;
    r[0] = 0; // As weird as this seems, it is needed

    switch(((code>>>26)&0x3f)) {
      case 0: // SPECIAL
        switch(code&0x3f) {
          case 0: // SLL
            r[((code>>>11)&0x1f)] = r[((code>>>16)&0x1f)] << ((code>>>6)&0x1f);
            return;

          case 2: // SRL
            r[((code>>>11)&0x1f)] = r[((code>>>16)&0x1f)] >>> ((code>>>6)&0x1f);
            return;

          case 3: // SRA
            r[((code>>>11)&0x1f)] = ((r[((code>>>16)&0x1f)])<<0>>0) >> ((code>>>6)&0x1f);
            return;

          case 4: // SLLV
            r[((code>>>11)&0x1f)] = r[((code>>>16)&0x1f)] << (r[((code>>>21)&0x1f)]&0x1f);
            return;

          case 6: // SRLV
            r[((code>>>11)&0x1f)] = r[((code>>>16)&0x1f)] >>> (r[((code>>>21)&0x1f)]&0x1f);
            return;

          case 7: // SRAV
            r[((code>>>11)&0x1f)] = ((r[((code>>>16)&0x1f)])<<0>>0) >> (r[((code>>>21)&0x1f)]&0x1f);
            return;

          case 8: // JR
            branch(r[((code>>>21)&0x1f)]);
            if (r[32] === 0xb0) { if (r[9] === 59 || r[9] === 61) { const char = String.fromCharCode(r[4]&0xff).replace(/\n/, '<br/>'); output.append(char.toUpperCase()); } };
            return;

          case 9: // JALR
            r[((code>>>11)&0x1f)] = r[32]+4;
            branch(r[((code>>>21)&0x1f)]);
            return;

          case 12: // SYSCALL
            r[32]-=4;
            copr[12] = (copr[12]&0xffffffc0)|((copr[12]<<2)&0x3f); copr[13] = 0x20; copr[14] = r[32]; r[32] = 0x80;
            return;

          case 13: // BREAK
            return;

          case 16: // MFHI
            r[((code>>>11)&0x1f)] = r[34];
            return;

          case 17: // MTHI
            r[34] = r[((code>>>21)&0x1f)];
            return;

          case 18: // MFLO
            r[((code>>>11)&0x1f)] = r[33];
            return;

          case 19: // MTLO
            r[33] = r[((code>>>21)&0x1f)];
            return;

          case 24: // MULT
            cacheAddr = ((r[((code>>>21)&0x1f)])<<0>>0) *  ((r[((code>>>16)&0x1f)])<<0>>0); r[33] = cacheAddr&0xffffffff; r[34] = (cacheAddr/power32) | 0;
            return;

          case 25: // MULTU
            cacheAddr = r[((code>>>21)&0x1f)] *  r[((code>>>16)&0x1f)]; r[33] = cacheAddr&0xffffffff; r[34] = (cacheAddr/power32) | 0;
            return;

          case 26: // DIV
            if ( ((r[((code>>>16)&0x1f)])<<0>>0)) { r[33] = ((r[((code>>>21)&0x1f)])<<0>>0) /  ((r[((code>>>16)&0x1f)])<<0>>0); r[34] = ((r[((code>>>21)&0x1f)])<<0>>0) %  ((r[((code>>>16)&0x1f)])<<0>>0); };
            return;

          case 27: // DIVU
            if ( r[((code>>>16)&0x1f)]) { r[33] = r[((code>>>21)&0x1f)] /  r[((code>>>16)&0x1f)]; r[34] = r[((code>>>21)&0x1f)] %  r[((code>>>16)&0x1f)]; };
            return;

          case 32: // ADD
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] + r[((code>>>16)&0x1f)];
            return;

          case 33: // ADDU
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] + r[((code>>>16)&0x1f)];
            return;

          case 34: // SUB
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] - r[((code>>>16)&0x1f)];
            return;

          case 35: // SUBU
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] - r[((code>>>16)&0x1f)];
            return;

          case 36: // AND
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] & r[((code>>>16)&0x1f)];
            return;

          case 37: // OR
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] | r[((code>>>16)&0x1f)];
            return;

          case 38: // XOR
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] ^ r[((code>>>16)&0x1f)];
            return;

          case 39: // NOR
            r[((code>>>11)&0x1f)] = ~(r[((code>>>21)&0x1f)] | r[((code>>>16)&0x1f)]);
            return;

          case 42: // SLT
            r[((code>>>11)&0x1f)] = ((r[((code>>>21)&0x1f)])<<0>>0) < ((r[((code>>>16)&0x1f)])<<0>>0);
            return;

          case 43: // SLTU
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] < r[((code>>>16)&0x1f)];
            return;
        }
        pseudo.CstrMain.error('Special CPU instruction '+(code&0x3f));
        return;

      case 1: // REGIMM
        switch (((code>>>16)&0x1f)) {
          case 0: // BLTZ
            if (((r[((code>>>21)&0x1f)])<<0>>0) < 0) {
              branch((r[32]+((((code)<<16>>16))<<2)));
            }
            return;

          case 1: // BGEZ
            if (((r[((code>>>21)&0x1f)])<<0>>0) >= 0) {
              branch((r[32]+((((code)<<16>>16))<<2)));
            }
            return;

          case 17: // BGEZAL
            r[31] = r[32]+4;
            if (((r[((code>>>21)&0x1f)])<<0>>0) >= 0) {
              branch((r[32]+((((code)<<16>>16))<<2)));
            }
            return;
        }
        pseudo.CstrMain.error('Bcond CPU instruction '+((code>>>16)&0x1f));
        return;

      case 2: // J
        branch(((r[32]&0xf0000000)|(code&0x3ffffff)<<2));
        return;

      case 3: // JAL
        r[31] = r[32]+4;
        branch(((r[32]&0xf0000000)|(code&0x3ffffff)<<2));
        return;

      case 4: // BEQ
        if (r[((code>>>21)&0x1f)] === r[((code>>>16)&0x1f)]) {
          branch((r[32]+((((code)<<16>>16))<<2)));
        }
        return;

      case 5: // BNE
        if (r[((code>>>21)&0x1f)] !== r[((code>>>16)&0x1f)]) {
          branch((r[32]+((((code)<<16>>16))<<2)));
        }
        return;

      case 6: // BLEZ
        if (((r[((code>>>21)&0x1f)])<<0>>0) <= 0) {
          branch((r[32]+((((code)<<16>>16))<<2)));
        }
        return;

      case 7: // BGTZ
        if (((r[((code>>>21)&0x1f)])<<0>>0) > 0) {
          branch((r[32]+((((code)<<16>>16))<<2)));
        }
        return;

      case 8: // ADDI
        r[((code>>>16)&0x1f)] = r[((code>>>21)&0x1f)] + (((code)<<16>>16));
        return;

      case 9: // ADDIU
        r[((code>>>16)&0x1f)] = r[((code>>>21)&0x1f)] + (((code)<<16>>16));
        return;

      case 10: // SLTI
        r[((code>>>16)&0x1f)] = ((r[((code>>>21)&0x1f)])<<0>>0) < (((code)<<16>>16));
        return;

      case 11: // SLTIU
        r[((code>>>16)&0x1f)] = r[((code>>>21)&0x1f)] < (code&0xffff);
        return;

      case 12: // ANDI
        r[((code>>>16)&0x1f)] = r[((code>>>21)&0x1f)] & (code&0xffff);
        return;

      case 13: // ORI
        r[((code>>>16)&0x1f)] = r[((code>>>21)&0x1f)] | (code&0xffff);
        return;

      case 14: // XORI
        r[((code>>>16)&0x1f)] = r[((code>>>21)&0x1f)] ^ (code&0xffff);
        return;

      case 15: // LUI
        r[((code>>>16)&0x1f)] = code<<16;
        return;

      case 16: // COP0
        switch (((code>>>21)&0x1f)) {
          case 0: // MFC0
            r[((code>>>16)&0x1f)] = copr[((code>>>11)&0x1f)];
            return;

          case 4: // MTC0
            copr[((code>>>11)&0x1f)] = r[((code>>>16)&0x1f)];
            return;

          case 16: // RFE
            copr[12] = (copr[12]&0xfffffff0)|((copr[12]>>>2)&0xf);
            return;
        }
        pseudo.CstrMain.error('Coprocessor 0 instruction '+((code>>>21)&0x1f));
        return;

      case 18: // COP2
        pseudo.CstrCop2.execute(code);
        return;

      case 32: // LB
        r[((code>>>16)&0x1f)] = ((pseudo.CstrMem.read.b((r[((code>>>21)&0x1f)]+(((code)<<16>>16)))))<<24>>24);
        return;

      case 33: // LH
        r[((code>>>16)&0x1f)] = ((pseudo.CstrMem.read.h((r[((code>>>21)&0x1f)]+(((code)<<16>>16)))))<<16>>16);
        return;

      case 34: // LWL
        cacheAddr = (r[((code>>>21)&0x1f)]+(((code)<<16>>16)));
        r[((code>>>16)&0x1f)] = (r[((code>>>16)&0x1f)]&mask[0][cacheAddr&3]) | (pseudo.CstrMem.read.w(cacheAddr&~3)<<shift[0][cacheAddr&3]);
        return;

      case 35: // LW
        r[((code>>>16)&0x1f)] = pseudo.CstrMem.read.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16))));
        return;

      case 36: // LBU
        r[((code>>>16)&0x1f)] = pseudo.CstrMem.read.b((r[((code>>>21)&0x1f)]+(((code)<<16>>16))));
        return;

      case 37: // LHU
        r[((code>>>16)&0x1f)] = pseudo.CstrMem.read.h((r[((code>>>21)&0x1f)]+(((code)<<16>>16))));
        return;

      case 38: // LWR
        cacheAddr = (r[((code>>>21)&0x1f)]+(((code)<<16>>16)));
        r[((code>>>16)&0x1f)] = (r[((code>>>16)&0x1f)]&mask[1][cacheAddr&3]) | (pseudo.CstrMem.read.w(cacheAddr&~3)>>shift[1][cacheAddr&3]);
        return;

      case 40: // SB
        pseudo.CstrMem.write.b((r[((code>>>21)&0x1f)]+(((code)<<16>>16))), r[((code>>>16)&0x1f)]);
        return;

      case 41: // SH
        pseudo.CstrMem.write.h((r[((code>>>21)&0x1f)]+(((code)<<16>>16))), r[((code>>>16)&0x1f)]);
        return;

      case 42: // SWL
        cacheAddr = (r[((code>>>21)&0x1f)]+(((code)<<16>>16)));
        pseudo.CstrMem.write.w(cacheAddr&~3, (r[((code>>>16)&0x1f)]>>shift[2][cacheAddr&3]) | (pseudo.CstrMem.read.w(cacheAddr&~3)&mask[2][cacheAddr&3]));
        return;

      case 43: // SW
        pseudo.CstrMem.write.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16))), r[((code>>>16)&0x1f)]);
        return;

      case 46: // SWR
        cacheAddr = (r[((code>>>21)&0x1f)]+(((code)<<16>>16)));
        pseudo.CstrMem.write.w(cacheAddr&~3, (r[((code>>>16)&0x1f)]<<shift[3][cacheAddr&3]) | (pseudo.CstrMem.read.w(cacheAddr&~3)&mask[3][cacheAddr&3]));
        return;

      case 50: // LWC2
        pseudo.CstrCop2.opcodeMTC2(pseudo.CstrMem.read.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16)))), ((code>>>16)&0x1f));
        return;

      case 58: // SWC2
        pseudo.CstrMem.write.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16))), pseudo.CstrCop2.opcodeMFC2(((code>>>16)&0x1f)));
        return;
    }
    pseudo.CstrMain.error('Basic CPU instruction '+((code>>>26)&0x3f));
  }

  function branch(addr) {
    // Execute instruction in slot
    step(true);
    r[32] = addr;

    if (opcodeCount >= 64) {
      // Rootcounters, interrupts
      pseudo.CstrCounters.update();
      pseudo.CstrBus.interruptsUpdate();

      // Exceptions
      if (pseudo.CstrMem._hwr.uw[((0x1070)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2]&pseudo.CstrMem._hwr.uw[((0x1074)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2]) {
        if ((copr[12]&0x401) === 0x401) {
          copr[12] = (copr[12]&0xffffffc0)|((copr[12]<<2)&0x3f); copr[13] = 0x400; copr[14] = r[32]; r[32] = 0x80;
        }
      }
      opcodeCount %= 64;
    }
  }

  // Exposed class functions/variables
  return {
    awake(element) {
         r = new Uint32Array(32 + 3); // + r[32], r[33], r[34]
      copr = new Uint32Array(16);

      // Cache
      power32 = Math.pow(2, 32); // Btw, pure multiplication is faster
      output  = element;
    },

    reset() {
      // Break emulation loop
      cancelAnimationFrame(requestAF);
      requestAF = undefined;

      // Reset processors
         r.fill(0);
      copr.fill(0);

      copr[12] = 0x10900000;
      copr[15] = 0x2;

      r[32] = 0xbfc00000;
      opcodeCount = 0;

      // Clear console out
      output.text(' ');

      // BIOS bootstrap
      pseudo.CstrMips.consoleWrite('info', 'BIOS file has been written to ROM');
      const start = performance.now();

      while (r[32] !== 0x80030000) {
        step(false);
      }
      const delta = parseFloat(performance.now()-start).toFixed(2);
      pseudo.CstrMips.consoleWrite('info', 'Bootstrap completed in '+delta+' ms');
    },

    run() {
      bp = false;

      while (!bp) { // No sleep till BROOKLYN
        step(false);
      }
      requestAF = requestAnimationFrame(pseudo.CstrMips.run);
    },

    exeHeader(hdr) {
      r[32]    = hdr[2+ 2];
      r[28] = hdr[2+ 3];
      r[29] = hdr[2+10];
    },

    writeOK() {
      return !(copr[12]&0x10000);
    },

    consoleWrite(kind, str) {
      output.append('<div class="'+kind+'"><span>PSeudo:: </span>'+str+'</div>');
    },

    setbp() {
      bp = true;
    },

    setbase: function(addr, data) {
      r[addr] = data;
    },

    readbase: function(addr) {
      return r[addr];
    },
  };
})();










pseudo.CstrMain = (function() {
  let unusable;
  let file;

  // AJAX function
  function request(path, fn) {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if (xhr.status === 404) {
        pseudo.CstrMips.consoleWrite('error', 'Unable to read file "'+path+'"');
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
     pseudo.CstrRender.reset();
         pseudo.CstrGraphics.reset();
        pseudo.CstrMem.reset();
    pseudo.CstrCounters.reset();
        pseudo.CstrBus.reset();
        pseudo.CstrSerial.reset();
       pseudo.CstrCop2.reset();
        pseudo.CstrMips.reset();

    return true;
  }

  function prepareExe(resp) {
    const header = new Uint32Array(resp, 0, 0x800);
    const offset = header[2+4]&(pseudo.CstrMem._ram.ub.byteLength-1); // Offset needs boundaries... huh?
    const size   = header[2+5];

    // Set pseudo.CstrMem
    pseudo.CstrMem._ram.ub.set(new Uint8Array(resp, 0x800, size), offset);
    
    // Set processor
    pseudo.CstrMips.exeHeader(header);
    pseudo.CstrMips.consoleWrite('info', 'PSX-EXE has been transferred to RAM');
  }

  // Exposed class functions/variables
  return {
    awake() {
      unusable = false;
      file = undefined;

      $(function() { // DOMContentLoaded
         pseudo.CstrRender.awake($('#screen'), $('#resolution'));
             pseudo.CstrGraphics.awake();
        pseudo.CstrCounters.awake();
            pseudo.CstrSerial.awake();
            pseudo.CstrMips.awake($('#output'));

        request('bios/scph1001.bin', function(resp) {
          // Move BIOS to Mem
          pseudo.CstrMem._rom.ub.set(new Uint8Array(resp));
        });
      });
    },

    run(path) {
      if (reset()) {
        if (path === 'bios') { // BIOS run
          pseudo.CstrMips.run();
        }
        else { // Homebrew run
          request(path, function(resp) {
            prepareExe(resp);
            pseudo.CstrMips.run();
          });
        }
      }
    },

    fileDrop(e) {
      e.preventDefault();
      const dt = e.dataTransfer;

      if (dt.files) {
        file = dt.files[0];
        
        // PS-X EXE
        chunkReader(file, 0x0000, 8, function(id) {
          if (id === 'PS-X EXE') {
            const reader  = new FileReader();
            reader.onload = function(e) { // Callback
              if (reset()) {
                prepareExe(e.target.result);
                pseudo.CstrMips.run();
              }
            };
            // Read file
            reader.readAsArrayBuffer(file);
          }
        });

        // ISO 9660
        chunkReader(file, 0x9319, 5, function(id) {
          if (id === 'CD001') {
            chunkReader(file, 0x9340, 32, function(name) { // Get Name
              pseudo.CstrMips.consoleWrite('error', 'CD ISO with code "'+name.trim()+'" not supported for now');
            });
          }
        });
      }
    },

    dropPrevent(e) {
      e.preventDefault();
    },

    error(out) {
      throw new Error('PSeudo / '+out);
    }
  };
})();








































// Fix: SIGN_EXT_16

























































pseudo.CstrRender = (function() {
  // HTML elements
  let screen, resolution;
  
  let ctx;      // 'webgl' Context
  let attrib;   // Enable/Disable Attributes on demand
  let bfr;      // Draw buffers
  let res, bit; // Resolution & Blend

  // Generic function for shaders
  function createShader(kind, content) {
    const shader = ctx.createShader(kind);
    ctx.shaderSource (shader, content);
    ctx.compileShader(shader);
    ctx.getShaderParameter(shader, ctx.COMPILE_STATUS);

    return shader;
  }

  // Exposed class functions/variables
  return {
    awake(divScreen, divResolution) {
      // Get HTML elements
      screen     = divScreen[0];
      resolution = divResolution[0];

      // 'webgl' Canvas
      ctx = screen.getContext('webgl');
      ctx. enable(ctx.BLEND);
      ctx.disable(ctx.DEPTH_TEST);
      ctx.disable(ctx.CULL_FACE);
      ctx.clearColor(0.0, 0.0, 0.0, 1.0);

      // Shaders
      const func = ctx.createProgram();
      ctx.attachShader(func, createShader(ctx.  VERTEX_SHADER, '  attribute vec2 a_position;  attribute vec4 a_color;  uniform vec2 u_resolution;  varying vec4 v_color;    void main() {    gl_Position = vec4(((a_position / u_resolution) - 1.0) * vec2(1, -1), 0, 1);    v_color = a_color;  }'));
      ctx.attachShader(func, createShader(ctx.FRAGMENT_SHADER, '  precision mediump float;  varying vec4 v_color;    void main() {    gl_FragColor = v_color;  }'));
      ctx.linkProgram(func);
      ctx.getProgramParameter(func, ctx.LINK_STATUS);
      ctx.useProgram (func);

      // Attributes
      attrib = {
        _c: ctx.getAttribLocation(func, 'a_color'),
        _p: ctx.getAttribLocation(func, 'a_position'),
        _r: ctx.getUniformLocation  (func, 'u_resolution')
      };

      ctx.enableVertexAttribArray(attrib._c);
      ctx.enableVertexAttribArray(attrib._p);

      // Buffers
      bfr = {
        _c: ctx.createBuffer(),
        _v: ctx.createBuffer(),
        _t: ctx.createBuffer(),
      };

      // Blend
      bit = [
        { src: ctx.SRC_ALPHA, target: ctx.ONE_MINUS_SRC_ALPHA, opaque: 128 },
        { src: ctx.ONE,       target: ctx.ONE_MINUS_SRC_ALPHA, opaque:   0 },
        { src: ctx.ZERO,      target: ctx.ONE_MINUS_SRC_COLOR, opaque:   0 },
        { src: ctx.SRC_ALPHA, target: ctx.ONE,                 opaque:  64 },
      ];

      // Standard value
      res = {
        native     : { w:   0, h:   0 },
        override   : { w: 320, h: 240 },
        multiplier : 1
      };
    },

    reset() {
      pseudo.CstrRender.resize({ w: 320, h: 240 });
      ctx.clear(ctx.COLOR_BUFFER_BIT);
    },

    resize(data) {
      // Check if we have a valid resolution
      if (data.w > 0 && data.h > 0) {
        // Store valid resolution
        res.native.w = data.w;
        res.native.h = data.h;

        // Native PSX resolution
        ctx.uniform2f(attrib._r, data.w/2, data.h/2);
        resolution.innerText = data.w+' x '+data.h;

        // Construct desired resolution
        let w = (res.override.w || data.w) * res.multiplier;
        let h = (res.override.h || data.h) * res.multiplier;

        screen.width = w;
        screen.height   = h;
        ctx.viewport(0, 0, w, h);
      }
      else {
        console.info('Not a valid resolution');
      }
    },

    doubleResolution() {
      res.multiplier = res.multiplier === 1 ? 2 : 1;

      // Show/hide elements
      if (res.multiplier === 1) {
        $('#bar-boxes').show();
      }
      else {
        $('#bar-boxes').hide();
      }

      // Redraw
      pseudo.CstrRender.resize({ w: res.native.w, h: res.native.h });
    },

    prim(addr, data) {
      switch(addr) {
        case 0x01: // FLUSH
          return;

        case 0x02: // BLOCK FILL
          {
            const k  = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,} ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[2]>> 0)&0xffff, _Y: (data[2]>>16)&0xffff,}, ]};
            const cr = [];

            for (let i=0; i<4; i++) {
              cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, 255);
            }

            const vx = [
              k.vx[0]._X,            k.vx[0]._Y,
              k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y,
              k.vx[0]._X,            k.vx[0]._Y+k.vx[1]._Y,
              k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y+k.vx[1]._Y,
            ];

            ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW);
            ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW);
            ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
          }
          return;

        case 0x20:
        case 0x21:
        case 0x22:
        case 0x23: // POLY F3
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,} ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[2]>> 0)&0xffff, _Y: (data[2]>>16)&0xffff,}, { _X: (data[3]>> 0)&0xffff, _Y: (data[3]>>16)&0xffff,}, { _X: (data[4]>> 0)&0xffff, _Y: (data[4]>>16)&0xffff,}, ]}; const cr = []; const vx = []; const b = [ k.cr[0]._A&2 ? pseudo.CstrGraphics._inn.blend : 0, k.cr[0]._A&2 ? bit[pseudo.CstrGraphics._inn.blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (let i=0; i<3; i++) { cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]); vx.push(k.vx[i]._X, k.vx[i]._Y); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays( ctx.TRIANGLE_STRIP, 0, 3);
          }
          return;

        case 0x24:
        case 0x25:
        case 0x26:
        case 0x27: // POLY FT3
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,} ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[3]>> 0)&0xffff, _Y: (data[3]>>16)&0xffff,}, { _X: (data[5]>> 0)&0xffff, _Y: (data[5]>>16)&0xffff,}, { _X: (data[7]>> 0)&0xffff, _Y: (data[7]>>16)&0xffff,}, ]}; const cr = []; const vx = []; for (let i=0; i<3; i++) { if (k.cr._A&1) { cr.push(255>>>1, 255>>>1, 255>>>1, 255); } else { cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, 255); } vx.push(k.vx[i]._X, k.vx[i]._Y); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 3);
          }
          return;

        case 0x28:
        case 0x29:
        case 0x2a:
        case 0x2b: // POLY F4
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,} ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[2]>> 0)&0xffff, _Y: (data[2]>>16)&0xffff,}, { _X: (data[3]>> 0)&0xffff, _Y: (data[3]>>16)&0xffff,}, { _X: (data[4]>> 0)&0xffff, _Y: (data[4]>>16)&0xffff,}, ]}; const cr = []; const vx = []; const b = [ k.cr[0]._A&2 ? pseudo.CstrGraphics._inn.blend : 0, k.cr[0]._A&2 ? bit[pseudo.CstrGraphics._inn.blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (let i=0; i<4; i++) { cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]); vx.push(k.vx[i]._X, k.vx[i]._Y); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays( ctx.TRIANGLE_STRIP, 0, 4);
          }
          return;

        case 0x2c:
        case 0x2d:
        case 0x2e:
        case 0x2f: // POLY FT4
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,} ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[3]>> 0)&0xffff, _Y: (data[3]>>16)&0xffff,}, { _X: (data[5]>> 0)&0xffff, _Y: (data[5]>>16)&0xffff,}, { _X: (data[7]>> 0)&0xffff, _Y: (data[7]>>16)&0xffff,}, ]}; const cr = []; const vx = []; for (let i=0; i<4; i++) { if (k.cr._A&1) { cr.push(255>>>1, 255>>>1, 255>>>1, 255); } else { cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, 255); } vx.push(k.vx[i]._X, k.vx[i]._Y); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
          }
          return;

        case 0x30:
        case 0x31:
        case 0x32:
        case 0x33: // POLY G3
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,}, { _R: (data[2]>>> 0)&0xff, _G: (data[2]>>> 8)&0xff, _B: (data[2]>>>16)&0xff, _A: (data[2]>>>24)&0xff,}, { _R: (data[4]>>> 0)&0xff, _G: (data[4]>>> 8)&0xff, _B: (data[4]>>>16)&0xff, _A: (data[4]>>>24)&0xff,}, { _R: (data[6]>>> 0)&0xff, _G: (data[6]>>> 8)&0xff, _B: (data[6]>>>16)&0xff, _A: (data[6]>>>24)&0xff,}, ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[3]>> 0)&0xffff, _Y: (data[3]>>16)&0xffff,}, { _X: (data[5]>> 0)&0xffff, _Y: (data[5]>>16)&0xffff,}, { _X: (data[7]>> 0)&0xffff, _Y: (data[7]>>16)&0xffff,}, ]}; const cr = []; const vx = []; const b = [ k.cr[0]._A&2 ? pseudo.CstrGraphics._inn.blend : 0, k.cr[0]._A&2 ? bit[pseudo.CstrGraphics._inn.blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (let i=0; i<3; i++) { cr.push(k.cr[i]._R, k.cr[i]._G, k.cr[i]._B, b[1]); vx.push(k.vx[i]._X, k.vx[i]._Y); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays( ctx.TRIANGLE_STRIP, 0, 3);
          }
          return;

        case 0x34:
        case 0x35:
        case 0x36:
        case 0x37: // POLY GT3
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,}, { _R: (data[3]>>> 0)&0xff, _G: (data[3]>>> 8)&0xff, _B: (data[3]>>>16)&0xff, _A: (data[3]>>>24)&0xff,}, { _R: (data[6]>>> 0)&0xff, _G: (data[6]>>> 8)&0xff, _B: (data[6]>>>16)&0xff, _A: (data[6]>>>24)&0xff,}, { _R: (data[9]>>> 0)&0xff, _G: (data[9]>>> 8)&0xff, _B: (data[9]>>>16)&0xff, _A: (data[9]>>>24)&0xff,}, ], vx: [ { _X: (data[ 1]>> 0)&0xffff, _Y: (data[ 1]>>16)&0xffff,}, { _X: (data[ 4]>> 0)&0xffff, _Y: (data[ 4]>>16)&0xffff,}, { _X: (data[ 7]>> 0)&0xffff, _Y: (data[ 7]>>16)&0xffff,}, { _X: (data[10]>> 0)&0xffff, _Y: (data[10]>>16)&0xffff,}, ]}; const cr = []; const vx = []; for (let i=0; i<3; i++) { cr.push(k.cr[i]._R, k.cr[i]._G, k.cr[i]._B, 255); vx.push(k.vx[i]._X, k.vx[i]._Y); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 3);
          }
          return;

        case 0x38:
        case 0x39:
        case 0x3a:
        case 0x3b: // POLY G4
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,}, { _R: (data[2]>>> 0)&0xff, _G: (data[2]>>> 8)&0xff, _B: (data[2]>>>16)&0xff, _A: (data[2]>>>24)&0xff,}, { _R: (data[4]>>> 0)&0xff, _G: (data[4]>>> 8)&0xff, _B: (data[4]>>>16)&0xff, _A: (data[4]>>>24)&0xff,}, { _R: (data[6]>>> 0)&0xff, _G: (data[6]>>> 8)&0xff, _B: (data[6]>>>16)&0xff, _A: (data[6]>>>24)&0xff,}, ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[3]>> 0)&0xffff, _Y: (data[3]>>16)&0xffff,}, { _X: (data[5]>> 0)&0xffff, _Y: (data[5]>>16)&0xffff,}, { _X: (data[7]>> 0)&0xffff, _Y: (data[7]>>16)&0xffff,}, ]}; const cr = []; const vx = []; const b = [ k.cr[0]._A&2 ? pseudo.CstrGraphics._inn.blend : 0, k.cr[0]._A&2 ? bit[pseudo.CstrGraphics._inn.blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (let i=0; i<4; i++) { cr.push(k.cr[i]._R, k.cr[i]._G, k.cr[i]._B, b[1]); vx.push(k.vx[i]._X, k.vx[i]._Y); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays( ctx.TRIANGLE_STRIP, 0, 4);
          }
          return;

        case 0x3c:
        case 0x3d:
        case 0x3e:
        case 0x3f: // POLY GT4
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,}, { _R: (data[3]>>> 0)&0xff, _G: (data[3]>>> 8)&0xff, _B: (data[3]>>>16)&0xff, _A: (data[3]>>>24)&0xff,}, { _R: (data[6]>>> 0)&0xff, _G: (data[6]>>> 8)&0xff, _B: (data[6]>>>16)&0xff, _A: (data[6]>>>24)&0xff,}, { _R: (data[9]>>> 0)&0xff, _G: (data[9]>>> 8)&0xff, _B: (data[9]>>>16)&0xff, _A: (data[9]>>>24)&0xff,}, ], vx: [ { _X: (data[ 1]>> 0)&0xffff, _Y: (data[ 1]>>16)&0xffff,}, { _X: (data[ 4]>> 0)&0xffff, _Y: (data[ 4]>>16)&0xffff,}, { _X: (data[ 7]>> 0)&0xffff, _Y: (data[ 7]>>16)&0xffff,}, { _X: (data[10]>> 0)&0xffff, _Y: (data[10]>>16)&0xffff,}, ]}; const cr = []; const vx = []; for (let i=0; i<4; i++) { cr.push(k.cr[i]._R, k.cr[i]._G, k.cr[i]._B, 255); vx.push(k.vx[i]._X, k.vx[i]._Y); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
          }
          return;

        case 0x40:
        case 0x41:
        case 0x42:
        case 0x43: // LINE F2
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,} ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[2]>> 0)&0xffff, _Y: (data[2]>>16)&0xffff,}, { _X: (data[3]>> 0)&0xffff, _Y: (data[3]>>16)&0xffff,}, { _X: (data[4]>> 0)&0xffff, _Y: (data[4]>>16)&0xffff,}, ]}; const cr = []; const vx = []; const b = [ k.cr[0]._A&2 ? pseudo.CstrGraphics._inn.blend : 0, k.cr[0]._A&2 ? bit[pseudo.CstrGraphics._inn.blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (let i=0; i<2; i++) { cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]); vx.push(k.vx[i]._X, k.vx[i]._Y); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays( ctx.LINE_STRIP, 0, 2);
          }
          return;

        case 0x48:
        case 0x49:
        case 0x4a:
        case 0x4b: // LINE F3
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,} ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[2]>> 0)&0xffff, _Y: (data[2]>>16)&0xffff,}, { _X: (data[3]>> 0)&0xffff, _Y: (data[3]>>16)&0xffff,}, { _X: (data[4]>> 0)&0xffff, _Y: (data[4]>>16)&0xffff,}, ]}; const cr = []; const vx = []; const b = [ k.cr[0]._A&2 ? pseudo.CstrGraphics._inn.blend : 0, k.cr[0]._A&2 ? bit[pseudo.CstrGraphics._inn.blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (let i=0; i<3; i++) { cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]); vx.push(k.vx[i]._X, k.vx[i]._Y); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays( ctx.LINE_STRIP, 0, 3);
          }
          return;

        case 0x4c:
        case 0x4d:
        case 0x4e:
        case 0x4f: // LINE F4
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,} ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[2]>> 0)&0xffff, _Y: (data[2]>>16)&0xffff,}, { _X: (data[3]>> 0)&0xffff, _Y: (data[3]>>16)&0xffff,}, { _X: (data[4]>> 0)&0xffff, _Y: (data[4]>>16)&0xffff,}, ]}; const cr = []; const vx = []; const b = [ k.cr[0]._A&2 ? pseudo.CstrGraphics._inn.blend : 0, k.cr[0]._A&2 ? bit[pseudo.CstrGraphics._inn.blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (let i=0; i<4; i++) { cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]); vx.push(k.vx[i]._X, k.vx[i]._Y); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays( ctx.LINE_STRIP, 0, 4);
          }
          return;

        case 0x50:
        case 0x51:
        case 0x52:
        case 0x53: // LINE cop2d.ub[(22<<2)+1]
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,}, { _R: (data[2]>>> 0)&0xff, _G: (data[2]>>> 8)&0xff, _B: (data[2]>>>16)&0xff, _A: (data[2]>>>24)&0xff,}, { _R: (data[4]>>> 0)&0xff, _G: (data[4]>>> 8)&0xff, _B: (data[4]>>>16)&0xff, _A: (data[4]>>>24)&0xff,}, { _R: (data[6]>>> 0)&0xff, _G: (data[6]>>> 8)&0xff, _B: (data[6]>>>16)&0xff, _A: (data[6]>>>24)&0xff,}, ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[3]>> 0)&0xffff, _Y: (data[3]>>16)&0xffff,}, { _X: (data[5]>> 0)&0xffff, _Y: (data[5]>>16)&0xffff,}, { _X: (data[7]>> 0)&0xffff, _Y: (data[7]>>16)&0xffff,}, ]}; const cr = []; const vx = []; const b = [ k.cr[0]._A&2 ? pseudo.CstrGraphics._inn.blend : 0, k.cr[0]._A&2 ? bit[pseudo.CstrGraphics._inn.blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (let i=0; i<2; i++) { cr.push(k.cr[i]._R, k.cr[i]._G, k.cr[i]._B, b[1]); vx.push(k.vx[i]._X, k.vx[i]._Y); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays( ctx.LINE_STRIP, 0, 2);
          }
          return;

        case 0x58:
        case 0x59:
        case 0x5a:
        case 0x5b: // LINE G3
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,}, { _R: (data[2]>>> 0)&0xff, _G: (data[2]>>> 8)&0xff, _B: (data[2]>>>16)&0xff, _A: (data[2]>>>24)&0xff,}, { _R: (data[4]>>> 0)&0xff, _G: (data[4]>>> 8)&0xff, _B: (data[4]>>>16)&0xff, _A: (data[4]>>>24)&0xff,}, { _R: (data[6]>>> 0)&0xff, _G: (data[6]>>> 8)&0xff, _B: (data[6]>>>16)&0xff, _A: (data[6]>>>24)&0xff,}, ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[3]>> 0)&0xffff, _Y: (data[3]>>16)&0xffff,}, { _X: (data[5]>> 0)&0xffff, _Y: (data[5]>>16)&0xffff,}, { _X: (data[7]>> 0)&0xffff, _Y: (data[7]>>16)&0xffff,}, ]}; const cr = []; const vx = []; const b = [ k.cr[0]._A&2 ? pseudo.CstrGraphics._inn.blend : 0, k.cr[0]._A&2 ? bit[pseudo.CstrGraphics._inn.blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (let i=0; i<3; i++) { cr.push(k.cr[i]._R, k.cr[i]._G, k.cr[i]._B, b[1]); vx.push(k.vx[i]._X, k.vx[i]._Y); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays( ctx.LINE_STRIP, 0, 3);
          }
          return;

        case 0x5c:
        case 0x5d:
        case 0x5e:
        case 0x5f: // LINE G4
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,}, { _R: (data[2]>>> 0)&0xff, _G: (data[2]>>> 8)&0xff, _B: (data[2]>>>16)&0xff, _A: (data[2]>>>24)&0xff,}, { _R: (data[4]>>> 0)&0xff, _G: (data[4]>>> 8)&0xff, _B: (data[4]>>>16)&0xff, _A: (data[4]>>>24)&0xff,}, { _R: (data[6]>>> 0)&0xff, _G: (data[6]>>> 8)&0xff, _B: (data[6]>>>16)&0xff, _A: (data[6]>>>24)&0xff,}, ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[3]>> 0)&0xffff, _Y: (data[3]>>16)&0xffff,}, { _X: (data[5]>> 0)&0xffff, _Y: (data[5]>>16)&0xffff,}, { _X: (data[7]>> 0)&0xffff, _Y: (data[7]>>16)&0xffff,}, ]}; const cr = []; const vx = []; const b = [ k.cr[0]._A&2 ? pseudo.CstrGraphics._inn.blend : 0, k.cr[0]._A&2 ? bit[pseudo.CstrGraphics._inn.blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (let i=0; i<4; i++) { cr.push(k.cr[i]._R, k.cr[i]._G, k.cr[i]._B, b[1]); vx.push(k.vx[i]._X, k.vx[i]._Y); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays( ctx.LINE_STRIP, 0, 4);
          }
          return;

        case 0x60:
        case 0x61:
        case 0x62:
        case 0x63: // TILE S
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,} ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[2]>> 0)&0xffff, _Y: (data[2]>>16)&0xffff,}, ]}; const cr = []; const b = [ k.cr[0]._A&2 ? pseudo.CstrGraphics._inn.blend : 0, k.cr[0]._A&2 ? bit[pseudo.CstrGraphics._inn.blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); if (0) { k.vx[1]._X = 0; k.vx[1]._Y = 0; } for (let i=0; i<4; i++) { cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]); } const vx = [ k.vx[0]._X, k.vx[0]._Y, k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y, k.vx[0]._X, k.vx[0]._Y+k.vx[1]._Y, k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y+k.vx[1]._Y, ]; ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
          }
          return;

        case 0x64:
        case 0x65:
        case 0x66:
        case 0x67: // SPRITE S
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,} ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[3]>> 0)&0xffff, _Y: (data[3]>>16)&0xffff,}, ]}; const cr = []; const b = [ k.cr[0]._A&2 ? pseudo.CstrGraphics._inn.blend : 0, k.cr[0]._A&2 ? bit[pseudo.CstrGraphics._inn.blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); if (0) { k.vx[1]._X = 0; k.vx[1]._Y = 0; } for (let i=0; i<4; i++) { if (k.cr[0]._A&1) { cr.push(255>>>1, 255>>>1, 255>>>1, b[1]); } else { cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]); } } const vx = [ k.vx[0]._X, k.vx[0]._Y, k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y, k.vx[0]._X, k.vx[0]._Y+k.vx[1]._Y, k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y+k.vx[1]._Y, ]; ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
          }
          return;

        case 0x68:
        case 0x69:
        case 0x6a:
        case 0x6b: // TILE 1
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,} ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[2]>> 0)&0xffff, _Y: (data[2]>>16)&0xffff,}, ]}; const cr = []; const b = [ k.cr[0]._A&2 ? pseudo.CstrGraphics._inn.blend : 0, k.cr[0]._A&2 ? bit[pseudo.CstrGraphics._inn.blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); if (1) { k.vx[1]._X = 1; k.vx[1]._Y = 1; } for (let i=0; i<4; i++) { cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]); } const vx = [ k.vx[0]._X, k.vx[0]._Y, k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y, k.vx[0]._X, k.vx[0]._Y+k.vx[1]._Y, k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y+k.vx[1]._Y, ]; ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
          }
          return;

        case 0x70:
        case 0x71:
        case 0x72:
        case 0x73: // TILE 8
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,} ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[2]>> 0)&0xffff, _Y: (data[2]>>16)&0xffff,}, ]}; const cr = []; const b = [ k.cr[0]._A&2 ? pseudo.CstrGraphics._inn.blend : 0, k.cr[0]._A&2 ? bit[pseudo.CstrGraphics._inn.blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); if (8) { k.vx[1]._X = 8; k.vx[1]._Y = 8; } for (let i=0; i<4; i++) { cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]); } const vx = [ k.vx[0]._X, k.vx[0]._Y, k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y, k.vx[0]._X, k.vx[0]._Y+k.vx[1]._Y, k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y+k.vx[1]._Y, ]; ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
          }
          return;

        case 0x74:
        case 0x75:
        case 0x76:
        case 0x77: // SPRITE 8
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,} ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[3]>> 0)&0xffff, _Y: (data[3]>>16)&0xffff,}, ]}; const cr = []; const b = [ k.cr[0]._A&2 ? pseudo.CstrGraphics._inn.blend : 0, k.cr[0]._A&2 ? bit[pseudo.CstrGraphics._inn.blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); if (8) { k.vx[1]._X = 8; k.vx[1]._Y = 8; } for (let i=0; i<4; i++) { if (k.cr[0]._A&1) { cr.push(255>>>1, 255>>>1, 255>>>1, b[1]); } else { cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]); } } const vx = [ k.vx[0]._X, k.vx[0]._Y, k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y, k.vx[0]._X, k.vx[0]._Y+k.vx[1]._Y, k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y+k.vx[1]._Y, ]; ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
          }
          return;

        case 0x78:
        case 0x79:
        case 0x7a:
        case 0x7b: // TILE 16
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,} ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[2]>> 0)&0xffff, _Y: (data[2]>>16)&0xffff,}, ]}; const cr = []; const b = [ k.cr[0]._A&2 ? pseudo.CstrGraphics._inn.blend : 0, k.cr[0]._A&2 ? bit[pseudo.CstrGraphics._inn.blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); if (16) { k.vx[1]._X = 16; k.vx[1]._Y = 16; } for (let i=0; i<4; i++) { cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]); } const vx = [ k.vx[0]._X, k.vx[0]._Y, k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y, k.vx[0]._X, k.vx[0]._Y+k.vx[1]._Y, k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y+k.vx[1]._Y, ]; ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
          }
          return;

        case 0x7c:
        case 0x7d:
        case 0x7e:
        case 0x7f: // SPRITE 16
          {
            const k = { cr: [ { _R: (data[0]>>> 0)&0xff, _G: (data[0]>>> 8)&0xff, _B: (data[0]>>>16)&0xff, _A: (data[0]>>>24)&0xff,} ], vx: [ { _X: (data[1]>> 0)&0xffff, _Y: (data[1]>>16)&0xffff,}, { _X: (data[3]>> 0)&0xffff, _Y: (data[3]>>16)&0xffff,}, ]}; const cr = []; const b = [ k.cr[0]._A&2 ? pseudo.CstrGraphics._inn.blend : 0, k.cr[0]._A&2 ? bit[pseudo.CstrGraphics._inn.blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); if (16) { k.vx[1]._X = 16; k.vx[1]._Y = 16; } for (let i=0; i<4; i++) { if (k.cr[0]._A&1) { cr.push(255>>>1, 255>>>1, 255>>>1, b[1]); } else { cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]); } } const vx = [ k.vx[0]._X, k.vx[0]._Y, k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y, k.vx[0]._X, k.vx[0]._Y+k.vx[1]._Y, k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y+k.vx[1]._Y, ]; ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
          }
          return;

        case 0x80: // MOVE IMAGE
          return;

        case 0xa0: // LOAD IMAGE
          return;

        case 0xc0: // STORE IMAGE
          return;

        case 0xe1: // TEXTURE PAGE
          pseudo.CstrGraphics._inn.blend  = (data[0]>>>5)&3;
          ctx.blendFunc(bit[pseudo.CstrGraphics._inn.blend].src, bit[pseudo.CstrGraphics._inn.blend].target);
          return;

        case 0xe2: // TEXTURE WINDOW
          return;

        case 0xe3: // DRAW AREA START
          return;

        case 0xe4: // DRAW AREA END
          return;

        case 0xe5: // DRAW OFFSET
          return;

        case 0xe6: // STP
          pseudo.CstrGraphics._inn.status = (pseudo.CstrGraphics._inn.status&(~(3<<11))) | ((data[0]&3)<<11);
          return;
      }
      pseudo.CstrMips.consoleWrite('error', 'GPU Render Primitive '+('0x'+(addr>>>0).toString(16)));
    }
  };
})();


// Based on PCSX 1.5











pseudo.CstrSerial = (function() {
  let baud, control, mode, status, bfr, bfrCount, padst, parp;

  return {
    awake() {
      bfr = new Uint8Array(256);
    },

    reset() {
      bfr.fill(0);
      baud     = 0;
      control  = 0;
      mode     = 0;
      status   = 0x001 | 0x004;
      bfrCount = 0;
      padst    = 0;
      parp     = 0;
    },

    write: {
      h(addr, data) {
        switch(addr) {
          case 0x1048: // Mode
            mode = data;
            return;

          case 0x104a: // Control
            control = data;

            if (control&0x010) {
              status  &= (~0x200);
              control &= (~0x010);
            }

            if (control&0x040 || !control) {
              status = 0x001 | 0x004;
              padst  = 0;
              parp   = 0;
            }
            return;

          case 0x104e: // Baud
            baud = data;
            return;
        }
        pseudo.CstrMain.error('SIO write h '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      b(addr, data) {
        switch(addr) {
          case 0x1040:
            switch(padst) {
              case 1:
                if (data&0x40) {
                  padst = 2;
                  parp  = 1;

                  switch(data) {
                    case 0x42:
                      bfr[1] = 0x41; //parp
                      break;

                    default:
                      console.dir('SIO write b data '+('0x'+(data>>>0).toString(16)));
                      break;
                  }
                }
                pseudo.CstrBus.interruptSet(7);
                return;

              case 2:
                parp++;
                
                if (parp !== bfrCount) {
                  pseudo.CstrBus.interruptSet(7);
                }
                else {
                  padst = 0;
                }
                return;
            }

            if (data === 1) {
              status &= !0x004;
              status |=  0x002;
              padst = 1;
              parp  = 0;

              if (control&0x002) {
                switch(control) {
                  case 0x1003:
                  case 0x3003:
                    bfrCount = 4;
                    bfr[0] = 0x00;
                    bfr[1] = 0x41;
                    bfr[2] = 0x5a;
                    bfr[3] = 0xff;
                    bfr[4] = 0xff;
                    pseudo.CstrBus.interruptSet(7);
                    return;
                }
              }
            }
            return;
        }
        pseudo.CstrMain.error('SIO write b '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      }
    },

    read: {
      h(addr) {
        switch(addr) {
          case 0x1044:
            return status;

          case 0x104a:
            return control;
        }
        pseudo.CstrMain.error('SIO read h '+('0x'+(addr>>>0).toString(16)));
      },

      b(addr) {
        switch(addr) {
          case 0x1040:
            {
              if (!(status&0x002)) {
                return 0;
              }

              if (parp === bfrCount) {
                status &= ~0x002;
                status |=  0x004;
              }
              return bfr[parp];
            }
        }
        pseudo.CstrMain.error('SIO read b '+('0x'+(addr>>>0).toString(16)));
      }
    }
  };
})();
















pseudo.CstrGraphics = (function() {
  let pipe;
  let modeDMA;

  const sizePrim = [
    0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x00
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x10
    4, 4, 4, 4, 7, 7, 7, 7, 5, 5, 5, 5, 9, 9, 9, 9, // 0x20
    6, 6, 6, 6, 9, 9, 9, 9, 8, 8, 8, 8,12,12,12,12, // 0x30
    3, 3, 3, 3, 0, 0, 0, 0, 5, 5, 5, 5, 6, 6, 6, 6, // 0x40
    4, 4, 4, 4, 0, 0, 0, 0, 7, 7, 7, 7, 9, 9, 9, 9, // 0x50
    3, 3, 3, 3, 4, 4, 4, 4, 2, 2, 2, 2, 0, 0, 0, 0, // 0x60
    2, 2, 2, 2, 3, 3, 3, 3, 2, 2, 2, 2, 3, 3, 3, 3, // 0x70
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x80
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x90
    3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xa0
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xb0
    3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xc0
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xd0
    0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xe0
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xf0
  ];

  const resMode = [
    256, 320, 512, 640, 368, 384, 512, 640
  ];

  const write = {
    data(addr) {
      if (!pipe.size) {
        const prim = (addr>>>24)&0xff;
        const size = sizePrim[prim];

        if (size) {
          pipe.data[0] = addr;
          pipe.prim = prim;
          pipe.size = size;
          pipe.row  = 1;
        }
        else {
          return;
        }
      }
      else {
        pipe.data[pipe.row] = addr;
        pipe.row++;
      }

      // Render primitive
      if (pipe.size === pipe.row) {
        pipe.size = 0;
        pipe.row  = 0;
        pseudo.CstrRender.prim(pipe.prim, pipe.data);
      }
    },

    dataMem(addr, size) {
      while (size--) {
        pseudo.CstrGraphics._inn.data = pseudo.CstrMem._ram.uw[(( addr)&(pseudo.CstrMem._ram.uw.byteLength-1))>>>2];
        addr += 4;
        write.data(pseudo.CstrGraphics._inn.data);
      }
    }
  }

  function pipeReset() {
    pipe.data.fill(0);
    pipe.prim = 0;
    pipe.size = 0;
    pipe.row  = 0;
  }

  // Exposed class functions/variables
  return {
    _inn: undefined,

    awake() {
      // Command Pipe
      pipe = {
        data: new Uint32Array(100)
      };
    },

    reset() {
      pseudo.CstrGraphics._inn = {
        blend  : 0,
        data   : 0x400,
        status : 0x14802000
      };
      modeDMA = 0;

      // Command Pipe
      pipeReset();
    },

    redraw() {
      pseudo.CstrGraphics._inn.status ^= 0x80000000;
    },

    scopeW(addr, data) {
      switch(addr&0xf) {
        case 0:
          write.data(data);
          return;

        case 4:
          switch((data>>>24)&0xff) {
            case 0x00:
              pseudo.CstrGraphics._inn.status = 0x14802000;
              return;

            case 0x01:
              pipeReset();
              return;

            case 0x04:
              modeDMA = data&3;
              return;

            case 0x08:
              pseudo.CstrRender.resize({
                w: resMode[(data&3) | ((data&0x40)>>>4)],
                h: (data&4) ? 480 : 240
              });
              return;

            
            case 0x02:
            case 0x03:
            case 0x05:
            case 0x06:
            case 0x07:
            case 0x10:
              return;
          }
          pseudo.CstrMain.error('GPU Write Status '+('0x'+((data>>>24)&0xff>>>0).toString(16)));
          return;
      }
    },

    scopeR(addr) {
      switch(addr&0xf) {
        case 0:
          return pseudo.CstrGraphics._inn.data;

        case 4:
          return pseudo.CstrGraphics._inn.status;
      }
    },

    executeDMA(addr) {
      const size = (pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|4)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2]>>16)*(pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|4)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2]&0xffff);

      switch(pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|8)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2]) {
        case 0x00000401: // Disable DMA?
          return;

        case 0x01000201:
          write.dataMem(pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2], size);
          return;

        case 0x01000401:
          do {
            const count = pseudo.CstrMem._ram.uw[(( pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2])&(pseudo.CstrMem._ram.uw.byteLength-1))>>>2];
            write.dataMem((pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2]+4)&0x1ffffc, count>>>24);
            pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2] = count&0xffffff;
          }
          while (pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2] !== 0xffffff);
          return;
      }
      pseudo.CstrMain.error('GPU DMA '+('0x'+(pseudo.CstrMem._hwr.uw[(((addr&0xfff0)|8)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2]>>>0).toString(16)));
    }
  };
})();


