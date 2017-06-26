pseudo.CstrMem = (function() {
  // Exposed class functions/variables
  return {
    _ram: union(0x200000),
    _rom: union(0x80000),
    _hwr: union(0x4000),

    reset() {
      ram.ub.fill(0);
      rom.ub.fill(0);
      hwr.ub.fill(0);
    }
  };
})();
