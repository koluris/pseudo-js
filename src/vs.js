#define ram  mem.__ram
#define hwr  mem.__hwr
#define vram  vs.__vram

#define GPU_DATA   0
#define GPU_STATUS 4

#define GPU_DITHER           0x00000200
#define GPU_DRAWINGALLOWED   0x00000400
#define GPU_MASKDRAWN        0x00000800
#define GPU_MASKENABLED      0x00001000
#define GPU_WIDTHBITS        0x00070000
#define GPU_DOUBLEHEIGHT     0x00080000
#define GPU_PAL              0x00100000
#define GPU_RGB24            0x00200000
#define GPU_INTERLACED       0x00400000
#define GPU_DISPLAYDISABLED  0x00800000
#define GPU_IDLE             0x04000000
#define GPU_READYFORVRAM     0x08000000
#define GPU_READYFORCOMMANDS 0x10000000
#define GPU_DMABITS          0x60000000
#define GPU_ODDLINES         0x80000000

#define GPU_COMMAND(x)\
  (x>>>24)&0xff

#define READIMG(data) {\
  n2: (data[1]>>> 0)&0xffff,\
  n3: (data[1]>>>16)&0xffff,\
  n4: (data[2]>>> 0)&0xffff,\
  n5: (data[2]>>>16)&0xffff,\
}

pseudo.CstrGraphics = (function() {
  var status, data, modeDMA;

  // VRAM Operations
  var vrop = {
    h: {},
    v: {},
  };

  // Command Pipe
  var pipe = {
    data: new UintWcap(100)
  };

  // Primitive Size
  var sizePrim = [
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

  // Resolution Mode
  var resMode = [
    256, 320, 512, 640, 368, 384, 512, 640
  ];

  function infoSet(n) {
    data = render.infoRead[n&0xff];
  }

  function fetchFromRAM(stream, addr, size) {
    var count = 0;

    // False alarm!
    if (!vrop.enabled) {
      modeDMA = GPU_DMA_NONE;
      return 0;
    }
    size <<= 1;

    while (vrop.v.p < vrop.v.end) {
      while (vrop.h.p < vrop.h.end) {
        // Keep position of vram
        var pos = (vrop.v.p<<10)+vrop.h.p;

        // Check if it`s a 16-bit (stream), or a 32-bit (command) address
        if (stream) {
          vram.uh[pos] = directMemH(ram.uh, addr);
        }
        else { // A dumb hack for now
          if (!(count%2)) {
            vram.uw[pos>>>1] = addr;
          }
        }

        addr += 2;
        vrop.h.p++;

        if (++count === size) {
          if (vrop.h.p === vrop.h.end) {
            vrop.h.p = vrop.h.start;
            vrop.v.p++;
          }
          return fetchEnd(count);
        }
      }

      vrop.h.p = vrop.h.start;
      vrop.v.p++;
    }
    return fetchEnd(count);
  }

  function fetchEnd(count) {
    if (vrop.v.p >= vrop.v.end) {
      modeDMA = GPU_DMA_NONE;
      vrop.enabled = false;

      // if (count%2 === 1) {
      //     count++;
      // }
    }
    return count>>1;
  }

  var dataMem = {
    write(stream, addr, size) {
      var i = 0;
      
      while (i < size) {
        if (modeDMA === GPU_DMA_MEM2VRAM) {
          if ((i += fetchFromRAM(stream, addr, size-i)) >= size) {
            continue;
          }
          addr += i;
        }
        
        data = stream ? directMemW(ram.uw, addr) : addr;
        addr += 4;
        i++;

        if (!pipe.size) {
          var prim  = GPU_COMMAND(data);
          var count = sizePrim[prim];

          if (count) {
            pipe.data[0] = data;
            pipe.prim = prim;
            pipe.size = count;
            pipe.row  = 1;
          }
          else {
            continue;
          }
        }
        else {
          pipe.data[pipe.row] = data;
          pipe.row++;
        }

        if (pipe.size === pipe.row) {
          pipe.size = 0;
          pipe.row  = 0;

          render.draw(pipe.prim, pipe.data);
        }
      }
    },

    read(addr, size) {
      // Oops
    }
  }

  function pipeReset() {
    ioZero(pipe.data);
    pipe.prim = 0;
    pipe.size = 0;
    pipe.row  = 0;
  }

  // Exposed class functions/variables
  return {
    __vram: union(FRAME_W*FRAME_H*2),

    reset() {
      ioZero(vram.uh);
      status  = 0x14802000;
      data    = 0x400;
      modeDMA = GPU_DMA_NONE;

      // VRAM Operations
      vrop.enabled = false;
      vrop.h.p     = 0;
      vrop.h.start = 0;
      vrop.h.end   = 0;
      vrop.v.p     = 0;
      vrop.v.start = 0;
      vrop.v.end   = 0;

      // Command Pipe
      pipeReset();
    },

    redraw() {
      status ^= GPU_ODDLINES;
    },

    scopeW(addr, data) {
      switch(addr&0xf) {
        case GPU_DATA:
          dataMem.write(false, data, 1);
          return;

        case GPU_STATUS:
          switch(GPU_COMMAND(data)) {
            case 0x00:
              status = 0x14802000;
              return;

            case 0x01:
              pipeReset();
              return;

            case 0x04:
              modeDMA = data&3;
              return;

            case 0x08:
              render.resize({
                w: resMode[(data&3) | ((data&0x40)>>>4)],
                h: (data&4) ? 480 : 240
              });
              return;

            case 0x10:
              infoSet(data);
              return;

            /* unused */
            case 0x02:
            case 0x03:
            case 0x05:
            case 0x06:
            case 0x07:
              return;
          }
          psx.error('GPU Write Status '+hex(GPU_COMMAND(data)));
          return;
      }
    },

    scopeR(addr) {
      switch(addr&0xf) {
        case GPU_DATA:
          return data;

        case GPU_STATUS:
          status |=  GPU_READYFORVRAM;
          status &= ~GPU_DOUBLEHEIGHT;
          return status;
      }
    },

    executeDMA(addr) {
      var size = (bcr>>16)*(bcr&0xffff);

      switch(chcr) {
        case 0x00000401: // Disable DMA?
          return;

        case 0x01000200:
          dataMem.read(madr, size);
          return;

        case 0x01000201:
          dataMem.write(true, madr, size);
          return;

        case 0x01000401:
          while (madr !== 0xffffff) {
            var count = directMemW(ram.uw, madr);
            dataMem.write(true, (madr+4)&0x1ffffc, count>>>24);
            madr = count&0xffffff;
          }
          return;
      }
      psx.error('GPU DMA '+hex(chcr));
    },

    inread(data) {
      var k = READIMG(data);

      vrop.enabled = true;
      vrop.h.p     = vrop.h.start = k.n2;
      vrop.v.p     = vrop.v.start = k.n3;
      vrop.h.end   = vrop.h.start + k.n4;
      vrop.v.end   = vrop.v.start + k.n5;
      
      modeDMA = GPU_DMA_MEM2VRAM;
    },

    texp(spriteTP) {
      status = (status&(~0x7ff)) | spriteTP;
    },

    stp(data) {
      status = (status&(~(3<<11))) | ((data[0]&3)<<11);
    }
  };
})();

#undef ram
#undef hwr
#undef vram
