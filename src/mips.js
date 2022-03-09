pseudo.CstrMips = function() {
    // Exposed class methods/variables
    return {
        base: new UintWcap(32 + 3), // + pc, lo, hi

        reset() {
            // Reset processors
            cpu.base.fill(0);
            pc = 0xbfc00000;
        },

        run() {
            psx.error('EOF');
        }
    };
};

const cpu = new pseudo.CstrMips();
