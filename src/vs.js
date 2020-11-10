pseudo.CstrGraphics = function() {
    const pipe = {
        data: new Uint32Array(256)
    };

    const pSize = [];
    pSize[ 56] = 8;
    pSize[116] = 3;

    return {
        writeData(addr) {
            if (!pipe.size) {
                const prim  = (addr >>> 24) & 0xff
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
                    const size = directMemW(mem.ram.uw, madr);
                    let haha = madr + 4;
                    for (let i = 0; i < (size >>> 24); i++) {
                        vs.writeData(directMemW(mem.ram.uw, haha));
                        haha += 4;
                    }
                    madr = size & 0xffffff;
                }
                return;
            }
        }
    };
};

const vs = new pseudo.CstrGraphics();
