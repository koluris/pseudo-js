#define GPU_COMMAND(x) \
    ((x >>> 24) & 0xff)

pseudo.CstrGraphics = function() {
    // Command Pipeline
    const pipe = {
        data: new Uint32Array(256)
    };

    const pSize = [];
    pSize[ 56] = 8;
    pSize[116] = 3;

    return {
        writeData(addr) {
            if (!pipe.size) {
                const prim  = GPU_COMMAND(addr);
                const count = pSize[prim];

                if (count) {
                    pipe.data[0] = addr;
                    pipe.prim = prim;
                    pipe.size = count;
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

            if (pipe.size === pipe.row) {
                pipe.size = 0;
                pipe.row  = 0;

                render.draw(pipe.prim, pipe.data);
            }
        },

        executeDMA(addr) {
            if (chcr === 0x01000401) {
                while(madr !== 0xffffff) {
                    const count = directMemW(mem.ram.uw, madr);
                    let haha = madr + 4;
                    let i = 0;
                    while (i < (count >>> 24)) {
                        vs.writeData(directMemW(mem.ram.uw, haha));
                        haha += 4;
                        i++;
                    }
                    madr = count & 0xffffff;
                }
                return;
            }
        }
    };
};

const vs = new pseudo.CstrGraphics();
