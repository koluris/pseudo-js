



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





























































pseudo.CstrHardware = (function() {
  return {
    write: {
      w(addr, data) {
        addr&=0xffff;

        if (addr >= 0x0000 && addr <= 0x03ff) { // Scratchpad
          return pseudo.CstrMem._hwr.uw[(( addr)&(pseudo.CstrMem._hwr.uw.byteLength-1))>>>2];
        }
        pseudo.CstrMain.error('pseudo / Hardware write w '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
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
        switch(addr>>>28) {
          case 0x0:
            pseudo.CstrMem._ram.uw[(( addr)&(pseudo.CstrMem._ram.uw.byteLength-1))>>>2] = data;
            return;

          case 0x1:
            pseudo.CstrHardware.write.w(addr, data);
            return
        }
        pseudo.CstrMain.error('pseudo / Mem write w '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      h(addr, data) {
        switch(addr>>>28) {
          case 0x0:
            pseudo.CstrMem._ram.uh[(( addr)&(pseudo.CstrMem._ram.uh.byteLength-1))>>>1] = data;
            return;
        }
        pseudo.CstrMain.error('pseudo / Mem write h '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      b(addr, data) {
        switch(addr>>>28) {
          case 0x0:
            pseudo.CstrMem._ram.ub[(( addr)&(pseudo.CstrMem._ram.ub.byteLength-1))>>>0] = data;
            return;
        }
        pseudo.CstrMain.error('pseudo / Mem write b '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      }
    },

    read: {
      w(addr) {
        switch(addr>>>28) {
          case 0x0:
            return pseudo.CstrMem._ram.uw[(( addr)&(pseudo.CstrMem._ram.uw.byteLength-1))>>>2];
        }
        pseudo.CstrMain.error('pseudo / Mem read w '+('0x'+(addr>>>0).toString(16)));
        return 0;
      },

      h(addr) {
        pseudo.CstrMain.error('pseudo / Mem read h '+('0x'+(addr>>>0).toString(16)));
        return 0;
      },

      b(addr) {
        pseudo.CstrMain.error('pseudo / Mem read b '+('0x'+(addr>>>0).toString(16)));
        return 0;
      }
    }
  };
})();








pseudo.CstrR3ka = (function() {
  let r, copr; // Base + Coprocessor
  let divMath; // Cache for expensive calculation
  let opcodeCount;

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
            r[((code>>>11)&0x1f)] = r[((code>>>15)&0x1f)] << ((code>>>6)&0x1f);
            return;

          case 33: // ADDU
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] + r[((code>>>15)&0x1f)];
            return;

          case 37: // OR
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] | r[((code>>>15)&0x1f)];
            return;

          case 43: // SLTU
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] < r[((code>>>15)&0x1f)];
            return;
        }
        pseudo.CstrMain.error('pseudo / Special CPU instruction -> '+(code&0x3f));
        return;

      case 2: // J
        branch(((r[32]&0xf0000000)|(code&0x3ffffff)<<2));
        return;

      case 3: // JAL
        r[31] = r[32]+4;
        branch(((r[32]&0xf0000000)|(code&0x3ffffff)<<2));
        return;

      case 5: // BNE
        if (r[((code>>>21)&0x1f)] !== r[((code>>>15)&0x1f)]) {
          branch((r[32]+((((code)<<16>>16))<<2)));
        }
        return;

      case 8: // ADDI
        r[((code>>>15)&0x1f)] = r[((code>>>21)&0x1f)] + (((code)<<16>>16));
        return;

      case 9: // ADDIU
        r[((code>>>15)&0x1f)] = r[((code>>>21)&0x1f)] + (((code)<<16>>16));
        return;

      case 12: // ANDI
        r[((code>>>15)&0x1f)] = r[((code>>>21)&0x1f)] & (code&0xffff);
        return;

      case 13: // ORI
        r[((code>>>15)&0x1f)] = r[((code>>>21)&0x1f)] | (code&0xffff);
        return;

      case 16: // COP0
        switch (((code>>>21)&0x1f)) {
          case 4: // MTC0
            copr[((code>>>11)&0x1f)] = r[((code>>>15)&0x1f)];
            return;
        }
        pseudo.CstrMain.error('pseudo / Coprocessor 0 CPU instruction -> '+((code>>>21)&0x1f));
        return

      case 15: // LUI
        r[((code>>>15)&0x1f)] = code<<16;
        return;

      case 35: // LW
        r[((code>>>15)&0x1f)] = pseudo.CstrMem.read.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16))));
        return;

      case 40: // SB
        pseudo.CstrMem.write.b((r[((code>>>21)&0x1f)]+(((code)<<16>>16))), r[((code>>>15)&0x1f)]);
        return;

      case 41: // SH
        pseudo.CstrMem.write.h((r[((code>>>21)&0x1f)]+(((code)<<16>>16))), r[((code>>>15)&0x1f)]);
        return;

      case 43: // SW
        pseudo.CstrMem.write.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16))), r[((code>>>15)&0x1f)]);
        return;
    }
    pseudo.CstrMain.error('pseudo / Basic CPU instruction -> '+((code>>>26)&0x3f));
  }

  function branch(addr) {
    // Execute instruction in slot
    step(true);
    r[32] = addr;

    // Rootcounters, interrupts
  }

  function exception(code, inslot) {
    r[32] = 0x80;
  }

  // Exposed class functions/variables
  return {
    awake() {
         r = new Uint32Array(32 + 3); // + r[32], r[33], r[34]
      copr = new Uint32Array(16);

      // Cache
      divMath = Math.pow(32, 2); // Btw, pure multiplication is faster
    },

    reset() {
         r.fill(0);
      copr.fill(0);

      r[32] = 0xbfc00000;
      opcodeCount = 0;
    },

    bootstrap() {
      while (r[32] !== 0x80030000) {
        step(false);
      }
      pseudo.CstrMain.error('pseudo / Bootstrap completed');
    },

    run() {
      // requestAnimationFrame loop
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
      pseudo.CstrR3ka.awake();

      file('bios/scph1001.bin', function(resp) {
        // Move BIOS to Mem
        const bios = new Uint8Array(resp);
        pseudo.CstrMem._rom.ub.set(bios);

        pseudo.CstrMain.reset();
      });
    },

    reset() {
      // Reset all emulator components
      pseudo.CstrMem .reset();
      pseudo.CstrR3ka.reset();

      // Run emulator to Bootstrap
      pseudo.CstrR3ka.bootstrap();
    },

    error(out) {
      throw new Error(out);
    }
  };
})();

