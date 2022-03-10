/* Base structure and authentic idea PSeudo (Credits: Dennis Koluris) */

pseudo.CstrHardware = function() {
    // Exposed class functions/variables
    return {
        write: {
            w(addr, data) {
                switch(true) {
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
                        directMemW(mem.hwr.uw, addr) = data;
                        return;

                    default:
                        psx.error('Hardware W32 ' + psx.hex(addr) + ' <- ' + psx.hex(data));
                        return;
                }
            },

            h(addr, data) {
                switch(true) {
                    /* unused */
                    case (addr >= 0x1c00 && addr <= 0x1dfe): // SPU
                        directMemH(mem.hwr.uh, addr) = data;
                        return;

                    default:
                        psx.error('Hardware W16 ' + psx.hex(addr) + ' <- ' + psx.hex(data));
                        return;
                }
            },

            b(addr, data) {
                switch(true) {
                    /* unused */
                    case (addr == 0x2041): // DIP Switch?
                        directMemB(mem.hwr.ub, addr) = data;
                        return;

                    default:
                        psx.error('Hardware W08 ' + psx.hex(addr) + ' <- ' + psx.hex(data));
                        return;
                }
            }
        }
    };
};

const io = new pseudo.CstrHardware();
