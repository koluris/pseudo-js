/* Base structure and authentic idea PSeudo (Credits: Dennis Koluris) */

#define pc  cpu.base[32]
#define lo  cpu.base[33]
#define hi  cpu.base[34]

#define opcode \
    ((code >>> 26) & 0x3f)

#define shamt \
    ((code >>> 6) & 0x1f)

#define imm_u \
    (code & 0xffff)

#define imm_s \
    (SIGN_EXT_16(code))

#define ob \
    (cpu.base[rs] + imm_s)

#define b_addr \
    (pc + (imm_s << 2))

#define s_addr \
    ((pc & 0xf0000000) | (code & 0x3ffffff) << 2)

pseudo.CstrMips = function() {
    let branched, cc;

    // Base CPU stepper
    function step() {
        const code  = mem.read.w(pc);
        pc += 4;

        switch(opcode) {
            case 13: // ORI
                cpu.base[rt] = cpu.base[rs] | imm_u;
                return;

            case 15: // LUI
                cpu.base[rt] = code << 16;
                break;

            default:
                psx.error(psx.hex(opcode));
                break;
        }

        cpu.base[0] = 0;
        cc++;
    }

    // Exposed class methods/variables
    return {
        base: new UintWcap(32 + 3), // + pc, lo, hi

        reset() {
            // Reset processors
            cpu.base.fill(0);
            branched = false;
            pc = 0xbfc00000;
            cc = 0;
        },

        run() {
            // Reset frames
            cc = 0;

            while(!branched) { // Run until Jump/Branch instruction
                step();
            }
            return cc;
        }
    };
};

const cpu = new pseudo.CstrMips();
