pseudo.CstrMem = function() {
    // Exposed class methods/variables
    return {
        rom: union(0x80000),

        reset() {
            // Reset all, except for BIOS
        },

        writeROM(data) {
            mem.rom.ub.set(new UintBcap(data));
        }
    };
};

const mem = new pseudo.CstrMem();
