#define pc r[32]
#define lo r[33]
#define hi r[34]

pseudo.CstrR3ka = (function() {
  let r, copr; // Base + Coprocessor
  let divMath; // Cache for expensive calculation
  let opcodeCount;

  // Base CPU stepper
  function step(inslot) {
    const code = pc>>>20 === 0xbfc ? io_acc_w(mem._rom.uw, pc) : io_acc_w(mem._ram.uw, pc);
    opcodeCount++;
    pc  += 4;
    r[0] = 0; // As weird as this seems, it is needed

    switch(opcode) {
      case 0: // SPECIAL
        switch(code&0x3f) {
          case 0: // SLL
            r[rd] = r[rt] << shamt;
            return;

          case 8: // JR
            branch(r[rs]);
            output();
            return;

          case 33: // ADDU
            r[rd] = r[rs] + r[rt];
            return;

          case 37: // OR
            r[rd] = r[rs] | r[rt];
            return;

          case 43: // SLTU
            r[rd] = r[rs] < r[rt];
            return;
        }
        psx.error('pseudo / Special CPU instruction -> '+(code&0x3f));
        return;

      case 2: // J
        branch(s_addr);
        return;

      case 3: // JAL
        r[31] = pc+4;
        branch(s_addr);
        return;

      case 5: // BNE
        if (r[rs] !== r[rt]) {
          branch(b_addr);
        }
        return;

      case 8: // ADDI
        r[rt] = r[rs] + imm_s;
        return;

      case 9: // ADDIU
        r[rt] = r[rs] + imm_s;
        return;

      case 12: // ANDI
        r[rt] = r[rs] & imm_u;
        return;

      case 13: // ORI
        r[rt] = r[rs] | imm_u;
        return;

      case 16: // COP0
        switch (rs) {
          case 4: // MTC0
            copr[rd] = r[rt];
            return;
        }
        psx.error('pseudo / Coprocessor 0 CPU instruction -> '+rs);
        return

      case 15: // LUI
        r[rt] = code<<16;
        return;

      case 35: // LW
        r[rt] = mem.read.w(ob);
        return;

      case 40: // SB
        mem.write.b(ob, r[rt]);
        return;

      case 41: // SH
        mem.write.h(ob, r[rt]);
        return;

      case 43: // SW
        mem.write.w(ob, r[rt]);
        return;
    }
    psx.error('pseudo / Basic CPU instruction -> '+opcode);
  }

  function branch(addr) {
    // Execute instruction in slot
    step(true);
    pc = addr;

    // Rootcounters, interrupts
  }

  function exception(code, inslot) {
    pc = 0x80;
  }

  function output() {
    switch(pc) {
      case 0xa:
        psx.error('Output class -> '+hex(pc));
        break;

      case 0xb:
        psx.error('Output class -> '+hex(pc));
        break;
    }
  }

  // Exposed class functions/variables
  return {
    awake() {
         r = new UintWcap(32 + 3); // + pc, lo, hi
      copr = new UintWcap(16);

      // Cache
      divMath = Math.pow(32, 2); // Btw, pure multiplication is faster
    },

    reset() {
         r.fill(0);
      copr.fill(0);

      pc = 0xbfc00000;
      opcodeCount = 0;
    },

    bootstrap() {
      while (pc !== 0x80030000) {
        step(false);
      }
      psx.error('pseudo / Bootstrap completed');
    },

    run() {
      // requestAnimationFrame loop
    }
  };
})();

#undef pc
#undef lo
#undef hi
