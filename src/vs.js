#define ram mem._ram
#define hwr mem._hwr

#define inn vs._inn
#define vac vs._vac

#define GPU_COMMAND(x)\
  (x>>>24)&0xff

#define GPU_DATA   0
#define GPU_STATUS 4

#define GPU_ODDLINES 0x80000000

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

  function fetchFromVRAM(addr, size) {
    let count = 0;

    if (!vac.enabled) {
      inn.modeDMA = GPU_DMA_NONE;
      return 0;
    }
    size <<= 1;

    while (vac.v.p < vac.v.end) {
      while (vac.h.p < vac.h.end) {
        // Keep position of vram.
        const pos = (vac.v.p<<10)+vac.h.p;
        inn.vram.uh[pos] = directMemH(ram.uh, addr);

        addr+=2;
        vac.h.p++;

        if (++count === size) {
          if (vac.h.p === vac.h.end) {
            vac.h.p = vac.h.start;
            vac.v.p++;
          }
          return fetchEnd(count);
        }
      }

      vac.h.p = vac.h.start;
      vac.v.p++;
    }
    return fetchEnd(count);
  }

  function fetchEnd(count) {
    if (vac.v.p >= vac.v.end) {
      inn.modeDMA = GPU_DMA_NONE;
      vac.enabled = false;

      /*if (count%2 === 1) {
          count++;
      }*/
    }
    return count>>1;
  }

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
        render.prim(pipe.prim, pipe.data);
      }
    },

    dataMem(addr, size) {
      let i = 0;

      while (i < size) {
        if (inn.modeDMA === GPU_DMA_MEM2VRAM) {
          if ((i += fetchFromVRAM(addr, size-i)) >= size) {
            continue;
          }
          addr += i;
        }

        inn.data = directMemW(ram.uw, addr);
        addr += 4;
        i++;
        write.data(inn.data);
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
        ofs : {}
      };

      // VRAM Operations
      vac = {
        h: {},
        v: {},
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
      vac.enabled = false;
      vac.pvaddr  = 0;
      vac.h.p     = 0;
      vac.h.start = 0;
      vac.h.end   = 0;
      vac.v.p     = 0;
      vac.v.start = 0;
      vac.v.end   = 0;

      // Command Pipe
      pipeReset();
    },

    redraw() {
      inn.status ^= GPU_ODDLINES;
    },

    scopeW(addr, data) {
      switch(addr&0xf) {
        case GPU_DATA:
          write.data(data);
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
          return inn.status;
      }
    },

    executeDMA(addr) {
      const size = (bcr>>16)*(bcr&0xffff);

      switch(chcr) {
        case 0x00000401: // Disable DMA?
          return;

        case 0x01000201:
          write.dataMem(madr, size);
          return;

        case 0x01000401:
          do {
            const count = directMemW(ram.uw, madr);
            write.dataMem((madr+4)&0x1ffffc, count>>>24);
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
