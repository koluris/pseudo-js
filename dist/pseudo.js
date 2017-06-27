



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
      pseudo.CstrMem._hwr.ub.fill(0);
    },

    write: {
      uw(addr, data) {
        pseudo.CstrMain.error('pseudo / Mem write uw '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      uh(addr, data) {
        pseudo.CstrMain.error('pseudo / Mem write uh '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      ub(addr, data) {
        pseudo.CstrMain.error('pseudo / Mem write ub '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      }
    },

    read: {
      uw(addr) {
        pseudo.CstrMain.error('pseudo / Mem read uw '+('0x'+(addr>>>0).toString(16)));
        return 0;
      },

      uh(addr) {
        pseudo.CstrMain.error('pseudo / Mem read uh '+('0x'+(addr>>>0).toString(16)));
        return 0;
      },

      ub(addr) {
        pseudo.CstrMain.error('pseudo / Mem read ub '+('0x'+(addr>>>0).toString(16)));
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
    const code = r[32]>>>20 === 0xbfc ? pseudo.CstrMem._rom.uw[(( r[32])&(pseudo.CstrMem._rom.uw.byteLength-1))>>>2] : pseudo.CstrMem._ram.uw[(( r[32])&(pseudo.CstrMem._ram.uw.byteLength-1))>>>2];
    opcodeCount++;
    r[32]  += 4;
    r[0] = 0; // As weird as this seems, it is needed

    switch(code) {
    }
    pseudo.CstrMain.error('pseudo / Unknown CPU instruction -> '+('0x'+(code>>>0).toString(16)));
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
      pseudo.CstrMain.error('psinex / Bootstrap completed');
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

