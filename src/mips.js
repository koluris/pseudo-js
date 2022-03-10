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

// Inline functions for speedup
#define opcodeMult(a, b) \
    { \
        const temp = a * b; \
        \
        lo = temp & 0xffffffff; \
        hi = Math.floor(temp / power32); \
    }

#define opcodeDiv(a, b) \
    if (b) { \
        lo = a / b; \
        hi = a % b; \
    }

#define opcodeSWx(o, d) \
{ \
    const temp = ob; \
    mem.write.w(temp & (~(3)), (cpu.base[rt] o shift[d][temp & 3]) | (mem.read.w(temp & (~(3))) & mask[d][temp & 3])); \
}

#define opcodeLWx(o, d) \
{ \
    const temp = ob; \
    cpu.base[rt] = (cpu.base[rt] & mask[d][temp & 3]) | (mem.read.w(temp & (~(3))) o shift[d][temp & 3]); \
}

pseudo.CstrMips = function() {
    // SW & LW tables
    const mask = [
        [0x00ffffff, 0x0000ffff, 0x000000ff, 0x00000000],
        [0x00000000, 0xff000000, 0xffff0000, 0xffffff00],
        [0xffffff00, 0xffff0000, 0xff000000, 0x00000000],
        [0x00000000, 0x000000ff, 0x0000ffff, 0x00ffffff],
    ];

    const shift = [
        [0x18, 0x10, 0x08, 0x00],
        [0x00, 0x08, 0x10, 0x18],
        [0x18, 0x10, 0x08, 0x00],
        [0x00, 0x08, 0x10, 0x18],
    ];

    let branched, cc;

    // Base CPU stepper
    function step(inslot) {
        const code = mem.read.w(pc);
        pc += 4;

        switch(opcode) {
            case 0: // SPECIAL
                switch(code & 0x3f) {
                    case 0: // SLL
                        if (code) { // No operation
                            cpu.base[rd] = cpu.base[rt] << shamt;
                        }
                        break;

                    case 2: // SRL
                        cpu.base[rd] = cpu.base[rt] >>> shamt;
                        break;

                    case 3: // SRA
                        cpu.base[rd] = SIGN_EXT_32(cpu.base[rt]) >> shamt;
                        break;

                    case 9: // JALR
                        cpu.base[rd] = pc + 4;

                    case 8: // JR
                        branch(cpu.base[rs]); // TODO: Verbose
                        break;

                    case 16: // MFHI
                        cpu.base[rd] = hi;
                        break;

                    case 18: // MFLO
                        cpu.base[rd] = lo;
                        break;

                    case 26: // DIV
                        opcodeDiv(SIGN_EXT_32(cpu.base[rs]), SIGN_EXT_32(cpu.base[rt]));
                        break;

                    case 27: // DIVU
                        opcodeDiv(cpu.base[rs], cpu.base[rt]);
                        break;

                    case 32: // ADD
                    case 33: // ADDU
                        cpu.base[rd] = cpu.base[rs] + cpu.base[rt];
                        break;

                    case 35: // SUBU
                        cpu.base[rd] = cpu.base[rs] - cpu.base[rt];
                        break;

                    case 36: // AND
                        cpu.base[rd] = cpu.base[rs] & cpu.base[rt];
                        break;

                    case 37: // OR
                        cpu.base[rd] = cpu.base[rs] | cpu.base[rt];
                        break;

                    case 42: // SLT
                        cpu.base[rd] = SIGN_EXT_32(cpu.base[rs]) < SIGN_EXT_32(cpu.base[rt]);
                        break;

                    case 43: // SLTU
                        cpu.base[rd] = cpu.base[rs] < cpu.base[rt];
                        break;

                    default:
                        psx.error('Special CPU instruction ' + (code & 0x3f));
                        break;
                }
                break;

            case 1: // REGIMM
                switch(rt) {
                    case 0: // BLTZ
                        if (SIGN_EXT_32(cpu.base[rs]) <  0) {
                            branch(b_addr);
                        }
                        break;

                    case 1: // BGEZ
                        if (SIGN_EXT_32(cpu.base[rs]) >= 0) {
                            branch(b_addr);
                        }
                        break;

                    default:
                        psx.error('Bcond CPU instruction ' + rt);
                        break;
                }
                break;

            case 3: // JAL
                cpu.base[31] = pc + 4;

            case 2: // J
                branch(s_addr);
                break;

            case 4: // BEQ
                if (cpu.base[rs] === cpu.base[rt]) {
                    branch(b_addr);
                }
                break;

            case 5: // BNE
                if (cpu.base[rs] !== cpu.base[rt]) {
                    branch(b_addr);
                }
                break;

            case 6: // BLEZ
                if (SIGN_EXT_32(cpu.base[rs]) <= 0) {
                    branch(b_addr);
                }
                break;

            case 7: // BGTZ
                if (SIGN_EXT_32(cpu.base[rs]) > 0) {
                    branch(b_addr);
                }
                break;

            case 8: // ADDI
            case 9: // ADDIU
                cpu.base[rt] = cpu.base[rs] + imm_s;
                break;

            case 10: // SLTI
                cpu.base[rt] = SIGN_EXT_32(cpu.base[rs]) < imm_s;
                break;

            case 11: // SLTIU
                cpu.base[rt] = cpu.base[rs] < imm_u;
                break;

            case 12: // ANDI
                cpu.base[rt] = cpu.base[rs] & imm_u;
                break;

            case 13: // ORI
                cpu.base[rt] = cpu.base[rs] | imm_u;
                break;

            case 15: // LUI
                cpu.base[rt] = code << 16;
                break;

            case 16: // COP0
                switch(rs) {
                    case 0: // MFC0
                        cpu.base[rt] = cpu.copr[rd];
                        break;

                    case 4: // MTC0
                        cpu.copr[rd] = cpu.base[rt];
                        break;

                    default:
                        psx.error('Coprocessor 0 instruction ' + rs);
                        break;
                }
                break;

            case 32: // LB
                cpu.base[rt] = SIGN_EXT_8(mem.read.b(ob));
                cc += 3;
                break;

            case 35: // LW
                cpu.base[rt] = mem.read.w(ob);
                cc += 3;
                break;

            case 36: // LBU
                cpu.base[rt] = mem.read.b(ob);
                cc += 3;
                break;

            case 40: // SB
                mem.write.b(ob, cpu.base[rt]);
                break;

            case 41: // SH
                mem.write.h(ob, cpu.base[rt]);
                break;

            case 42: // SWL
                opcodeSWx(>>>, 2);
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

        bootstrap() {
            const start = performance.now();

            while(pc !== 0x80030000) {
                step(false);
            }
            const delta = parseFloat(performance.now() - start).toFixed(2);
            console.info('Bootstrap completed in ' + delta + ' ms');
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
