#define ram mem._ram
#define hwr mem._hwr

#define inn vs._inn
#define vac vs._vac

#define GPU_COMMAND(x)\
  (x>>>24)&0xff

#define GPU_DATA   0
#define GPU_STATUS 4

#define GPU_ODDLINES         0x80000000
#define GPU_DMABITS          0x60000000
#define GPU_READYFORCOMMANDS 0x10000000
#define GPU_READYFORVRAM     0x08000000
#define GPU_IDLE             0x04000000
#define GPU_DISPLAYDISABLED  0x00800000
#define GPU_INTERLACED       0x00400000
#define GPU_RGB24            0x00200000
#define GPU_PAL              0x00100000
#define GPU_DOUBLEHEIGHT     0x00080000
#define GPU_WIDTHBITS        0x00070000
#define GPU_MASKENABLED      0x00001000
#define GPU_MASKDRAWN        0x00000800
#define GPU_DRAWINGALLOWED   0x00000400
#define GPU_DITHER           0x00000200

pseudo.CstrGraphics = (function() {
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

  const resMode = [
    256, 320, 512, 640, 368, 384, 512, 640
  ];

  function fetchFromVRAM(stream, addr, size) {
    let count = 0;

    if (!vac.enabled) {
      inn.modeDMA = GPU_DMA_NONE;
      return 0;
    }
    size <<= 1;

    while (vac._Y.p < vac._Y.end) {
      while (vac._X.p < vac._X.end) {
        // Keep position of vram.
        const pos = (vac._Y.p<<10)+vac._X.p;

        // Check if it`s a 16-bit (stream), or a 32-bit (command) address.
        if (stream) {
          inn.vram.uh[pos] = directMemH(ram.uh, addr);
        }
        else {
          if (!(count%2)) {
            inn.vram.uw[pos>>>1] = addr;
          }
        }

        addr+=2;
        vac._X.p++;

        if (++count === size) {
          if (vac._X.p === vac._X.end) {
            vac._X.p = vac._X.start;
            vac._Y.p++;
          }
          return fetchEnd(count);
        }
      }

      vac._X.p = vac._X.start;
      vac._Y.p++;
    }
    return fetchEnd(count);
  }

  function fetchEnd(count) {
    if (vac._Y.p >= vac._Y.end) {
      inn.modeDMA = GPU_DMA_NONE;
      vac.enabled = false;

      // if (count%2 === 1) {
      //     count++;
      // }
    }
    return count>>1;
  }

  const dataMem = {
    write(stream, addr, size) {
      let i = 0;
      
      while (i < size) {
        if (inn.modeDMA === GPU_DMA_MEM2VRAM) {
          if ((i += fetchFromVRAM(stream, addr, size-i)) >= size) {
            continue;
          }
          addr += i;
        }
        
        inn.data = stream ? directMemW(ram.uw, addr) : addr;
        addr += 4;
        i++;

        if (!pipe.size) {
          const prim = GPU_COMMAND(inn.data);
          const size = sizePrim[prim];

          if (size) {
            pipe.data[0] = inn.data;
            pipe.prim = prim;
            pipe.size = size;
            pipe.row  = 1;
          }
          else {
            continue;
          }
        }
        else {
          pipe.data[pipe.row] = inn.data;
          pipe.row++;
        }

        if (pipe.size === pipe.row) {
          pipe.size = 0;
          pipe.row  = 0;
          render.prim(pipe.prim, pipe.data);
        }
      }
    }
  }

  function pipeReset() {
    pipe.data.fill(0);
    pipe.prim = 0;
    pipe.size = 0;
    pipe.row  = 0;
  }

  // Exposed class functions/variables
  return {
    _inn: undefined,
    _vac: undefined,

    awake() {
      inn = {
        vram: union(FRAME_W*FRAME_H*2),
         ofs: {}
      };

      // VRAM Operations
      vac = {
        _X: {},
        _Y: {},
      };

      // Command Pipe
      pipe = {
        data: new UintWcap(100)
      };
    },

    reset() {
      inn.vram.uh.fill(0);
      inn.blend    = 0;
      inn.data     = 0x400;
      inn.modeDMA  = GPU_DMA_NONE;
      inn.ofs._X   = 0;
      inn.ofs._Y   = 0;
      inn.spriteTP = 0;
      inn.status   = 0x14802000;

      // VRAM Operations
      vac.enabled  = false;
      vac._X.p     = 0;
      vac._X.start = 0;
      vac._X.end   = 0;
      vac._Y.p     = 0;
      vac._Y.start = 0;
      vac._Y.end   = 0;

      // Command Pipe
      pipeReset();
    },

    redraw() {
      inn.status ^= GPU_ODDLINES;
    },

    scopeW(addr, data) {
      switch(addr&0xf) {
        case GPU_DATA:
          dataMem.write(false, data, 1);
          return;

        case GPU_STATUS:
          switch(GPU_COMMAND(data)) {
            case 0x00:
              inn.status = 0x14802000;
              return;

            case 0x01:
              pipeReset();
              return;

            case 0x04:
              inn.modeDMA = data&3;
              return;

            case 0x08:
              render.resize({
                w: resMode[(data&3) | ((data&0x40)>>>4)],
                h: (data&4) ? 480 : 240
              });
              return;

            /* unused */
            case 0x02:
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
          return inn.data;

        case GPU_STATUS:
          inn.status |=  GPU_READYFORVRAM;
          inn.status &= ~GPU_DOUBLEHEIGHT;
          return inn.status;
      }
    },

    executeDMA(addr) {
      const size = (bcr>>16)*(bcr&0xffff);

      switch(chcr) {
        case 0x00000401: // Disable DMA?
          return;

        case 0x01000201:
          dataMem.write(true, madr, size);
          return;

        case 0x01000401:
          do {
            const count = directMemW(ram.uw, madr);
            dataMem.write(true, (madr+4)&0x1ffffc, count>>>24);
            madr = count&0xffffff;
          }
          while (madr !== 0xffffff);
          return;
      }
      psx.error('GPU DMA '+hex(chcr));
    }
  };
})();

#undef ram
#undef hwr

#undef inn
#undef vac
