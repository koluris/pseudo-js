pseudo.CstrMips = function() {
    let base = new Uint32Array(32);
    let pc, code;

    function step() {
        code = mem.read.w(pc);
        pc += 4;

        let opcode = (code >>> 26) & 0x3f;
        let rs     = (code >>> 21) & 0x1f;
        let rt     = (code >>> 16) & 0x1f;
        let rd     = (code >>> 11) & 0x1f;
        let shamt  = (code >>>  6) & 0x1f;
        let imm_u  = (code & 0xffff);
        let imm_s  = (SIGN_EXT_16(code));
        let ob     = (base[rs] + imm_s);
        let b_addr = (pc + (imm_s << 2));
        let s_addr = (pc & 0xf0000000) | (code & 0x3ffffff) << 2;

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
            let counter = 0;

            while(true) {
                step();

                if (counter++ > 100000) {
                    break;
                }
            }
            requestAnimationFrame(cpu.run);
        },

        setpc(addr) {
            pc = addr;
        }
    };
};

let cpu = new pseudo.CstrMips();
