/* Base structure and authentic idea PSeudo (Credits: Dennis Koluris) */

pseudo.CstrHardware = function() {
    // Exposed class functions/variables
    return {
        write: {
            w(addr, data) {
                switch(true) {
                    case (addr == 0x1070): // IRQ Status
                        data32 &= data & mask32;
                        return;

                    case (addr >= 0x1080 && addr <= 0x10e8): // DMA
                        directMemW(mem.hwr.uw, addr) = data;

                        if (addr & 8) {
                            bus.checkDMA(addr, data);
                        }
                        return;

                    case (addr == 0x10f4): // DICR, thanks Calb, Galtor :)
                        dicr = (dicr & (~((data & 0xff000000) | 0xffffff))) | (data & 0xffffff);
                        return;

                    case (addr >= 0x1104 && addr <= 0x1124): // Rootcounters
                        rootcnt.scopeW(addr, data);
                        return;

                    case (addr >= 0x1810 && addr <= 0x1814): // Graphics
                        vs.scopeW(addr, data);
                        return;

                    case (addr >= 0x1820 && addr <= 0x1824): // Motion Decoder
                        mdec.scopeW(addr, data);
                        return;

                    /* unused */
                    case (addr == 0x1000): // ?
                    case (addr == 0x1004): // ?
                    case (addr == 0x1008): // ?
                    case (addr == 0x100c): // ?
                    case (addr == 0x1010): // ?
                    case (addr == 0x1014): // SPU
                    case (addr == 0x1018): // DV5
                    case (addr == 0x101c): // ?
                    case (addr == 0x1020): // COM
                    case (addr == 0x1060): // RAM Size
                    case (addr == 0x1074): // IRQ Mask
                    case (addr == 0x10f0): // DPCR
                    case (addr == 0x1d80): // SPU in 32 bits?
                    case (addr == 0x1d84): // SPU in 32 bits?
                    case (addr == 0x1d8c): // SPU in 32 bits?
                        directMemW(mem.hwr.uw, addr) = data;
                        return;
                }

                psx.error('Hardware Write w ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            },

            h(addr, data) {
                switch(true) {
                    case (addr >= 0x1040 && addr <= 0x104e): // SIO 0
                        sio.write.h(addr, data);
                        return;

                    case (addr == 0x1070): // IRQ Status
                        data16 &= data & mask16;
                        return;

                    case (addr >= 0x1100 && addr <= 0x1128): // Rootcounters
                        rootcnt.scopeW(addr, data);
                        return;

                    case (addr >= 0x1c00 && addr <= 0x1dfe): // SPU
                        audio.scopeW(addr, data);
                        return;

                    /* unused */
                    case (addr == 0x1014): // ?
                    case (addr == 0x1058): // SIO 1 Mode
                    case (addr == 0x105a): // SIO 1 Control
                    case (addr == 0x105e): // SIO 1 Baud
                    case (addr == 0x1074): // IRQ Mask
                        directMemH(mem.hwr.uh, addr) = data;
                        return;
                }

                psx.error('Hardware Write h ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            },

            b(addr, data) {
                switch(true) {
                    case (addr >= 0x1040 && addr <= 0x104e): // SIO 0
                        sio.write.b(addr, data);
                        return;

                    case (addr >= 0x1800 && addr <= 0x1803): // CD-ROM
                        cdrom.scopeW(addr, data);
                        return;

                    /* unused */
                    case (addr == 0x10f6): // ?
                    case (addr == 0x2041): // DIP Switch?
                        directMemB(mem.hwr.ub, addr) = data;
                        return;
                }

                psx.error('Hardware Write b ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            }
        },

        read: {
            w(addr) {
                switch(true) {
                    case (addr >= 0x1810 && addr <= 0x1814): // Graphics
                        return vs.scopeR(addr);

                    case (addr >= 0x1820 && addr <= 0x1824): // Motion Decoder
                        return mdec.scopeR(addr);

                    /* unused */
                    case (addr == 0x1014): // ?
                    case (addr == 0x1060): // ?
                    case (addr == 0x1070): // IRQ Status
                    case (addr == 0x1074): // IRQ Mask
                    case (addr >= 0x1080 && addr <= 0x10e8): // DMA
                    case (addr == 0x10f0): // DPCR
                    case (addr == 0x10f4): // DICR
                    case (addr >= 0x1100 && addr <= 0x1110): // Rootcounters
                        return directMemW(mem.hwr.uw, addr);
                }

                psx.error('Hardware Read w ' + psx.hex(addr));
            },

            h(addr) {
                switch(true) {
                    case (addr >= 0x1040 && addr <= 0x104e): // SIO 0
                        return sio.read.h(addr);

                    case (addr >= 0x1c00 && addr <= 0x1e3e): // SPU
                        return audio.scopeR(addr);

                    /* unused */
                    case (addr == 0x1014): // ?
                    case (addr == 0x1054): // SIO 1 Status
                    case (addr == 0x105a): // SIO 1 Control
                    case (addr == 0x105e): // SIO 1 Baud
                    case (addr == 0x1070): // IRQ Status
                    case (addr == 0x1074): // IRQ Mask
                    case (addr >= 0x1100 && addr <= 0x1128): // Rootcounters
                    case (addr == 0x1130): // ?
                        return directMemH(mem.hwr.uh, addr);
                }

                psx.error('Hardware Read h ' + psx.hex(addr));
            },

            b(addr) {
                switch(true) {
                    case (addr >= 0x1040 && addr <= 0x104e): // SIO 0
                        return sio.read.b(addr);

                    case (addr >= 0x1800 && addr <= 0x1803): // CD-ROM
                        return cdrom.scopeR(addr);

                    /* unused */
                    case (addr == 0x10f6): // ?
                    case (addr == 0x1d68): // ?
                    case (addr == 0x1d78): // ?
                        return directMemB(mem.hwr.ub, addr);
                }

                psx.error('Hardware Read b ' + psx.hex(addr));
            }
        }
    };
};

const io = new pseudo.CstrHardware();
