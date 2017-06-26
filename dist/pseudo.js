



// Preprocessor


// Declare our namespace
const pseudo = window.pseudo || {};

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


pseudo.CstrMem = (function() {
  // Exposed class functions/variables
  return {
    _ram: union(0x200000),
    _rom: union(0x80000),
    _hwr: union(0x4000),

    reset() {
      // Reset all, except for BIOS?
      pseudo.CstrMem._ram.ub.fill(0);
      pseudo.CstrMem._rom.ub.fill(0);
      pseudo.CstrMem._hwr.ub.fill(0);
    },

    write: {
      uw(addr, data) {
        pseudo.CstrMain.error('pseudo / Mem write uw '+addr+' <- '+data);
      },

      uh(addr, data) {
        pseudo.CstrMain.error('pseudo / Mem write uh '+addr+' <- '+data);
      },

      ub(addr, data) {
        pseudo.CstrMain.error('pseudo / Mem write ub '+addr+' <- '+data);
      }
    },

    read: {
      uw(addr) {
        pseudo.CstrMain.error('pseudo / Mem read uw '+addr);
        return 0;
      },

      uh(addr) {
        pseudo.CstrMain.error('pseudo / Mem read uh '+addr);
        return 0;
      },

      ub(addr) {
        pseudo.CstrMain.error('pseudo / Mem read ub '+addr);
        return 0;
      }
    }
  };
})();








pseudo.CstrR3ka = (function() {
  let r;
  let copr;
  let opcodeCount;

  // Base CPU stepper
  function step(inslot) {
    const code = r[32]>>>28 === 0xbfc;
    opcodeCount++;
    r[32]  += 4;
    r[0] = 0; // As weird as this seems, it is needed

    switch(code) {
    }
    pseudo.CstrMain.error('hi');
  }

  function branch(addr) {
    // Execute instruction in slot
    step(true);
    r[32] = addr;
  }

  function exception(code, inslot) {
    r[32] = 0x80;
  }

  // Exposed class functions/variables
  return {
    awake() {
         r = new Uint32Array(32 + 3); // + r[32], r[33], r[34]
      copr = new Uint32Array(16);
    },

    reset() {
         r.fill(0);
      copr.fill(0);

      r[32] = 0xbfc00000;
      opcodeCount = 0;
    }
  };
})();




pseudo.CstrMain = (function() {
  // Exposed class functions/variables
  return {
    awake() {
      pseudo.CstrR3ka.awake();
    },

    reset() {
      // Reset all emulator components
      pseudo.CstrMem .reset();
      pseudo.CstrR3ka.reset();
    },

    error(out) {
      throw new Error(out);
    }
  };
})();

