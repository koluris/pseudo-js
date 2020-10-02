pseudo.CstrMdec = (function() {
  var cmd, status;

  // Exposed class functions/variables
  return {
    reset() {
      cmd    = 0;
      status = 0;
    },

    scopeW(addr, data) {
      switch(addr&0xf) {
        case 0:
          cmd = data;
          return;

        case 4:
          if (data&0x80000000) {
            mdec.reset();
          }
          return;
      }
    },

    scopeR(addr) {
      switch(addr&0xf) {
        case 0:
          return cmd;

        case 4:
          return status;
      }
    }
  };
})();
