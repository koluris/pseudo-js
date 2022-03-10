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
    function step(inslot) {
        const code  = mem.read.w(pc);
        pc += 4;

        switch(opcode) {
            case 0: // SPECIAL
                switch(code & 0x3f) {
                    case 0: // SLL
                        if (code) { // No operation
                            cpu.base[rd] = cpu.base[rt] << shamt;
                        }
                        break;

                    case 37: // OR
                        cpu.base[rd] = cpu.base[rs] | cpu.base[rt];
                        break;

                    default:
                        psx.error('Special CPU instruction ' + (code & 0x3f));
                        break;
                }
                break;

            case 2: // J
                branch(s_addr);
                break;

            case 5: // BNE
                if (cpu.base[rs] !== cpu.base[rt]) {
                    branch(b_addr);
                }
                break;

            case 8: // ADDI
            case 9: // ADDIU
                cpu.base[rt] = cpu.base[rs] + imm_s;
                break;

            case 13: // ORI
                cpu.base[rt] = cpu.base[rs] | imm_u;
                break;

            case 15: // LUI
                cpu.base[rt] = code << 16;
                break;

            case 16: // COP0
                switch(rs) {
                    case 4: // MTC0
                        cpu.copr[rd] = cpu.base[rt];
                        break;

                    default:
                        psx.error('Coprocessor 0 instruction ' + rs);
                        break;
                }
                break;

            case 43: // SW
                mem.write.w(ob, cpu.base[rt]);
                break;

            default:
                psx.error('Basic CPU instruction ' + opcode);
                break;
        }

        cpu.base[0] = 0;
        cc++;
    }

    function branch(addr) {
        // Execute instruction in slot
        branched = true;
        step(true);
        pc = addr;
    }

    // Exposed class methods/variables
    return {
        base: new UintWcap(32 + 3), // + pc, lo, hi
        copr: new UintWcap(16),

        reset() {
            // Reset processors
            cpu.base.fill(0);
            cpu.copr.fill(0);

            cpu.copr[12] = 0x10900000;
            cpu.copr[15] = 0x2;

            pc = 0xbfc00000;
        },

        run() {
            // Next code block
            branched = false;
            cc = 0;

            while(!branched) { // Run until Jump/Branch instruction
                step(false);
            }
            return cc;
        }
    };
};

#undef pc
#undef lo
#undef hi

const cpu = new pseudo.CstrMips();
