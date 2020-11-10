/* Base structure and authentic idea PSeudo (Credits: Dennis Koluris) */

pseudo.CstrHardware = function() {
    // Exposed class functions/variables
    return {
        write: {
            w(addr, data) {
                switch(true) {
                    case (addr >= 0x1080 && addr <= 0x10e8): // DMA
                        directMemW(mem.hwr.uw, addr) = data;

                        if (addr & 8) {
                            const chan = ((addr >>> 4) & 0xf) - 8;
            
                            if (dpcr & (8 << (chan * 4))) {
                                if (chan === 2) {
                                    vs.executeDMA(addr);
                                }
                                
                                chcr = data & (~(0x01000000));

                                if (dicr & (1 << (16 + chan))) {
                                    dicr |= 1 << (24 + chan);
                                    bus.interruptSet(IRQ_DMA);
                                }
                            }
                        }
                        return;

                    case (addr == 0x10f4): // DICR, thanks Calb, Galtor :)
                        dicr = (dicr & (~((data & 0xff000000) | 0xffffff))) | (data & 0xffffff);
                        return;

                    case (addr >= 0x1810 && addr <= 0x1814): // Graphics
                        vs.scopeW(addr, data);
                        return;

                    /* unused */
                    case (addr == 0x10f0): // DPCR
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
