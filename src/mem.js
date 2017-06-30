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
      // Reset all, except for BIOS?
      ram.ub.fill(0);
      hwr.ub.fill(0);
    },

    write: {
      w(addr, data) {
        switch(addr>>>24) {
          case 0x00: // Base
          case 0x80: // Mirror
          case 0xa0: // Mirror
            if (r3ka.writeOK()) {
              directMemW(ram.uw, addr) = data;
            }
            return;

          case 0x1f: // Hardware
            io.write.w(addr, data);
            return;
        }

        if (addr === 0xfffe0130) { // Mem Access
          return;
        }
        psx.error('pseudo / Mem write w '+hex(addr)+' <- '+hex(data));
      },

      h(addr, data) {
        switch(addr>>>24) {
          case 0x00: // Base
          case 0x80: // Mirror
            directMemH(ram.uh, addr) = data;
            return;

          case 0x1f: // Hardware
            io.write.h(addr, data);
            return;
        }
        psx.error('pseudo / Mem write h '+hex(addr)+' <- '+hex(data));
      },

      b(addr, data) {
        switch(addr>>>24) {
          case 0x00: // Base
          case 0x80: // Mirror
          case 0xa0: // Mirror
            directMemB(ram.ub, addr) = data;
            return;

          case 0x1f: // Hardware
            io.write.b(addr, data);
            return;
        }
        psx.error('pseudo / Mem write b '+hex(addr)+' <- '+hex(data));
      }
    },

    read: {
      w(addr) {
        switch(addr>>>24) {
          case 0x00: // Base
          case 0x80: // Mirror
          case 0xa0: // Mirror
            return directMemW(ram.uw, addr);

          case 0xbf: // BIOS
            return directMemW(rom.uw, addr);

          case 0x1f: // Hardware
            return io.read.w(addr);
        }
        psx.error('pseudo / Mem read w '+hex(addr));
        return 0;
      },

      h(addr) {
        switch(addr>>>24) {
          case 0x80: // Mirror
            return directMemH(ram.uh, addr);

          case 0x1f: // Hardware
            return io.read.h(addr);
        }
        psx.error('pseudo / Mem read h '+hex(addr));
        return 0;
      },

      b(addr) {
        switch(addr>>>24) {
          case 0x00: // Base
          case 0x80: // Mirror
            return directMemB(ram.ub, addr);

          case 0xbf: // BIOS
            return directMemB(rom.ub, addr);
        }

        if (addr === 0x1f000084) { // PIO?
          return 0;
        }
        psx.error('pseudo / Mem read b '+hex(addr));
        return 0;
      }
    }
  };
})();

#undef ram
#undef rom
#undef hwr
