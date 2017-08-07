#define ram  mem.__ram
#define rom  mem.__rom

#define pc r[32]
#define lo r[33]
#define hi r[34]

// Inline functions for speedup
#define setptr(addr)\
  ptr = addr>>>20 === 0xbfc ? rom.uw : ram.uw

#define opcodeMult(a, b)\
  temp = a * b;\
  \
  lo = temp&0xffffffff;\
  hi = Math.floor(temp/power32)

#define opcodeDiv(a, b)\
  if (b) {\
    lo = a / b;\
    hi = a % b;\
  }

#define opcodeLWx(o, d)\
  temp = ob;\
  r[rt] = (r[rt]&mask[d][ob&3])|(mem.read.w(ob&~3) o shift[d][ob&3])

#define opcodeSWx(o, d)\
  temp = ob;\
  mem.write.w(ob&~3, (r[rt] o shift[d][ob&3])|(mem.read.w(ob&~3)&mask[d][ob&3]))

#define exception(code, inslot)\
  copr[12] = (copr[12]&0xffffffc0)|((copr[12]<<2)&0x3f);\
  copr[13] = code;\
  copr[14] = pc;\
  \
  pc = 0x80;\
  setptr(pc)

#define print()\
  if (pc === 0xb0) {\
    if (r[9] === 59 || r[9] === 61) {\
      var char = Chars.fromCharCode(r[4]&0xff).replace(/\n/, '<br/>');\
      divOutput.append(char.toUpperCase());\
    }\
  }

