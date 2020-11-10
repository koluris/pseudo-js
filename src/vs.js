#define GPU_COMMAND(x) \
    ((x >>> 24) & 0xff)

pseudo.CstrGraphics = function() {
    // Constants
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

    // Resolution Mode
    const resMode = [
        256, 320, 512, 640, 368, 384, 512, 640
    ];

    let modeDMA;

    function pipeReset() {
        pipe.data.fill(0);
        pipe.prim = 0;
        pipe.size = 0;
        pipe.row  = 0;
    }

    const dataMem = {
        write(stream, addr, size) {
            let i = 0;

            while (i < size) {
                ret.data = stream ? directMemW(mem.ram.uw, addr) : addr;
                addr += 4;
                i++;

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
                    pipe.row++;
                }

                if (pipe.size === pipe.row) {
                    pipe.size = 0;
                    pipe.row  = 0;

                    render.draw(pipe.prim, pipe.data);
                }
            }
        }
    };

    // Exposed class functions/variables
    return {
        vram: union(FRAME_W * FRAME_H * 2),

        reset() {
            vs.vram.uh.fill(0);
            ret.status = 0;
            modeDMA    = GPU_DMA_NONE;

            // Command Pipe
            pipeReset();
        },

        scopeW(addr, data) {
            switch(addr & 0xf) {
                case 0: // Data
                    dataMem.write(false, data, 1);
                    return;

                case 4: // Status
                    switch(GPU_COMMAND(data)) {
                        case 0x00:
                            ret.status = 0x14802000;
                            return;

                        case 0x04:
                            modeDMA = data & 3;
                            return;

                        case 0x08:
                            render.resize({
                                w: resMode[(data & 3) | ((data & 0x40) >>> 4)],
                                h: (data & 4) ? 480 : 240
                            });
                            return;

                        /* unused */
                        case 0x03:
                        case 0x05:
                        case 0x06:
                        case 0x07:
                            return;
                    }

                    psx.error('GPU Write Status ' + psx.hex(GPU_COMMAND(data)));
                    return;
            }
        },

        scopeR(addr) {
            switch(addr & 0xf) {
                case 0: // Data
                    return ret.data;

                case 4: // Status
                    return ret.status;
            }
        },

        executeDMA(addr) {
            const size = (bcr >>> 16) * (bcr & 0xffff);

            switch(chcr) {
                case 0x01000401:
                    while(madr !== 0xffffff) {
                        const count = directMemW(mem.ram.uw, madr);
                        dataMem.write(true, madr + 4, count >>> 24);
                        madr = count & 0xffffff;
                    }
                    return;

                /* unused */
                case 0x00000401: // Disable DMA?
                case 0x01000200: // Read
                case 0x01000201: // Write
                    return;
            }

            psx.error('GPU DMA ' + psx.hex(chcr));
        }
    };
};

const vs = new pseudo.CstrGraphics();
