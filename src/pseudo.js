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
      r3ka.awake();

      file('bios/scph1001.bin', function(resp) {
        // Move BIOS to Mem
        const bios = new UintBcap(resp);
        mem._rom.ub.set(bios);

        psx.reset();
      });
    },

    reset() {
      // Reset all emulator components
      mem .reset();
      r3ka.reset();

      // Run emulator to Bootstrap
      r3ka.bootstrap();
    },

    error(out) {
      throw new Error(out);
    }
  };
})();
