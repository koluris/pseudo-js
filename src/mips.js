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
      case 13: //
        return;

      case 15: // LUI
        r[rt] = code<<16;
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
      psx.error('psinex / Bootstrap completed');
    },

    run() {
      // requestAnimationFrame loop
    }
  };
})();

#undef pc
#undef lo
#undef hi
