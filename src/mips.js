/* Base structure and authentic idea PSeudo (Credits: Dennis Koluris) */

#define pc cpu.base[32]

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
    // Base + Coprocessor
    const base = new UintWcap(32 + 3); // + pc, lo, hi

    let ptr, suspended, requestAF;

    // Base CPU stepper
    function step() {
        //cpu.base[0] = 0; // As weird as this seems, it is needed
        const code = mem.read.w(pc);
        pc += 4;

        switch(opcode) {
            case 0: // SPECIAL
                switch(code & 0x3f) {
                    case 0: // SLL
                        if (code) { // No operation?
                            cpu.base[rd] = cpu.base[rt] << shamt;
                        }
                        return;

                    case 2: // SRL
                        cpu.base[rd] = cpu.base[rt] >>> shamt;
                        return;

                    case 8: // JR
                        branch(cpu.base[rs]);
                        return;

                    case 36: // AND
                        cpu.base[rd] = cpu.base[rs] & cpu.base[rt];
                        return;

                    case 37: // OR
                        cpu.base[rd] = cpu.base[rs] | cpu.base[rt];
                        return;
                }

                psx.error('Special CPU instruction ' + (code & 0x3f));
                return;

            case 2: // J
                branch(s_addr);
                return;

            case 3: // JAL
                cpu.base[31] = pc + 4;
                branch(s_addr);
                return;

            case 4: // BEQ
                if (cpu.base[rs] === cpu.base[rt]) {
                    branch(b_addr);
                }
                return;

            case 5: // BNE
                if (cpu.base[rs] !== cpu.base[rt]) {
                    branch(b_addr);
                }
                return;

            case 7: // BGTZ
                if (SIGN_EXT_32(cpu.base[rs]) > 0) {
                    branch(b_addr);
                }
                return;

            case 9: // ADDIU
                cpu.base[rt] = cpu.base[rs] + imm_s;
                return;

            case 10: // SLTI
                cpu.base[rt] = SIGN_EXT_32(cpu.base[rs]) < imm_s;
                return;

            case 12: // ANDI
                cpu.base[rt] = cpu.base[rs] & imm_u;
                return;

            case 13: // ORI
                cpu.base[rt] = cpu.base[rs] | imm_u;
                return;

            case 15: // LUI
                cpu.base[rt] = code << 16;
                return;

            case 33: // LH
                cpu.base[rt] = SIGN_EXT_16(mem.read.h(ob));
                return;

            case 35: // LW
                cpu.base[rt] = mem.read.w(ob);
                return;

            case 36: // LBU
                cpu.base[rt] = mem.read.b(ob);
                return;

            case 40: // SB
                mem.write.b(ob, cpu.base[rt]);
                return;

            case 41: // SH
                mem.write.h(ob, cpu.base[rt]);
                return;

            case 43: // SW
                mem.write.w(ob, cpu.base[rt]);
                return;
        }

        psx.error('Basic CPU instruction ' + opcode);
    }

    function branch(addr) {
        // Execute instruction in slot
        step();
        pc = addr;
    }

    // Exposed class functions/variables
    return {
        base: new UintWcap(32 + 1),

        reset() {
            // Reset processors
            cpu.base.fill(0);
            pc = 0xbfc00000;
        },

        run() {
            suspended = false;
            requestAF = requestAnimationFrame(cpu.run);
            
            let vbk = 0;

            while(!suspended) {
                step(false);

                if (vbk++ >= 100000) { vbk = 0;
                    suspended = true;
                }
            }
        },

        parseExeHeader(header) {
            cpu.base[28] = header[2 + 3];
            cpu.base[29] = header[2 + 10];
            pc = header[2 + 2];
        }
    };
};

#undef pc
#undef lo
#undef hi

const cpu = new pseudo.CstrMips();
