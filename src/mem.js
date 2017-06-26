#define ram mem._ram
#define rom mem._rom
#define hwr mem._hwr

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
    },

    write: {
      uw(addr, data) {
        psx.error('pseudo / Mem write uw '+addr+' <- '+data);
      },

      uh(addr, data) {
        psx.error('pseudo / Mem write uh '+addr+' <- '+data);
      },

      ub(addr, data) {
        psx.error('pseudo / Mem write ub '+addr+' <- '+data);
      }
    },

    read: {
      uw(addr) {
        psx.error('pseudo / Mem read uw '+addr);
        return 0;
      },

      uh(addr) {
        psx.error('pseudo / Mem read uh '+addr);
        return 0;
      },

      ub(addr) {
        psx.error('pseudo / Mem read ub '+addr);
        return 0;
      }
    }
  };
})();

#undef ram
#undef rom
#undef hwr
