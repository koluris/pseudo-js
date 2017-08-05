#define ram  mem.__ram
#define rom  mem.__rom
#define hwr  mem.__hwr

#define MSB(x)\
  x>>>20

pseudo.CstrMem = (function() {
  // Exposed class functions/variables
  return {
    __ram: union(0x200000),
    __rom: union(0x80000),
    __hwr: union(0x4000),

    reset() {
      // Reset all, except for BIOS?
      ioZero(ram.ub);
      ioZero(hwr.ub);
    },

    write: {
      w(addr, data) {
        switch(MSB(addr)) {
          case 0x000: // Base RAM
          case 0x001: // Base RAM

          case 0x800: // Mirror
          case 0x801: // Mirror
          case 0x802: // Mirror
          case 0x803: // Mirror
          case 0x807: // Mirror

          case 0xa00: // Mirror
          case 0xa01: // Mirror
            if (cpu.writeOK()) {
              directMemW(ram.uw, addr) = data;
            }
            return;

          case 0x1f8: // Scratchpad + Hardware
            addr&=0xffff;
            if (addr <= 0x3ff) {
              directMemW(hwr.uw, addr) = data;
              return;
            }
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
          case 0x000: // Base RAM
          case 0x001: // Base RAM

          case 0x800: // Mirror
          case 0x801: // Mirror
          case 0x802: // Mirror
          case 0x807: // Mirror

          case 0xa00: // Mirror
          case 0xa01: // Mirror
            if (cpu.writeOK()) {
              directMemH(ram.uh, addr) = data;
            }
            return;

          case 0x1f8: // Scratchpad + Hardware
            addr&=0xffff;
            if (addr <= 0x3ff) {
              directMemH(hwr.uh, addr) = data;
              return;
            }
            io.write.h(addr, data);
            return;
        }
        psx.error('Mem Write h '+hex(addr)+' <- '+hex(data));
      },

      b(addr, data) {
        switch(MSB(addr)) {
          case 0x000: // Base RAM
          case 0x001: // Base RAM

          case 0x800: // Mirror
          case 0x801: // Mirror
          case 0x802: // Mirror
          case 0x807: // Mirror

          case 0xa00: // Mirror
          case 0xa01: // Mirror
            if (cpu.writeOK()) {
              directMemB(ram.ub, addr) = data;
            }
            return;

          case 0x1f8: // Scratchpad + Hardware
            addr&=0xffff;
            if (addr <= 0x3ff) {
              directMemB(hwr.ub, addr) = data;
              return;
            }
            io.write.b(addr, data);
            return;
        }
        psx.error('Mem Write b '+hex(addr)+' <- '+hex(data));
      }
    },

    read: {
      w(addr) {
        switch(MSB(addr)) {
          case 0x000: // Base RAM
          case 0x001: // Base RAM

          case 0x800: // Mirror
          case 0x801: // Mirror
          case 0x802: // Mirror
          case 0x803: // Mirror
          case 0x807: // Mirror

          case 0xa00: // Mirror
          case 0xa01: // Mirror
            return directMemW(ram.uw, addr);

          case 0xbfc: // BIOS
            return directMemW(rom.uw, addr);

          case 0x1f8: // Scratchpad + Hardware
            addr&=0xffff;
            if (addr <= 0x3ff) {
              return directMemW(hwr.uw, addr);
            }
            return io.read.w(addr);
        }
        psx.error('Mem Read w '+hex(addr));
        return 0;
      },

      h(addr) {
        switch(MSB(addr)) {
          case 0x000: // Base RAM
          case 0x001: // Base RAM

          case 0x800: // Mirror
          case 0x801: // Mirror
          case 0x802: // Mirror
          case 0x807: // Mirror

          case 0xa01: // Mirror
            return directMemH(ram.uh, addr);

          case 0xbfc: // BIOS
            return directMemH(rom.uh, addr);

          case 0x1f8: // Scratchpad + Hardware
            addr&=0xffff;
            if (addr <= 0x3ff) {
              return directMemH(hwr.uh, addr);
            }
            return io.read.h(addr);
        }
        psx.error('Mem Read h '+hex(addr));
        return 0;
      },

      b(addr) {
        switch(MSB(addr)) {
          case 0x000: // Base RAM
          case 0x001: // Base RAM

          case 0x800: // Mirror
          case 0x801: // Mirror
          case 0x802: // Mirror
          case 0x807: // Mirror

          case 0xa00: // Mirror
          case 0xa01: // Mirror
            return directMemB(ram.ub, addr);

          case 0xbfc: // BIOS
            return directMemB(rom.ub, addr);

          case 0x1f8: // Scratchpad + Hardware
            addr&=0xffff;
            if (addr <= 0x3ff) {
              return directMemB(hwr.ub, addr);
            }
            return io.read.b(addr);

          case 0x1f0: // PIO? What do u want?
            return 0;
        }
        psx.error('Mem Read b '+hex(addr));
        return 0;
      }
    },

    executeDMA(addr) {
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
