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
                        directMemW(mem.hwr.uw, addr) = data;
                        return;
                }

                psx.error('Hardware Write w ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            },

            h(addr, data) {
                switch(true) {
                    /* unused */
                    case (addr >= 0x1100 && addr <= 0x1128): // Rootcounters
                    case (addr >= 0x1c00 && addr <= 0x1dfe): // SPU
                        directMemH(mem.hwr.uh, addr) = data;
                        return;
                }

                psx.error('Hardware Write h ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            },

            b(addr, data) {
                switch(true) {
                    /* unused */
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
                    /* unused */
                    case (addr == 0x1074): // IRQ Mask
                        return directMemW(mem.hwr.uw, addr);
                }

                psx.error('Hardware Read w ' + psx.hex(addr));
            }
        }
    };
};

const io = new pseudo.CstrHardware();
