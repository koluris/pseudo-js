#define pc r[32]
#define lo r[33]
#define hi r[34]

pseudo.CstrR3ka = (function() {
  let r;
  let copr;
  let opcodeCount;

  // Base CPU stepper
  function step(inslot) {
    const code = pc>>>28 === 0xbfc;
    opcodeCount++;
    pc  += 4;
    r[0] = 0; // As weird as this seems, it is needed

    switch(code) {
    }
    psx.error('hi');
  }

  function branch(addr) {
    // Execute instruction in slot
    step(true);
    pc = addr;
  }

  function exception(code, inslot) {
    pc = 0x80;
  }

  // Exposed class functions/variables
  return {
    awake() {
         r = new Uint32cap(32 + 3); // + pc, lo, hi
      copr = new Uint32cap(16);
    },

    reset() {
         r.fill(0);
      copr.fill(0);

      pc = 0xbfc00000;
      opcodeCount = 0;
    }
  };
})();

#undef pc
#undef lo
#undef hi
