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
#define setptr(addr) \
    ptr = addr >>> 20 === 0xbfc ? mem.rom.uw : mem.ram.uw

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

    // Cache for expensive calculation
    const power32 = Math.pow(2, 32); 
    let ptr, suspended, requestAF;

    // Base CPU stepper
    function step(inslot) {
        const code  = directMemW(ptr, pc);
        pc += 4;

        // Needed
        cpu.base[0] = 0;

        switch(opcode) {
            case 0: // SPECIAL
                switch(code & 0x3f) {
                    case 0: // SLL
                        if (code) { // No operation
                            cpu.base[rd] = cpu.base[rt] << shamt;
                        }
                        return;

                    case 2: // SRL
                        cpu.base[rd] = cpu.base[rt] >>> shamt;
                        return;

                    case 3: // SRA
                        cpu.base[rd] = SIGN_EXT_32(cpu.base[rt]) >> shamt;
                        return;

                    case 4: // SLLV
                        cpu.base[rd] = cpu.base[rt] << (cpu.base[rs] & 31);
                        return;

                    case 6: // SRLV
                        cpu.base[rd] = cpu.base[rt] >>> (cpu.base[rs] & 31);
                        return;

                    case 7: // SRAV
                        cpu.base[rd] = SIGN_EXT_32(cpu.base[rt]) >> (cpu.base[rs] & 31);
                        return;

                    case 9: // JALR
                        cpu.base[rd] = pc + 4;

                    case 8: // JR
                        branch(cpu.base[rs]);
                        setptr(pc);
                        consoleOutput();
                        return;

                    case 12: // SYSCALL
                        pc -= 4;
                        exception(0x20, inslot);
                        return;

                    case 13: // BREAK
                        return;

                    case 16: // MFHI
                        cpu.base[rd] = hi;
                        return;

                    case 17: // MTHI
                        hi = cpu.base[rs];
                        return;

                    case 18: // MFLO
                        cpu.base[rd] = lo;
                        return;

                    case 19: // MTLO
                        lo = cpu.base[rs];
                        return;

                    case 24: // MULT
                        opcodeMult(SIGN_EXT_32(cpu.base[rs]), SIGN_EXT_32(cpu.base[rt]));
                        return;

                    case 25: // MULTU
                        opcodeMult(cpu.base[rs], cpu.base[rt]);
                        return;

                    case 26: // DIV
                        opcodeDiv(SIGN_EXT_32(cpu.base[rs]), SIGN_EXT_32(cpu.base[rt]));
                        return;

                    case 27: // DIVU
                        opcodeDiv(cpu.base[rs], cpu.base[rt]);
                        return;

                    case 32: // ADD
                    case 33: // ADDU
                        cpu.base[rd] = cpu.base[rs] + cpu.base[rt];
                        return;

                    case 34: // SUB
                    case 35: // SUBU
                        cpu.base[rd] = cpu.base[rs] - cpu.base[rt];
                        return;

                    case 36: // AND
                        cpu.base[rd] = cpu.base[rs] & cpu.base[rt];
                        return;

                    case 37: // OR
                        cpu.base[rd] = cpu.base[rs] | cpu.base[rt];
                        return;

                    case 38: // XOR
                        cpu.base[rd] = cpu.base[rs] ^ cpu.base[rt];
                        return;

                    case 39: // NOR
                        cpu.base[rd] = (~(cpu.base[rs] | cpu.base[rt]));
                        return;

                    case 42: // SLT
                        cpu.base[rd] = SIGN_EXT_32(cpu.base[rs]) < SIGN_EXT_32(cpu.base[rt]);
                        return;

                    case 43: // SLTU
                        cpu.base[rd] = cpu.base[rs] < cpu.base[rt];
                        return;
                }

                psx.error('Special CPU instruction ' + (code & 0x3f));
                return;

            case 1: // REGIMM
                switch(rt) {
                    case 16: // BLTZAL
                        cpu.base[31] = pc + 4;

                    case 0: // BLTZ
                        if (SIGN_EXT_32(cpu.base[rs]) <  0) {
                            branch(b_addr);
                        }
                        return;

                    case 17: // BGEZAL
                        cpu.base[31] = pc + 4;

                    case 1: // BGEZ
                        if (SIGN_EXT_32(cpu.base[rs]) >= 0) {
                            branch(b_addr);
                        }
                        return;
                }

                psx.error('Bcond CPU instruction ' + rt);
                return;

            case 3: // JAL
                cpu.base[31] = pc + 4;

            case 2: // J
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

            case 6: // BLEZ
                if (SIGN_EXT_32(cpu.base[rs]) <= 0) {
                    branch(b_addr);
                }
                return;

            case 7: // BGTZ
                if (SIGN_EXT_32(cpu.base[rs]) > 0) {
                    branch(b_addr);
                }
                return;

            case 8: // ADDI
            case 9: // ADDIU
                cpu.base[rt] = cpu.base[rs] + imm_s;
                return;

            case 10: // SLTI
                cpu.base[rt] = SIGN_EXT_32(cpu.base[rs]) < imm_s;
                return;

            case 11: // SLTIU
                cpu.base[rt] = cpu.base[rs] < imm_u;
                return;

            case 12: // ANDI
                cpu.base[rt] = cpu.base[rs] & imm_u;
                return;

            case 13: // ORI
                cpu.base[rt] = cpu.base[rs] | imm_u;
                return;

            case 14: // XORI
                cpu.base[rt] = cpu.base[rs] ^ imm_u;
                return;

            case 15: // LUI
                cpu.base[rt] = code << 16;
                return;

            case 16: // COP0
                switch(rs) {
                    case 0: // MFC0
                        cpu.base[rt] = cpu.copr[rd];
                        return;

                    case 4: // MTC0
                        cpu.copr[rd] = cpu.base[rt];
                        return;

                    case 16: // RFE
                        cpu.copr[12] = (cpu.copr[12] & 0xfffffff0) | ((cpu.copr[12] >>> 2) & 0xf);
                        return;
                }

                psx.error('Coprocessor 0 instruction ' + rs);
                return;

            case 18: // COP2
                cop2.execute(code);
                return;

            case 32: // LB
                cpu.base[rt] = SIGN_EXT_8(mem.read.b(ob));
                return;

            case 33: // LH
                cpu.base[rt] = SIGN_EXT_16(mem.read.h(ob));
                return;

            case 34: // LWL
                opcodeLWx(<<, 0);
                return;

            case 35: // LW
                cpu.base[rt] = mem.read.w(ob);
                return;

            case 36: // LBU
                cpu.base[rt] = mem.read.b(ob);
                return;

            case 37: // LHU
                cpu.base[rt] = mem.read.h(ob);
                return;

            case 38: // LWR
                opcodeLWx(>>>, 1);
                return;

            case 40: // SB
                mem.write.b(ob, cpu.base[rt]);
                return;

            case 41: // SH
                mem.write.h(ob, cpu.base[rt]);
                return;

            case 42: // SWL
                opcodeSWx(>>>, 2);
                return;

            case 43: // SW
                mem.write.w(ob, cpu.base[rt]);
                return;

            case 46: // SWR
                opcodeSWx(<<, 3);
                return;

            case 50: // LWC2
                cop2.opcodeMTC2(rt, mem.read.w(ob));
                return;

            case 58: // SWC2
                mem.write.w(ob, cop2.opcodeMFC2(rt));
                return;
        }

        psx.error('Basic CPU instruction ' + opcode);
    }

    function branch(addr) {
        // Execute instruction in slot
        step(true);
        pc = addr;
    }

    function exception(code, inslot) {
        cpu.copr[12] = (cpu.copr[12] & (~(0x3f))) | ((cpu.copr[12] << 2) & 0x3f);
        cpu.copr[13] = code;
        cpu.copr[14] = pc;

        pc = 0x80;
        setptr(pc);
    }

    function consoleOutput() {
        if (pc === 0xb0) {
            if (cpu.base[9] === 59 || cpu.base[9] === 61) {
                psx.consoleKernel(cpu.base[4] & 0xff);
            }
        }
    }

    // Exposed class functions/variables
    return {
        base: new UintWcap(32 + 3), // + pc, lo, hi
        copr: new UintWcap(16),

        reset() {
            // Break emulation loop
            cpu.pause();

            // Reset processors
            cpu.base.fill(0);
            cpu.copr.fill(0);

            cpu.copr[12] = 0x10900000;
            cpu.copr[15] = 0x2;

            pc = 0xbfc00000;
            setptr(pc);
        },

        bootstrap() {
            psx.consoleInformation(MSG_INFO, 'BIOS file has been written to ROM');
            const start = performance.now();

            while(pc !== 0x80030000) {
                step(false);
            }
            const delta = parseFloat(performance.now() - start).toFixed(2);
            psx.consoleInformation(MSG_INFO, 'Bootstrap completed in ' + delta + ' ms');
        },

        run() {
            suspended = false;

            while(!suspended) {
                for (let i = 0; i < 100; i++) {
                    step(false);
                }

                // Tick psx
                rootcnt.update(64);
                  cdrom.update();
                    bus.update();

                // Skip exceptions for GTE`s sake
                if ((directMemW(ptr, pc) >>> 26) === 0x12) {
                    continue;
                }

                if (data32 & mask32) {
                    if ((cpu.copr[12] & 0x401) === 0x401) {
                        exception(0x400, false);
                    }
                }
            }
            requestAF = setTimeout(cpu.run, 0);
        },

        parseExeHeader(header) {
            cpu.base[28] = header[2 + 3];
            cpu.base[29] = header[2 + 10];
            pc = header[2 + 2];
            setptr(pc);
        },

        setSuspended() {
            suspended = true;
        },

        pause() {
            //cancelAnimationFrame(requestAF);
            clearTimeout(requestAF);
            requestAF = undefined;
            suspended = true;
        },

        resume() {
            cpu.run();
        },

        setpc(addr) {
            setptr(addr);
        }
    };
};

#undef pc
#undef lo
#undef hi

const cpu = new pseudo.CstrMips();
