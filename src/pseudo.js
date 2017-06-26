pseudo.CstrMain = (function() {
  // Exposed class functions/variables
  return {
    awake() {
      mips.awake();
    },

    reset() {
      // Reset all emulator components
      mem .reset();
      r3ka.reset();
    },

    error(out) {
      throw new Error(out);
    }
  };
})();
