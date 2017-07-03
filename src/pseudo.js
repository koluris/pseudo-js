#define rom mem._rom

pseudo.CstrMain = (function() {
  // Generic function for file read
  function file(path, fn) {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      fn(xhr.response);
    };
    xhr.responseSort = dataBin;
    xhr.open('GET', path);
    xhr.send();
  }

  // Exposed class functions/variables
  return {
    awake() {
      $(function() { // DOMContentLoaded
        vs     .awake($('#screen'));
        rootcnt.awake();
        r3ka   .awake($('#output'));

        file('bios/scph1001.bin', function(resp) {
          // Move BIOS to Mem
          rom.ub.set(new UintBcap(resp));
          r3ka.consoleWrite('BIOS file has been written to ROM', false);

          psx.reset();
        });
      });
    },

    reset() {
      // Reset all emulator components
      vs     .reset();
      mem    .reset();
      rootcnt.reset();
      bus    .reset();
      r3ka   .reset();

      // Run emulator
      r3ka.run();
    },

    error(out) {
      throw new Error('PSeudo / '+out);
    }
  };
})();

#undef rom