pseudo.CstrMips = (function() {
  var divOutput;
  var bp, opcodeCount, requestAF, ptr, temp;

  // Base + Coprocessor
  var    r = new UintWcap(32 + 3); // + pc, lo, hi
  var copr = new UintWcap(16);

  // Cache for expensive calculation
  var power32 = Math.pow(2, 32); // Btw, pure multiplication is faster

  var mask = [
    [0x00ffffff, 0x0000ffff, 0x000000ff, 0x00000000],
    [0x00000000, 0xff000000, 0xffff0000, 0xffffff00],
    [0xffffff00, 0xffff0000, 0xff000000, 0x00000000],
    [0x00000000, 0x000000ff, 0x0000ffff, 0x00ffffff],
  ];

  var shift = [
    [0x18, 0x10, 0x08, 0x00],
    [0x00, 0x08, 0x10, 0x18],
    [0x18, 0x10, 0x08, 0x00],
    [0x00, 0x08, 0x10, 0x18],
  ];

  // Base CPU stepper
  function step(inslot) {
    var code = directMemW(ptr, pc); pc += 4;
    opcodeCount++;
    r[0] = 0; // As weird as this seems, it is needed

    switch(opcode) {
      case 0: // SPECIAL
        switch(code&0x3f) {
          case 0: // SLL
            r[rd] = r[rt] << shamt;
            return;

          case 2: // SRL
            r[rd] = r[rt] >>> shamt;
            return;

          case 3: // SRA
            r[rd] = SIGN_EXT_32(r[rt]) >> shamt;
            return;

          case 4: // SLLV
            r[rd] = r[rt] << (r[rs]&0x1f);
            return;

          case 6: // SRLV
            r[rd] = r[rt] >>> (r[rs]&0x1f);
            return;

          case 7: // SRAV
            r[rd] = SIGN_EXT_32(r[rt]) >> (r[rs]&0x1f);
            return;

          case 8: // JR
            branch(r[rs]);
            setptr(pc);
            print();
            return;

          case 9: // JALR
            r[rd] = pc+4;
            branch(r[rs]);
            setptr(pc);
            return;

          case 12: // SYSCALL
            pc-=4;
            exception(0x20, inslot);
            return;

          case 13: // BREAK
            return;

          case 16: // MFHI
            r[rd] = hi;
            return;

          case 17: // MTHI
            hi = r[rs];
            return;

          case 18: // MFLO
            r[rd] = lo;
            return;

          case 19: // MTLO
            lo = r[rs];
            return;

          case 24: // MULT
            opcodeMult(SIGN_EXT_32(r[rs]), SIGN_EXT_32(r[rt]));
            return;

          case 25: // MULTU
            opcodeMult(r[rs], r[rt]);
            return;

          case 26: // DIV
            opcodeDiv(SIGN_EXT_32(r[rs]), SIGN_EXT_32(r[rt]));
            return;

          case 27: // DIVU
            opcodeDiv(r[rs], r[rt]);
            return;

          case 32: // ADD
          case 33: // ADDU
            r[rd] = r[rs] + r[rt];
            return;

          case 34: // SUB
          case 35: // SUBU
            r[rd] = r[rs] - r[rt];
            return;

          case 36: // AND
            r[rd] = r[rs] & r[rt];
            return;

          case 37: // OR
            r[rd] = r[rs] | r[rt];
            return;

          case 38: // XOR
            r[rd] = r[rs] ^ r[rt];
            return;

          case 39: // NOR
            r[rd] = ~(r[rs] | r[rt]);
            return;

          case 42: // SLT
            r[rd] = SIGN_EXT_32(r[rs]) < SIGN_EXT_32(r[rt]);
            return;

          case 43: // SLTU
            r[rd] = r[rs] < r[rt];
            return;
        }
        psx.error('Special CPU instruction '+(code&0x3f));
        return;

      case 1: // REGIMM
        switch(rt) {
          case 0: // BLTZ
            if (SIGN_EXT_32(r[rs]) < 0) {
              branch(b_addr);
            }
            return;

          case 1: // BGEZ
            if (SIGN_EXT_32(r[rs]) >= 0) {
              branch(b_addr);
            }
            return;

          case 17: // BGEZAL
            r[31] = pc+4;
            if (SIGN_EXT_32(r[rs]) >= 0) {
              branch(b_addr);
            }
            return;
        }
        psx.error('Bcond CPU instruction '+rt);
        return;

      case 2: // J
        branch(s_addr);
        return;

      case 3: // JAL
        r[31] = pc+4;
        branch(s_addr);
        return;

      case 4: // BEQ
        if (r[rs] === r[rt]) {
          branch(b_addr);
        }
        return;

      case 5: // BNE
        if (r[rs] !== r[rt]) {
          branch(b_addr);
        }
        return;

      case 6: // BLEZ
        if (SIGN_EXT_32(r[rs]) <= 0) {
          branch(b_addr);
        }
        return;

      case 7: // BGTZ
        if (SIGN_EXT_32(r[rs]) > 0) {
          branch(b_addr);
        }
        return;

      case 8: // ADDI
      case 9: // ADDIU
        r[rt] = r[rs] + imm_s;
        return;

      case 10: // SLTI
        r[rt] = SIGN_EXT_32(r[rs]) < imm_s;
        return;

      case 11: // SLTIU
        r[rt] = r[rs] < imm_u;
        return;

      case 12: // ANDI
        r[rt] = r[rs] & imm_u;
        return;

      case 13: // ORI
        r[rt] = r[rs] | imm_u;
        return;

      case 14: // XORI
        r[rt] = r[rs] ^ imm_u;
        return;

      case 15: // LUI
        r[rt] = code<<16;
        return;

      case 16: // COP0
        switch(rs) {
          case 0: // MFC0
            r[rt] = copr[rd];
            return;

          case 4: // MTC0
            copr[rd] = r[rt];
            return;

          case 16: // RFE
            copr[12] = (copr[12]&0xfffffff0) | ((copr[12]>>>2)&0xf);
            return;
        }
        psx.error('Coprocessor 0 instruction '+rs);
        return;

      case 18: // COP2
        cop2.execute(code);
        return;

      case 32: // LB
        r[rt] = SIGN_EXT_8(mem.read.b(ob));
        return;

      case 33: // LH
        r[rt] = SIGN_EXT_16(mem.read.h(ob));
        return;

      case 34: // LWL
        opcodeLWx(<<, 0);
        return;

      case 35: // LW
        r[rt] = mem.read.w(ob);
        return;

      case 36: // LBU
        r[rt] = mem.read.b(ob);
        return;

      case 37: // LHU
        r[rt] = mem.read.h(ob);
        return;

      case 38: // LWR
        opcodeLWx(>>, 1);
        return;

      case 40: // SB
        mem.write.b(ob, r[rt]);
        return;

      case 41: // SH
        mem.write.h(ob, r[rt]);
        return;

      case 42: // SWL
        opcodeSWx(>>, 2);
        return;

      case 43: // SW
        mem.write.w(ob, r[rt]);
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
    psx.error('Basic CPU instruction '+opcode);
  }

  function branch(addr) {
    // Execute instruction in slot
    step(true);
    pc = addr;

    if (opcodeCount >= PSX_CYCLE) {
      // Rootcounters, interrupts
      rootcnt.update();
        cdrom.update();
      bus.interruptsUpdate();

      // Exceptions
      if (data32&mask32) {
        if ((copr[12]&0x401) === 0x401) {
          exception(0x400, false);
        }
      }
      opcodeCount %= PSX_CYCLE;
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

      // Reset processors
      ioZero(r);
      ioZero(copr);

      copr[12] = 0x10900000;
      copr[15] = 0x2;

      opcodeCount = 0;
      pc = 0xbfc00000;
      setptr(pc);

      // Clear console out
      divOutput.text(' ');

      // BIOS bootstrap
      cpu.consoleWrite(MSG_INFO, 'BIOS file has been written to ROM');
      var start = performance.now();

      while (pc !== 0x80030000) {
        step(false);
      }
      var delta = parseFloat(performance.now()-start).toFixed(2);
      cpu.consoleWrite(MSG_INFO, 'Bootstrap completed in '+delta+' ms');
    },

    run() {
      bp = false;
      requestAF = requestAnimationFrame(cpu.run);

      while (!bp) { // And u don`t stop!
        step(false);
      }
    },

    exeHeader(hdr) {
      pc    = hdr[2+ 2];
      r[28] = hdr[2+ 3];
      r[29] = hdr[2+10];
    },

    writeOK() {
      return !(copr[12]&0x10000);
    },

    consoleWrite(kind, str) {
      divOutput.append('<div class="'+kind+'"><span>PSeudo:: </span>'+str+'</div>');
    },

    setbp() {
      bp = true;
    },

    setbase(addr, data) {
      r[addr] = data;
    },

    readbase(addr) {
      return r[addr];
    },

    pause() {
      cancelAnimationFrame(requestAF);
      requestAF = undefined;
      bp = true;
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
