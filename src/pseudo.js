#define pc r[33]
#define lo r[34]
#define hi r[35]

pseudo.CstrMain = (function() { // Start
  const r;
  const copr;

  return {
    init() {
         r = new Uint32cap(36); // + lo, hi, pc
      copr = new Uint32cap(16);

      // BIOS
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
