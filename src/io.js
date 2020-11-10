pseudo.CstrHardware = function() {
    return {
        write: {
            w(addr, data) {
                switch(true) {
                    case (addr >= 0x1080 && addr <= 0x10e8): // DMA
                        directMemW(mem.hwr.uw, addr) = data;

                        if (addr & 8) {
                            const chan = ((addr >>> 4) & 0xf) - 8;

                            if (chan === 2) {
                                vs.executeDMA(addr);
                            }

                            chcr = data & (~(0x01000000));
                        }
                        return;

                    case (addr >= 0x1810 && addr <= 0x1814): // Graphics
                        vs.scopeW(addr, data);
                        return;

                    /* unused */
                    case (addr == 0x10f0): // DPCR
                    case (addr == 0x10f4): // DICR
                        directMemW(mem.hwr.uw, addr) = data;
                        return;
                }

                psx.error('Hardware Write w ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            }
        },

        read: {
            w(addr) {
                switch(true) {
                    case (addr >= 0x1810 && addr <= 0x1814): // Graphics
                        return vs.scopeR(addr);

                    /* unused */
                    case (addr >= 0x1080 && addr <= 0x10e8): // DMA
                    case (addr == 0x10f0): // DPCR
                        return directMemW(mem.hwr.uw, addr);
                }

                psx.error('Hardware Read w ' + psx.hex(addr));
            }
        }
    };
};

const io = new pseudo.CstrHardware();
