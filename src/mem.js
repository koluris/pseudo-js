/* Base structure and authentic idea PSeudo (Credits: Dennis Koluris) */

pseudo.CstrMem = function() {
    // Exposed class methods/variables
    return {
        rom: union(0x80000),

        reset() {
            // Reset all, except for BIOS
        },

        writeROM(data) {
            mem.rom.ub.set(new UintBcap(data));
        },

        read: {
            w(addr) {
                switch(addr >>> 24) {
                    case 0xbf:
                        return directMemW(mem.rom.uw, addr);
                }

                psx.error('Mem R32 ' + psx.hex(addr));
            }
        }
    };
};

const mem = new pseudo.CstrMem();
