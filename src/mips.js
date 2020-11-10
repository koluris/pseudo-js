#define opcode \
    ((code >>> 26) & 0x3f)

#define rs \
    ((code >>> 21) & 0x1f)

#define rt \
    ((code >>> 16) & 0x1f)

#define rd \
    ((code >>> 11) & 0x1f)

#define shamt \
    ((code >>>  6) & 0x1f)

#define imm_u \
    (code & 0xffff)

#define imm_s \
    (SIGN_EXT_16(code))

#define ob \
    (base[rs] + imm_s)

#define b_addr \
    (pc + (imm_s << 2))

#define s_addr \
    ((pc & 0xf0000000) | (code & 0x3ffffff) << 2)

pseudo.CstrMips = function() {
    const base = new Uint32Array(32);
    let pc;

    function step() {
        const code = mem.read.w(pc);
        pc += 4;

        switch(opcode) {
            case 0: // SPECIAL
                switch(code & 0x3f) {
                    case 0: // SLL
                        if (code) { // No operation
                            base[rd] = base[rt] << shamt;
                        }
                        return;

                    case 2: // SRL
                        base[rd] = base[rt] >>> shamt;
                        return;

                    case 8: // JR
                        branch(base[rs]);
                        return;

                    case 36: // AND
                        base[rd] = base[rs] & base[rt];
                        return;

                    case 37: // OR
                        base[rd] = base[rs] | base[rt];
                        return;
                }
                return;

            case 2: // J
                branch(s_addr);
                return;

            case 3: // JAL
                base[31] = pc + 4;
                branch(s_addr);
                return;

            case 4: // BEQ
                if (base[rs] === base[rt]) {
                    branch(b_addr);
                }
                return;

            case 5: // BNE
                if (base[rs] !== base[rt]) {
                    branch(b_addr);
                }
                return;

            case 7: // BGTZ
                if (SIGN_EXT_32(base[rs]) > 0) {
                    branch(b_addr);
                }
                return;

            case 9: // ADDIU
                base[rt] = base[rs] + imm_s;
                return;

            case 10: // SLTI
                base[rt] = SIGN_EXT_32(base[rs]) < imm_s;
                return;

            case 12: // ANDI
                base[rt] = base[rs] & imm_u;
                return;

            case 13: // ORI
                base[rt] = base[rs] | imm_u;
                return;

            case 15: // LUI
                base[rt] = code << 16;
                return;

            case 33: // LH
                base[rt] = SIGN_EXT_16(mem.read.h(ob));
                return;

            case 35: // LW
                base[rt] = mem.read.w(ob);
                return;

            case 36: // LBU
                base[rt] = mem.read.b(ob);
                return;

            case 40: // SB
                mem.write.b(ob, base[rt]);
                return;

            case 41: // SH
                mem.write.h(ob, base[rt]);
                return;

            case 43: // SW
                mem.write.w(ob, base[rt]);
                return;
        }
    }

    function branch(addr) {
        step();
        pc = addr;
    }

    return {
        run() {
            let vblank = 1;
            requestAnimationFrame(cpu.run);
            
            while(vblank) {
                step(false);

                if (vblank++ > 100000) {
                    vblank = 0;
                }
            }
        },

        setpc(addr) {
            pc = addr;
        }
    };
};

const cpu = new pseudo.CstrMips();
