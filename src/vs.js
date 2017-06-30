pseudo.CstrGraphics = (function() {
  let status;
  let pipe;

  const sizePrim = [
    0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x00
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x10
    4, 4, 4, 4, 7, 7, 7, 7, 5, 5, 5, 5, 9, 9, 9, 9, // 0x20
    6, 6, 6, 6, 9, 9, 9, 9, 8, 8, 8, 8,12,12,12,12, // 0x30
    3, 3, 3, 3, 0, 0, 0, 0, 5, 5, 5, 5, 6, 6, 6, 6, // 0x40
    4, 4, 4, 4, 0, 0, 0, 0, 7, 7, 7, 7, 9, 9, 9, 9, // 0x50
    3, 3, 3, 3, 4, 4, 4, 4, 2, 2, 2, 2, 0, 0, 0, 0, // 0x60
    2, 2, 2, 2, 3, 3, 3, 3, 2, 2, 2, 2, 3, 3, 3, 3, // 0x70
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x80
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x90
    3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xa0
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xb0
    3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xc0
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xd0
    0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xe0
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xf0
  ];

  const write = {
    data(addr) {
      if (!pipe.size) {
        const prim = (addr>>>24)&0xff;
        const size = sizePrim[prim];

        if (size) {
          pipe.data[0] = addr;
          pipe.prim = prim;
          pipe.size = size;
          pipe.row  = 1;
        }
        else {
          return;
        }
      }
      else {
        pipe.data[pipe.row] = addr;
        pipe.row++;
      }

      // Render primitive
      if (pipe.size === pipe.row) {
        pipe.size = 0;
        pipe.row  = 0;
        
        console.dir('pseudo / GPU render primitive');
      }
    }
  }

  // Exposed class functions/variables
  return {
    awake() {
      // Command Pipe
      pipe = {
        data: new UintWcap(100)
      };
    },

    reset() {
      status = 0x14802000;

      // Command Pipe
      pipe.data.fill(0);
      pipe.prim = 0;
      pipe.size = 0;
      pipe.row  = 0;
    },

    scopeW(addr, data) {
      switch(addr&0xf) {
        case 0: // Data
          write.data(data);
          return;
      }
      psx.error('pseudo / GPU write '+hex(addr)+' <- '+hex(data));
    },

    scopeR(addr) {
      switch(addr&0xf) {
        case 4: // Status
          return status;
      }
      psx.error('pseudo / GPU read '+hex(addr));
    }
  };
})();
