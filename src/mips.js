#define pc r[32]
#define lo r[33]
#define hi r[34]

pseudo.CstrR3ka = (function() {
  let r, copr; // Base + Coprocessor
  let divMath; // Cache for expensive calculation
  let opcodeCount;

  // Base CPU stepper
  function step(inslot) {
    const code = pc>>>20 === 0xbfc ? ioAccW(mem._rom.uw, pc) : ioAccW(mem._ram.uw, pc);
    opcodeCount++;
    pc  += 4;
    r[0] = 0; // As weird as this seems, it is needed

    switch(opcode) {
      case 0: // SPECIAL
        switch(code&0x3f) {
          case 0: // SLL
            r[rd] = r[rt] << shamt;
            return;
        }
        psx.error('pseudo / Special CPU instruction -> '+(code&0x3f));
        return;

      case 2: // J
        return;

      case 9: // ADDIU
        r[rt] = r[rs] + imms;
        return;

      case 13: // ORI
        r[rt] = r[rs] | immu;
        return;

      case 15: // LUI
        r[rt] = code<<16;
        return;

      case 43: // SW
        mem.write.uw(taddr, r[rt]);
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
