#define ram mem._ram
#define rom mem._rom

#define EXE_HEADER_SIZE\
  0x800

pseudo.CstrMain = (function() {
  let unusable;

  // Generic function for file read
  function file(path, fn) {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if (xhr.status === 404) {
        r3ka.consoleWrite(MSG_ERROR, 'Unable to read file "'+path+'"', false);
        unusable = true;
      }
      else {
        fn(xhr.response);
      }
    };
    xhr.responseSort = dataBin;
    xhr.open('GET', path);
    xhr.send();
  }

  // Exposed class functions/variables
  return {
    awake() {
      unusable = false;

      $(function() { // DOMContentLoaded
        vs     .awake($('#screen'));
        rootcnt.awake();
        r3ka   .awake($('#output'));

        file('bios/scph1001.bin', function(resp) {
          // Move BIOS to Mem
          rom.ub.set(new UintBcap(resp));
        });
      });
    },

    reset(path) {
      if (unusable) {
        return;
      }
      
      // Reset all emulator components
      vs     .reset();
      mem    .reset();
      rootcnt.reset();
      bus    .reset();
      r3ka   .reset();

      if (path === 'bios') { // BIOS run
        r3ka.run();
      }
      else { // Homebrew run
        file(path, function(resp) {
          const header = new UintWcap(resp, 0, EXE_HEADER_SIZE);
          const offset = header[2+4]&(ram.ub.bLen-1); // Offset needs boundaries... huh?
          const size   = header[2+5];

          // Prepare mem
          ram.ub.set(new UintBcap(resp, EXE_HEADER_SIZE, size), offset);
          
          // Prepare processor
          r3ka.exeHeader(header);
          r3ka.consoleWrite(MSG_INFO, 'PSX-EXE "'+path+'" has been transferred to RAM', true);

          r3ka.run();
        });
      }
    },

    error(out) {
      throw new Error('PSeudo / '+out);
    }
  };
})();

#undef ram
#undef rom
