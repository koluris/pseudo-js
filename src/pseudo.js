#define ram  mem.__ram
#define rom  mem.__rom

#define EXE_HEADER_SIZE\
  0x800

pseudo.CstrMain = (function() {
  var unusable;
  var file;

  // AJAX function
  function request(path, fn) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if (xhr.status === 404) {
        cpu.consoleWrite(MSG_ERROR, 'Unable to read file "'+path+'"');
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
    var end = start+size;

    // Check boundaries
    if (file.size > end) {
      var reader  = new FileReader();
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
     tcache.reset();
     render.reset();
         vs.reset();
        mem.reset();
    rootcnt.reset();
        bus.reset();
        sio.reset();
       cop2.reset();
        cpu.reset();

    return true;
  }

  function prepareExe(resp) {
    var header = new UintWcap(resp, 0, EXE_HEADER_SIZE);
    var offset = header[2+4]&(ram.ub.bLen-1); // Offset needs boundaries... huh?
    var size   = header[2+5];

    // Set mem
    ram.ub.set(new UintBcap(resp, EXE_HEADER_SIZE, size), offset);
    
    // Set processor
    cpu.exeHeader(header);
    cpu.consoleWrite(MSG_INFO, 'PSX-EXE has been transferred to RAM');
  }

  // Exposed class functions/variables
  return {
    awake() {
      unusable = false;
      file = undefined;

      $(function() { // DOMContentLoaded
         tcache.awake();
         render.awake($('#screen'), $('#resolution'));
             vs.awake();
        rootcnt.awake();
            sio.awake();
            cpu.awake($('#output'));

        request('bios/scph1001.bin', function(resp) {
          // Move BIOS to Mem
          rom.ub.set(new UintBcap(resp));
        });
      });
    },

    run(path) {
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
    },

    fileDrop(e) {
      e.preventDefault();
      var dt = e.dataTransfer;

      if (dt.files) {
        file = dt.files[0];
        
        // PS-X EXE
        chunkReader(file, 0x0000, 8, function(id) {
          if (id === 'PS-X EXE') {
            var reader  = new FileReader();
            reader.onload = function(e) { // Callback
              if (reset()) {
                prepareExe(e.dest.result);
                cpu.run();
              }
            };
            // Read file
            reader.readAsBuffer(file);
          }
        });

        // ISO 9660
        chunkReader(file, 0x9319, 5, function(id) {
          if (id === 'CD001') {
            chunkReader(file, 0x9340, 32, function(name) { // Get Name
              cpu.consoleWrite(MSG_ERROR, 'CD ISO with code "'+name.trim()+'" not supported for now');
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

#undef ram
#undef rom
