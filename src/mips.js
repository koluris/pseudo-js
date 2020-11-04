/* Base structure and authentic idea PSeudo (Credits: Dennis Koluris) */

#define ram  mem.__ram
#define rom  mem.__rom

#define pc base[32]
#define lo base[33]
#define hi base[34]

#define opcode \
    ((code >>> 26) & 0x3f)

#define shamt \
    ((code >>> 6) & 0x1f)

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

// Inline functions for speedup
#define setptr(addr) \
    ptr = addr >>> 20 === 0xbfc ? rom.uw : ram.uw

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

#define opcodeLWx(o, d) \
    base[rt] = (base[rt] & mask[d][ob & 3]) | (mem.read.w(ob & (~(3))) o shift[d][ob & 3])

#define opcodeSWx(o, d) \
    mem.write.w(ob & (~(3)), (base[rt] o shift[d][ob & 3]) | (mem.read.w(ob & (~(3))) & mask[d][ob & 3]))

pseudo.CstrMips = (function() {
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

    // Base + Coprocessor
    const base = new UintWcap(32 + 3); // + pc, lo, hi
    const copr = new UintWcap(16);

    // Cache for expensive calculation
    const power32 = Math.pow(2, 32); // Btw, pure multiplication is faster

    let divOutput;
    let ptr, suspended, opcodeCount, requestAF;

    // Base CPU stepper
    function step(inslot) {
        base[0] = 0; // As weird as this seems, it is needed

        const code = directMemW(ptr, pc);
        opcodeCount++;
        pc += 4;

        switch(opcode) {
            case 0: // SPECIAL
                switch(code & 0x3f) {
                    case 0: // SLL
                        if (code) { // No operation?
                            base[rd] = base[rt] << shamt;
                        }
                        return;

                    case 2: // SRL
                        base[rd] = base[rt] >>> shamt;
                        return;

                    case 3: // SRA
                        base[rd] = SIGN_EXT_32(base[rt]) >> shamt;
                        return;

                    case 4: // SLLV
                        base[rd] = base[rt] << (base[rs] & 31);
                        return;

                    case 6: // SRLV
                        base[rd] = base[rt] >>> (base[rs] & 31);
                        return;

                    case 7: // SRAV
                        base[rd] = SIGN_EXT_32(base[rt]) >> (base[rs] & 31);
                        return;

                    case 9: // JALR
                        base[rd] = pc + 4;

                    case 8: // JR
                        branch(base[rs]);
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
                        base[rd] = hi;
                        return;

                    case 17: // MTHI
                        hi = base[rs];
                        return;

                    case 18: // MFLO
                        base[rd] = lo;
                        return;

                    case 19: // MTLO
                        lo = base[rs];
                        return;

                    case 24: // MULT
                        opcodeMult(SIGN_EXT_32(base[rs]), SIGN_EXT_32(base[rt]));
                        return;

                    case 25: // MULTU
                        opcodeMult(base[rs], base[rt]);
                        return;

                    case 26: // DIV
                        opcodeDiv(SIGN_EXT_32(base[rs]), SIGN_EXT_32(base[rt]));
                        return;

                    case 27: // DIVU
                        opcodeDiv(base[rs], base[rt]);
                        return;

                    case 32: // ADD
                    case 33: // ADDU
                        base[rd] = base[rs] + base[rt];
                        return;

                    case 34: // SUB
                    case 35: // SUBU
                        base[rd] = base[rs] - base[rt];
                        return;

                    case 36: // AND
                        base[rd] = base[rs] & base[rt];
                        return;

                    case 37: // OR
                        base[rd] = base[rs] | base[rt];
                        return;

                    case 38: // XOR
                        base[rd] = base[rs] ^ base[rt];
                        return;

                    case 39: // NOR
                        base[rd] = (~(base[rs] | base[rt]));
                        return;

                    case 42: // SLT
                        base[rd] = SIGN_EXT_32(base[rs]) < SIGN_EXT_32(base[rt]);
                        return;

                    case 43: // SLTU
                        base[rd] = base[rs] < base[rt];
                        return;
                }

                psx.error('Special CPU instruction ' + (code & 0x3f));
                return;

            case 1: // REGIMM
                switch(rt) {
                    case 16: // BLTZAL
                        base[31] = pc + 4;

                    case 0: // BLTZ
                        if (SIGN_EXT_32(base[rs]) <  0) {
                            branch(b_addr);
                        }
                        return;

                    case 17: // BGEZAL
                        base[31] = pc + 4;

                    case 1: // BGEZ
                        if (SIGN_EXT_32(base[rs]) >= 0) {
                            branch(b_addr);
                        }
                        return;
                }

                psx.error('Bcond CPU instruction ' + rt);
                return;

            case 3: // JAL
                base[31] = pc + 4;

            case 2: // J
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

            case 6: // BLEZ
                if (SIGN_EXT_32(base[rs]) <= 0) {
                    branch(b_addr);
                }
                return;

            case 7: // BGTZ
                if (SIGN_EXT_32(base[rs]) > 0) {
                    branch(b_addr);
                }
                return;

            case 8: // ADDI
            case 9: // ADDIU
                base[rt] = base[rs] + imm_s;
                return;

            case 10: // SLTI
                base[rt] = SIGN_EXT_32(base[rs]) < imm_s;
                return;

            case 11: // SLTIU
                base[rt] = base[rs] < imm_u;
                return;

            case 12: // ANDI
                base[rt] = base[rs] & imm_u;
                return;

            case 13: // ORI
                base[rt] = base[rs] | imm_u;
                return;

            case 14: // XORI
                base[rt] = base[rs] ^ imm_u;
                return;

            case 15: // LUI
                base[rt] = code << 16;
                return;

            case 16: // COP0
                switch(rs) {
                    case 0: // MFC0
                        base[rt] = copr[rd];
                        return;

                    case 4: // MTC0
                        copr[rd] = base[rt];
                        return;

                    case 16: // RFE
                        copr[12] = (copr[12] & 0xfffffff0) | ((copr[12] >>> 2) & 0xf);
                        return;
                }

                psx.error('Coprocessor 0 instruction ' + rs);
                return;

            case 18: // COP2
                cop2.execute(code);
                return;

            case 32: // LB
                base[rt] = SIGN_EXT_8(mem.read.b(ob));
                return;

            case 33: // LH
                base[rt] = SIGN_EXT_16(mem.read.h(ob));
                return;

            case 34: // LWL
                opcodeLWx(<<, 0);
                return;

            case 35: // LW
                base[rt] = mem.read.w(ob);
                return;

            case 36: // LBU
                base[rt] = mem.read.b(ob);
                return;

            case 37: // LHU
                base[rt] = mem.read.h(ob);
                return;

            case 38: // LWR
                opcodeLWx(>>>, 1);
                return;

            case 40: // SB
                mem.write.b(ob, base[rt]);
                return;

            case 41: // SH
                mem.write.h(ob, base[rt]);
                return;

            case 42: // SWL
                opcodeSWx(>>>, 2);
                return;

            case 43: // SW
                mem.write.w(ob, base[rt]);
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
        copr[12] = (copr[12] & (~(0x3f))) | ((copr[12] << 2) & 0x3f);
        copr[13] = code;
        copr[14] = pc;

        pc = 0x80;
        setptr(pc);
    }

    function consoleOutput() {
        if (pc === 0xb0) {
            if (base[9] === 59 || base[9] === 61) {
                const char = Text.fromCharCode(base[4] & 0xff).replace(/\n/, '<br/>');
                divOutput.append(char.toUpperCase());
            }
        }
    }

    // Exposed class functions/variables
    return {
        awake(output) {
            divOutput = output;
        },

        reset() {
            // Break emulation loop
            cpu.pause();
            divOutput.text(' ');

            // Reset processors
            base.fill(0);
            copr.fill(0);

            copr[12] = 0x10900000;
            copr[15] = 0x2;

            opcodeCount = 0;
            pc = 0xbfc00000;
            setptr(pc);
        },

        bootstrap() {
            cpu.consoleWrite(MSG_INFO, 'BIOS file has been written to ROM');
            const start = performance.now();

            while(pc !== 0x80030000) {
                step(false);
            }
            const delta = parseFloat(performance.now() - start).toFixed(2);
            cpu.consoleWrite(MSG_INFO, 'Bootstrap completed in ' + delta + ' ms');
        },

        run() {
            suspended = false;
            requestAF = requestAnimationFrame(cpu.run); //setTimeout(cpu.run, 0);

            while(!suspended) { // And u don`t stop!
                step(false);

                if (opcodeCount >= 100) {
                    // Rootcounters, interrupts
                    rootcnt.update(64);
                      cdrom.update();
                    bus.interruptsUpdate();
    
                    // Exceptions
                    if (data32 & mask32) {
                        if ((copr[12] & 0x401) === 0x401) {
                            exception(0x400, false);
                        }
                    }
                    opcodeCount = 0;
                }
            }
        },

        parseExeHeader(header) {
            base[28] = header[2 + 3];
            base[29] = header[2 + 10];
            pc = header[2 + 2];
            setptr(pc);
        },

        writeOK() {
            return !(copr[12] & 0x10000);
        },

        consoleWrite(kind, str) {
            divOutput.append('<div class="' + kind + '"><span>PSeudo:: </span>' + str + '</div>');
        },

        setSuspended() {
            suspended = true;
        },

        setbase(addr, data) {
            base[addr] = data;
        },

        readbase(addr) {
            return base[addr];
        },

        pause() {
            cancelAnimationFrame(requestAF);
            requestAF = undefined;
            //clearTimeout(requestAF);
            suspended = true;
        },

        resume() {
            cpu.run();
        },

        setpc(addr) {
            setptr(addr);
        }
    };
})();

#undef pc
#undef lo
#undef hi

#undef ram
#undef rom
