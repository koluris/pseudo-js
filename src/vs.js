/* Base structure taken from PCSX-df open source emulator, and improved upon (Credits: Stephen Chao) */

pseudo.CstrGraphics = function() {
    // Constants
    const GPU_STAT_ODDLINES         = 0x80000000;
    const GPU_STAT_DMABITS          = 0x60000000;
    const GPU_STAT_READYFORCOMMANDS = 0x10000000;
    const GPU_STAT_READYFORVRAM     = 0x08000000;
    const GPU_STAT_IDLE             = 0x04000000;
    const GPU_STAT_DISPLAYDISABLED  = 0x00800000;
    const GPU_STAT_INTERLACED       = 0x00400000;
    const GPU_STAT_RGB24            = 0x00200000;
    const GPU_STAT_PAL              = 0x00100000;
    const GPU_STAT_DOUBLEHEIGHT     = 0x00080000;
    const GPU_STAT_WIDTHBITS        = 0x00070000;
    const GPU_STAT_MASKENABLED      = 0x00001000;
    const GPU_STAT_MASKDRAWN        = 0x00000800;
    const GPU_STAT_DRAWINGALLOWED   = 0x00000400;
    const GPU_STAT_DITHER           = 0x00000200;

    const GPU_DMA_NONE     = 0;
    const GPU_DMA_FIFO     = 1;
    const GPU_DMA_MEM2VRAM = 2;
    const GPU_DMA_VRAM2MEM = 3;

    const ret = {
          data: 0,
        status: 0,
    };

    // Exposed class methods/variables
    return {
        reset() {
            ret.status = GPU_STAT_READYFORCOMMANDS | GPU_STAT_IDLE | GPU_STAT_DISPLAYDISABLED | 0x2000;
        },

        scopeR(addr) {
            switch(addr & 0xf) {
                case 4: // Status
                    return ret.status | GPU_STAT_READYFORVRAM;

                default:
                    psx.error('GPU Read ' + (addr & 0xf));
                    break;
            }
        }
    };
};

const vs = new pseudo.CstrGraphics();
