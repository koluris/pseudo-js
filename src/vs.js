#define GPU_COMMAND(x)\
  (x>>>24)&0xff

#define GPU_DATA   0
#define GPU_STATUS 4

#define GPU_DMA_NONE     0
#define GPU_DMA_UNKNOWN  1
#define GPU_DMA_MEM2VRAM 2
#define GPU_DMA_VRAM2MEM 3

pseudo.CstrGraphics = (function() {
  let status;
  let pipe;
  let modeDMA;

  const resMode = [
    256, 320, 512, 640, 368, 384, 512, 640
  ];

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
        const prim = GPU_COMMAND(addr);
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
        
        console.dir('GPU Render Primitive '+hex(pipe.prim));
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
      status  = 0x14802000;
      modeDMA = GPU_DMA_NONE;

      // Command Pipe
      pipe.data.fill(0);
      pipe.prim = 0;
      pipe.size = 0;
      pipe.row  = 0;
    },

    scopeW(addr, data) {
      switch(addr&0xf) {
        case GPU_DATA:
          write.data(data);
          return;

        case GPU_STATUS:
          switch(GPU_COMMAND(data)) {
            case 0x00:
              status = 0x14802000;
              return;

            case 0x04:
              modeDMA = data&3;
              return;

            case 0x08:
              render.resize({
                w: resMode[(data&3)|((data&0x40)>>>4)],
                h: (data&4) ? 480 : 240
              });
              return;

            /* unused */
            case 0x01:
            case 0x03:
            case 0x05:
            case 0x06:
            case 0x07:
            case 0x10:
              return;
          }
          psx.error('GPU Write Status '+hex(GPU_COMMAND(data)));
          return;
      }
    },

    scopeR(addr) {
      switch(addr&0xf) {
        case GPU_DATA:
          return 0; // Nope: data

        case GPU_STATUS:
          return status;
      }
    },

    executeDMA(addr) {
      var size = (bcr>>16)*(bcr&0xffff);

      switch (chcr) {
        case 0x00000401: // Disable DMA?
          return;

        case 0x01000201:
          return;

        case 0x01000401:
          return;
      }
      psx.error('GPU DMA '+hex(chcr));
    }
  };
})();
