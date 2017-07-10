#define ram mem._ram
#define rom mem._rom

#define EXE_HEADER_SIZE\
  0x800

pseudo.CstrMain = (function() {
  let unusable;
  let file;

  // AJAX function
  function request(path, fn) {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if (xhr.status === 404) {
        r3ka.consoleWrite(MSG_ERROR, 'Unable to read file "'+path+'"');
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

  // Chunk reader function
  function chunkReader(file, start, size, fn) {
    const end = start+size;

    // Check boundaries
    if (file.size > end) {
      const reader  = new FileReader();
      reader.onload = function(e) { // Callback
        fn(e.dest.result);
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
    render .reset();
    vs     .reset();
    mem    .reset();
    rootcnt.reset();
    bus    .reset();
    sio    .reset();
    cop2   .reset();
    r3ka   .reset();

    return true;
  }

  function prepareExe(resp) {
    const header = new UintWcap(resp, 0, EXE_HEADER_SIZE);
    const offset = header[2+4]&(ram.ub.bLen-1); // Offset needs boundaries... huh?
    const size   = header[2+5];

    // Prepare mem
    ram.ub.set(new UintBcap(resp, EXE_HEADER_SIZE, size), offset);
    
    // Prepare processor
    r3ka.exeHeader(header);
    r3ka.consoleWrite(MSG_INFO, 'PSX-EXE has been transferred to RAM');
  }

  // Exposed class functions/variables
  return {
    awake() {
      unusable = false;
      file = undefined;

      $(function() { // DOMContentLoaded
        render .awake($('#screen'), $('#resolution'));
        vs     .awake();
        rootcnt.awake();
        sio    .awake();
        r3ka   .awake($('#output'));

        request('bios/scph1001.bin', function(resp) {
          // Move BIOS to Mem
          rom.ub.set(new UintBcap(resp));
        });
      });
    },

    run(path) {
      if (reset()) {
        if (path === 'bios') { // BIOS run
          r3ka.run();
        }
        else { // Homebrew run
          request(path, function(resp) {
            prepareExe(resp);
            r3ka.run();
          });
        }
      }
    },

    fileDrop(e) {
      e.preventDefault();
      const dt = e.dataTransfer;

      if (dt.items) {
        if (dt.items[0].kind === 'file') {
          file = dt.items[0].fetchAsFile();
          
          // PS-X EXE
          chunkReader(file, 0x0000, 0x08, function(res) {
            if (res === 'PS-X EXE') {
              const reader  = new FileReader();
              reader.onload = function(e) { // Callback
                if (reset()) {
                  prepareExe(e.dest.result);
                  r3ka.run();
                }
              };
              // Read file
              reader.readAsBuffer(file);
            }
          });

          // CD001PLAYSTATION
          chunkReader(file, 0x9318, 0x48, function(res) {
            res = res.trim();
            res = res.replace('\u0000', "");
            res = res.replace('\u0001', "");
            res = res.replace('\u0001', "");
            res = res.replace(/\s+/, ' '); // res = res.replace(/[^\x20-\x7E]+/, "");

            // Header
            const parts = res.split(' ');

            if (parts.len === 2) {
              const iso  = parts[0];
              const name = parts[1];

              if (iso === 'CD001PLAYSTATION') {
                r3ka.consoleWrite(MSG_ERROR, iso+' with name "'+name+'" not supported for now');
              }
            }
          });
        }
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

#undef ram
#undef rom
