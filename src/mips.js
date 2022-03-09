/* Base structure and authentic idea PSeudo (Credits: Dennis Koluris) */

#define pc  cpu.base[32]
#define lo  cpu.base[33]
#define hi  cpu.base[34]

pseudo.CstrMips = function() {
    // Base CPU stepper
    function step() {
        const code  = mem.read.w(pc);
        cpu.base[0] = 0;
        pc += 4;
        console.info(psx.hex(code));
    }

    // Exposed class methods/variables
    return {
        base: new UintWcap(32 + 3), // + pc, lo, hi

        reset() {
            // Reset processors
            cpu.base.fill(0);
            pc = 0xbfc00000;
        },

        run() {
            step();
            psx.error('EOF');
        }
    };
};

const cpu = new pseudo.CstrMips();
