



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
const pseudo = window.pseudo || {};





























































pseudo.CstrCounters = (function() {
  var timer;

  // Exposed class functions/variables
  return {
    awake() {
      timer = [];
    },

    reset() {
      for (let i=0; i<3; i++) {
        timer[i] = {
          hi: 0
        };
      }
    },

    update() {
    }
  };
})();


pseudo.CstrHardware = (function() {
  // Exposed class functions/variables
  return {
    write: {
      w(addr, data) {
        addr&=0xffff;

        if (addr >= 0x0000 && addr <= 0x03ff) { // Scratchpad
          pseudo.CstrMem._hwr.uw[(( addr)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2] = data;
          return;
        }

        switch(addr) {
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
          case 0x1070: //
          case 0x1074: //
            pseudo.CstrMem._hwr.uw[(( addr)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2] = data;
            return;
        }
        pseudo.CstrMain.error('pseudo / Hardware write w '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      h(addr, data) {
        addr&=0xffff;

        if (addr >= 0x1100 && addr <= 0x1128) { // Rootcounters
          pseudo.CstrMem._hwr.uh[(( addr)&(pseudo.CstrMem._hwr.uh.byteLength-1))>>>1] = data;
          return;
        }
        
        if (addr >= 0x1d80 && addr <= 0x1d86) { // Audio
          pseudo.CstrMem._hwr.uh[(( addr)&(pseudo.CstrMem._hwr.uh.byteLength-1))>>>1] = data;
          return;
        }

        // switch(addr) {
        //   case 0:
        //     pseudo.CstrMem._hwr.uh[(( addr)&(pseudo.CstrMem._hwr.uh.byteLength-1))>>>1] = data;
        //     return;
        // }
        pseudo.CstrMain.error('pseudo / Hardware write h '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      b(addr, data) {
        addr&=0xffff;
        
        switch(addr) {
          case 0x2041: // DIP Switch?
            pseudo.CstrMem._hwr.ub[(( addr)&(pseudo.CstrMem._hwr.ub.byteLength-1))>>>0] = data;
            return;
        }
        pseudo.CstrMain.error('pseudo / Hardware write b '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      }
    },

    read: {
      w(addr) {
        addr&=0xffff;

        switch(addr) {
          case 0x1074:
            return pseudo.CstrMem._hwr.uw[(( addr)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2];
        }
        pseudo.CstrMain.error('pseudo / Hardware read w '+('0x'+(addr>>>0).toString(16)));
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
          case 0x00: // Base
          case 0x80: // Mirror
          case 0xa0: // Mirror
            if (pseudo.CstrR3ka.writeOK()) {
              pseudo.CstrMem._ram.uw[(( addr)&(pseudo.CstrMem._ram.uw.byteLength-1))>>>2] = data;
            }
            return;

          case 0x1f: // Hardware
            pseudo.CstrHardware.write.w(addr, data);
            return;
        }

        if (addr === 0xfffe0130) { // Mem Access
          return;
        }
        pseudo.CstrMain.error('pseudo / Mem write w '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      h(addr, data) {
        switch(addr>>>24) {
          case 0x00: // Base
            pseudo.CstrMem._ram.uh[(( addr)&(pseudo.CstrMem._ram.uh.byteLength-1))>>>1] = data;
            return;

          case 0x1f: // Hardware
            pseudo.CstrHardware.write.h(addr, data);
            return;
        }
        pseudo.CstrMain.error('pseudo / Mem write h '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      b(addr, data) {
        switch(addr>>>24) {
          case 0x00: // Base
          case 0x80: // Mirror
          case 0xa0: // Mirror
            pseudo.CstrMem._ram.ub[(( addr)&(pseudo.CstrMem._ram.ub.byteLength-1))>>>0] = data;
            return;

          case 0x1f: // Hardware
            pseudo.CstrHardware.write.b(addr, data);
            return;
        }
        pseudo.CstrMain.error('pseudo / Mem write b '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      }
    },

    read: {
      w(addr) {
        switch(addr>>>24) {
          case 0x00: // Base
          case 0x80: // Mirror
          case 0xa0: // Mirror
            return pseudo.CstrMem._ram.uw[(( addr)&(pseudo.CstrMem._ram.uw.byteLength-1))>>>2];

          case 0xbf: // BIOS
            return pseudo.CstrMem._rom.uw[(( addr)&(pseudo.CstrMem._rom.uw.byteLength-1))>>>2];

          case 0x1f: // Hardware
            return pseudo.CstrHardware.read.w(addr);
        }
        pseudo.CstrMain.error('pseudo / Mem read w '+('0x'+(addr>>>0).toString(16)));
        return 0;
      },

      h(addr) {
        pseudo.CstrMain.error('pseudo / Mem read h '+('0x'+(addr>>>0).toString(16)));
        return 0;
      },

      b(addr) {
        switch(addr>>>24) {
          case 0x00: // Base
          case 0x80: // Mirror
            return pseudo.CstrMem._ram.ub[(( addr)&(pseudo.CstrMem._ram.ub.byteLength-1))>>>0];

          case 0xbf: // BIOS
            return pseudo.CstrMem._rom.ub[(( addr)&(pseudo.CstrMem._rom.ub.byteLength-1))>>>0];
        }

        if (addr === 0x1f000084) { // PIO?
          return 0;
        }
        pseudo.CstrMain.error('pseudo / Mem read b '+('0x'+(addr>>>0).toString(16)));
        return 0;
      }
    }
  };
})();








pseudo.CstrR3ka = (function() {
  let r; // Base
  let copr; // Coprocessor
  let divMath; // Cache for expensive calculation
  let opcodeCount;
  let output;

  function div(a, b) {
    if (b) {
      r[33] = a / b;
      r[34] = a % b;
    }
  }

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

          case 8: // JR
            branch(r[((code>>>21)&0x1f)]);
            print();
            return;

          case 9: // JALR
            r[((code>>>11)&0x1f)] = r[32]+4;
            branch(r[((code>>>21)&0x1f)]);
            return;

          case 16: // MFHI
            r[((code>>>11)&0x1f)] = r[34];
            return;

          case 18: // MFLO
            r[((code>>>11)&0x1f)] = r[33];
            return;

          case 26: // DIV
            div(((r[((code>>>21)&0x1f)])<<0>>0), ((r[((code>>>16)&0x1f)])<<0>>0));
            return;

          case 27: // DIVU
            div(r[((code>>>21)&0x1f)], r[((code>>>16)&0x1f)]);
            return;

          case 32: // ADD
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] + r[((code>>>16)&0x1f)];
            return;

          case 33: // ADDU
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] + r[((code>>>16)&0x1f)];
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

          case 42: // SLT
            r[((code>>>11)&0x1f)] = ((r[((code>>>21)&0x1f)])<<0>>0) < ((r[((code>>>16)&0x1f)])<<0>>0);
            return;

          case 43: // SLTU
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] < r[((code>>>16)&0x1f)];
            return;
        }
        pseudo.CstrMain.error('pseudo / Special CPU instruction -> '+(code&0x3f));
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
        }
        pseudo.CstrMain.error('pseudo / Bcond CPU instruction -> '+((code>>>16)&0x1f));
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
        pseudo.CstrMain.error('pseudo / Coprocessor 0 CPU instruction -> '+((code>>>21)&0x1f));
        return;

      case 32: // LB
        r[((code>>>16)&0x1f)] = ((pseudo.CstrMem.read.b((r[((code>>>21)&0x1f)]+(((code)<<16>>16)))))<<24>>24);
        return;

      case 35: // LW
        r[((code>>>16)&0x1f)] = pseudo.CstrMem.read.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16))));
        return;

      case 36: // LBU
        r[((code>>>16)&0x1f)] = pseudo.CstrMem.read.b((r[((code>>>21)&0x1f)]+(((code)<<16>>16))));
        return;

      case 40: // SB
        pseudo.CstrMem.write.b((r[((code>>>21)&0x1f)]+(((code)<<16>>16))), r[((code>>>16)&0x1f)]);
        return;

      case 41: // SH
        pseudo.CstrMem.write.h((r[((code>>>21)&0x1f)]+(((code)<<16>>16))), r[((code>>>16)&0x1f)]);
        return;

      case 43: // SW
        pseudo.CstrMem.write.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16))), r[((code>>>16)&0x1f)]);
        return;
    }
    pseudo.CstrMain.error('pseudo / Basic CPU instruction -> '+((code>>>26)&0x3f));
  }

  function branch(addr) {
    // Execute instruction in slot
    step(true);
    r[32] = addr;

    // Rootcounters, interrupts
    pseudo.CstrCounters.update();
  }

  function exception(code, inslot) {
    r[32] = 0x80;
  }

  function print() {
    if (r[32] === 0xb0) {
      if (r[9] === 59 || r[9] === 61) {
        var char = String.fromCharCode(r[4]&0xff).replace(/\n/, '<br/>');
        output.append(char.toUpperCase());
      }
    }
  }

  // Exposed class functions/variables
  return {
    awake(element) {
         r = new Uint32Array(32 + 3); // + r[32], r[33], r[34]
      copr = new Uint32Array(16);

      // Cache
      divMath = Math.pow(32, 2); // Btw, pure multiplication is faster
      output  = element;
    },

    reset() {
         r.fill(0);
      copr.fill(0);

      copr[12] = 0x10900000;
      copr[15] = 0x2;

      r[32] = 0xbfc00000;
      opcodeCount = 0;

      // Bootstrap
      var start = performance.now();

      while (r[32] !== 0x80030000) {
        step(false);
      }
      console.dir('pseudo / Bootstrap completed in '+(performance.now()-start)+' ms');
    },

    run() {
      for (let i=0; i<100000; i++) {
        step(false);
      }
      requestAnimationFrame(pseudo.CstrR3ka.run);
    },

    writeOK() {
      return !(copr[12]&0x10000);
    }
  };
})();




pseudo.CstrMain = (function() {
  // Generic function for file read
  function file(path, fn) {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      fn(xhr.response);
    };
    xhr.responseType = 'arraybuffer';
    xhr.open('GET', path);
    xhr.send();
  }

  // Exposed class functions/variables
  return {
    awake() {
      $(function() {
        pseudo.CstrCounters.awake();
        pseudo.CstrR3ka   .awake($('#output'));

        file('bios/scph1001.bin', function(resp) {
          // Move BIOS to Mem
          const bios = new Uint8Array(resp);
          pseudo.CstrMem._rom.ub.set(bios);

          pseudo.CstrMain.reset();
        });
      });
    },

    reset() {
      // Reset all emulator components
      pseudo.CstrMem    .reset();
      pseudo.CstrCounters.reset();
      pseudo.CstrR3ka   .reset();

      // Run emulator
      pseudo.CstrR3ka.run();
    },

    error(out) {
      throw new Error(out);
    }
  };
})();

