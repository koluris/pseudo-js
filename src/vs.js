/* Base structure taken from PCSX-df open source emulator, and improved upon (Credits: Stephen Chao) */

#define GPU_COMMAND(x) \
    ((x >>> 24) & 0xff)

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

    // Primitive Size
    const pSize = [
        0x00,0x01,0x03,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x04,0x04,0x04,0x04,0x07,0x07,0x07,0x07, 0x05,0x05,0x05,0x05,0x09,0x09,0x09,0x09,
        0x06,0x06,0x06,0x06,0x09,0x09,0x09,0x09, 0x08,0x08,0x08,0x08,0x0c,0x0c,0x0c,0x0c,
        0x03,0x03,0x03,0x03,0x00,0x00,0x00,0x00, 0xfe,0xfe,0xfe,0xfe,0xfe,0xfe,0xfe,0xfe,
        0x04,0x04,0x04,0x04,0x00,0x00,0x00,0x00, 0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
        0x03,0x03,0x03,0x03,0x04,0x04,0x04,0x04, 0x02,0x02,0x02,0x02,0x03,0x03,0x03,0x03,
        0x02,0x02,0x02,0x02,0x03,0x03,0x03,0x03, 0x02,0x02,0x02,0x02,0x03,0x03,0x03,0x03,
        0x04,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x03,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x03,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x00,0x01,0x01,0x01,0x01,0x01,0x01,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    ];

    const ret = {
          data: 0,
        status: 0,
    };

    // Command Pipeline
    const pipe = {
        data: new UintWcap(256)
    };

    // VRAM Operations
    const vrop = {
        h: {},
        v: {},
    };

    // Resolution Mode
    const resMode = [
        256, 320, 512, 640, 368, 384, 512, 640
    ];

    let modeDMA, vdiff, isVideoPAL, isVideo24Bit, disabled;

    function pipeReset() {
        pipe.data.fill(0);
        pipe.prim = 0;
        pipe.size = 0;
        pipe.row  = 0;
    }

    const dataMem = {
        write(stream, addr, size) {
            for (let i = 0; i < size; i++) {
                if (vrop.allowStore) {
                    if ((i += fetchMem(stream, addr, size - i)) >= size) {
                        continue;
                    }
                    addr += i;
                }

                ret.data = stream ? directMemW(mem.ram.uw, addr) : addr;
                addr += 4;

                if (!pipe.size) {
                    const prim  = GPU_COMMAND(ret.data);
                    const count = pSize[prim];

                    if (count) {
                        pipe.data[0] = ret.data;
                        pipe.prim = prim;
                        pipe.size = count;
                        pipe.row  = 1;
                    }
                    else {
                        continue;
                    }
                }
                else {
                    pipe.data[pipe.row] = ret.data;

                    if (pipe.size > 128) { // Lines with termination code
                        if ((pipe.size == 254 && pipe.row >= 3) || (pipe.size == 255 && pipe.row >= 4 && !(pipe.row & 1))) {
                            if ((pipe.data[pipe.row] & 0xf000f000) == 0x50005000) {
                                pipe.row = pipe.size - 1;
                            }
                        }
                    }
                    pipe.row++;
                }

                if (pipe.size === pipe.row) {
                    pipe.size = 0;
                    pipe.row  = 0;

                    render.draw(pipe.prim, pipe.data);
                }
            }
        },

        read(stream, addr, size) {
            do {
                const vramValue = vs.vram.uw[(vrop.pvram + vrop.h.p) >>> 1];

                if (stream) {
                    directMemW(mem.ram.uw, addr) = vramValue;
                }
                else {
                    ret.data = vramValue;
                }
                addr += 4;

                if (vrop.allowRead) {
                    if ((vrop.h.p += 2) >= vrop.h.end) {
                        vrop.h.p = vrop.h.start;
                        vrop.pvram += FRAME_W;

                        if (++vrop.v.p >= vrop.v.end) {
                            vrop.allowRead = false;
                            break;
                        }
                    }
                }
            } while (--size);
        }
    };

    function fetchMem(stream, addr, size) {
        let count = 0;
        size <<= 1;

        while (vrop.v.p < vrop.v.end) {
            while (vrop.h.p < vrop.h.end) {
                // Keep position of vram
                const ramValue = directMemH(mem.ram.uh, addr);

                if (isVideo24Bit) {
                    vrop.raw.uh[count] = ramValue;
                }
                else {
                    vrop.raw.uw[count] = tcache.pixel2texel(ramValue);
                }

                // Check if it`s a 16-bit (stream), or a 32-bit (command) address
                const pos = (vrop.v.p << 10) + vrop.h.p;
                if (stream) {
                    vs.vram.uh[pos] = ramValue;
                }
                else { // A dumb hack for now
                    if (!(count % 2)) {
                        vs.vram.uw[pos >>> 1] = addr;
                    }
                }
                addr += 2;
                vrop.h.p++;

                if (++count === size) {
                    if (vrop.h.p === vrop.h.end) {
                        vrop.h.p = vrop.h.start;
                        vrop.v.p++;
                    }
                    return fetchMemEnd(count);
                }
            }

            vrop.h.p = vrop.h.start;
            vrop.v.p++;
        }
        return fetchMemEnd(count);
    }

    function fetchMemEnd(count) {
        if (vrop.v.p >= vrop.v.end) {
            // Draw buffer on screen
            render.outputVRAM(
                vrop.raw,
                vrop.h.start,
                vrop.v.start,
                vrop.h.end - vrop.h.start,
                vrop.v.end - vrop.v.start,
                isVideo24Bit
            );

            vrop.allowStore = false;
            vrop.raw.ub.fill(0);
        }

        if (count % 2) {
            count++;
        }
        return count >>> 1;
    }

    function photoData(data) {
        const p = [
            (data[1] >>>  0) & 0x03ff, // srcX
            (data[1] >>> 16) & 0x01ff, // srcY
            (data[2] >>>  0) & 0xffff, // iW
            (data[2] >>> 16) & 0xffff, // iH
        ];

        vrop.h.start = vrop.h.p = p[0];
        vrop.v.start = vrop.v.p = p[1];
        vrop.h.end   = vrop.h.p + p[2];
        vrop.v.end   = vrop.v.p + p[3];

        return p;
    }

    // Exposed class functions/variables
    return {
        vram: union(FRAME_W * FRAME_H * 2),
        vpos: 0,

        reset() {
            vs.vram.uh.fill(0);
            ret.data     = 0x400;
            ret.status   = GPU_STAT_READYFORCOMMANDS | GPU_STAT_IDLE | GPU_STAT_DISPLAYDISABLED | 0x2000;
            modeDMA      = GPU_DMA_NONE;
            vs.vpos      = 0;
            vdiff        = 0;
            isVideoPAL   = false;
            isVideo24Bit = false;
            disabled     = true;

            // VRAM Operations
            vrop.allowStore = false;
            vrop.allowRead  = false;
            vrop.raw     = 0;
            vrop.pvram   = 0;
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
            ret.status ^= GPU_STAT_ODDLINES;
            render.swapBuffers();
        },

        scopeW(addr, data) {
            switch(addr & 0xf) {
                case 0: // Data
                    dataMem.write(false, data, 1);
                    return;

                case 4: // Status
                    switch(GPU_COMMAND(data)) {
                        case 0x00:
                            ret.status   = 0x14802000;
                            disabled     = true;
                            isVideoPAL   = false;
                            isVideo24Bit = false;
                            return;

                        case 0x01:
                            pipeReset();
                            return;

                        case 0x03:
                            disabled = data & 1 ? true : false;
                            return;

                        case 0x04:
                            modeDMA = data & 3;
                            return;

                        case 0x05:
                            vs.vpos = (data >>> 10) & 0x1ff;
                            return;

                        case 0x07:
                            vdiff = ((data >>> 10) & 0x3ff) - (data & 0x3ff);
                            return;

                        case 0x08:
                            isVideoPAL   = ((data) & 8) ? true : false;
                            isVideo24Bit = ((data >>> 4) & 1) ? true : false;

                            {
                                // Basic info
                                const w = resMode[(data & 3) | ((data & 0x40) >>> 4)];
                                const h = (data & 4) ? 480 : 240;

                                if (((data >>> 5) & 1) || h == vdiff) { // No distinction for interlaced & normal mode
                                    render.resize({ w: w, h: h });
                                }
                                else { // Special cases
                                    vdiff = vdiff == 226 ? 240 : vdiff; // pdx-059, wurst2k
                                    render.resize({ w: w, h: vs.vpos ? vs.vpos : vdiff });
                                }
                            }
                            return;

                        case 0x10:
                            switch(data & 0xffffff) {
                                case 7:
                                    ret.data = 2;
                                    return;
                            }
                            return;

                        /* unused */
                        case 0x02:
                        case 0x06:
                            return;
                    }

                    psx.error('GPU Write Status ' + psx.hex(GPU_COMMAND(data)));
                    return;
            }
        },

        scopeR(addr) {
            switch(addr & 0xf) {
                case 0: // Data
                    dataMem.read(false, 0, 1);
                    return ret.data;

                case 4: // Status
                    return ret.status | GPU_STAT_READYFORVRAM;
            }
        },

        executeDMA(addr) {
            const size = (bcr >>> 16) * (bcr & 0xffff);

            switch(chcr) {
                case 0x01000200:
                    dataMem.read(true, madr, size);
                    return;

                case 0x01000201:
                    dataMem.write(true, madr, size);
                    return;

                case 0x01000401:
                    while(madr !== 0xffffff) {
                        const count = directMemW(mem.ram.uw, madr);
                        dataMem.write(true, madr + 4, count >>> 24);
                        madr = count & 0xffffff;
                    }
                    return;

                /* unused */
                case 0x00000401: // Disable DMA?
                    return;
            }

            psx.error('GPU DMA ' + psx.hex(chcr));
        },

        photoSendTo(data) {
            const p = photoData(data);

            vrop.allowStore = true;
            vrop.raw = new union((p[2] * p[3]) * 4);

            // Cache invalidation
            tcache.invalidate(vrop.h.start, vrop.v.start, vrop.h.end, vrop.v.end);
        },

        photoReadFrom(data) {
            const p = photoData(data);

            vrop.allowRead = true;
            vrop.pvram = p[1] * FRAME_W;
        }
    };
};

const vs = new pseudo.CstrGraphics();
