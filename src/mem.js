#define ram mem._ram
#define rom mem._rom
#define hwr mem._hwr

#define MSB(x)\
  x>>>24

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
        switch(MSB(addr)) {
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
        psx.error('Mem Write w '+hex(addr)+' <- '+hex(data));
      },

      h(addr, data) {
        switch(MSB(addr)) {
          case 0x00: // Base
          case 0x80: // Mirror
            directMemH(ram.uh, addr) = data;
            return;

          case 0x1f: // Hardware
            io.write.h(addr, data);
            return;
        }
        psx.error('Mem Write h '+hex(addr)+' <- '+hex(data));
      },

      b(addr, data) {
        switch(MSB(addr)) {
          case 0x00: // Base
          case 0x80: // Mirror
          case 0xa0: // Mirror
            directMemB(ram.ub, addr) = data;
            return;

          case 0x1f: // Hardware
            io.write.b(addr, data);
            return;
        }
        psx.error('Mem Write b '+hex(addr)+' <- '+hex(data));
      }
    },

    read: {
      w(addr) {
        switch(MSB(addr)) {
          case 0x00: // Base
          case 0x80: // Mirror
          case 0xa0: // Mirror
            return directMemW(ram.uw, addr);

          case 0xbf: // BIOS
            return directMemW(rom.uw, addr);

          case 0x1f: // Hardware
            return io.read.w(addr);
        }
        psx.error('Mem Read w '+hex(addr));
        return 0;
      },

      h(addr) {
        switch(MSB(addr)) {
          case 0x00: // Base
          case 0x80: // Mirror
            return directMemH(ram.uh, addr);

          case 0x1f: // Hardware
            return io.read.h(addr);
        }
        psx.error('Mem Read h '+hex(addr));
        return 0;
      },

      b(addr) {
        switch(MSB(addr)) {
          case 0x00: // Base
          case 0x80: // Mirror
            return directMemB(ram.ub, addr);

          case 0xbf: // BIOS
            return directMemB(rom.ub, addr);

          case 0x1f: // Hardware
            if (addr === 0x1f000084) { // PIO?
              return 0;
            }
            return io.read.b(addr);
        }
        psx.error('Mem Read b '+hex(addr));
        return 0;
      }
    },

    executeDMA: function(addr) {
      if (!bcr || chcr !== 0x11000002) {
        return;
      }
      madr&=0xffffff;

      while (--bcr) {
        directMemW(ram.uw, madr) = (madr-4)&0xffffff;
        madr-=4;
      }
      directMemW(ram.uw, madr) = 0xffffff;
    }
  };
})();

#undef ram
#undef rom
#undef hwr
