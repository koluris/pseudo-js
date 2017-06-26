#define pc r[33]
#define lo r[34]
#define hi r[35]

pseudo.CstrR3ka = (function() {
  const r;
  const copr;

  step(inslot) {
    const code = pc>>>28 === 0xbfc;
    pc  += 4;
    r[0] = 0;

    switch(code) {
    }
    psx.error('hi');
  }

  branch(addr) {
    // Execute instruction in slot
    step(true);
    pc = addr;
  }

  exception(code, inslot) {
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
    }
  };
})();

#undef pc
#undef lo
#undef hi
