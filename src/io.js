#define hwr  mem.__hwr

pseudo.CstrHardware = (function() {
  // Exposed class functions/variables
  return {
    write: {
      w(addr, data) {
        if (addr >= 0x1080 && addr <= 0x10e8) { // DMA
          if (addr&8) {
            bus.checkDMA(addr, data);
            return;
          }
          directMemW(hwr.uw, addr) = data;
          return;
        }

        if (addr >= 0x1104 && addr <= 0x1124) { // Rootcounters
          rootcnt.scopeW(addr, data);
          return;
        }

        if (addr >= 0x1810 && addr <= 0x1814) { // Graphics
          vs.scopeW(addr, data);
          return;
        }

        if (addr >= 0x1820 && addr <= 0x1824) { // Motion Decoder
          directMemW(hwr.uw, addr) = data;
          return;
        }

        switch(addr) {
          case 0x1070:
            data32 &= data&mask32;
            return;

          case 0x10f4: // Thanks Calb, Galtor :)
            icr = (icr&(~((data&0xff000000)|0xffffff)))|(data&0xffffff);
            return;

          /* unused */
          case 0x1000:
          case 0x1004:
          case 0x1008:
          case 0x100c:
          case 0x1010:
          case 0x1014: // SPU
          case 0x1018: // DV5
          case 0x101c:
          case 0x1020: // COM
          case 0x1060: // RAM Size
          case 0x1074:
          case 0x10f0:

          case 0x1d80:
          case 0x1d84:
          case 0x1d8c: // SPU in 32 bits?
            directMemW(hwr.uw, addr) = data;
            return;
        }
        psx.error('Hardware Write w '+hex(addr)+' <- '+hex(data));
      },

      h(addr, data) {
        if (addr >= 0x1048 && addr <= 0x104e) { // Controls
          sio.write.h(addr, data);
          return;
        }

        if (addr >= 0x1100 && addr <= 0x1128) { // Rootcounters
          rootcnt.scopeW(addr, data);
          return;
        }
        
        if (addr >= 0x1c00 && addr <= 0x1dfe) { // Audio
          audio.scopeW(addr, data);
          return;
        }

        switch(addr) {
          case 0x1070:
            data16 &= data&mask16;
            return;
          
          /* unused */
          case 0x1014:
          case 0x1074:
            directMemH(hwr.uh, addr) = data;
            return;
        }
        psx.error('Hardware Write h '+hex(addr)+' <- '+hex(data));
      },

      b(addr, data) {
        if (addr >= 0x1800 && addr <= 0x1803) { // CD-ROM
          cdrom.scopeW(addr, data);
          return;
        }

        switch(addr) {
          case 0x1040:
            sio.write.b(addr, data);
            return;

          /* unused */
          case 0x10f6:
          case 0x2041: // DIP Switch?
            directMemB(hwr.ub, addr) = data;
            return;
        }
        psx.error('Hardware Write b '+hex(addr)+' <- '+hex(data));
      }
    },

    read: {
      w(addr) {
        if (addr >= 0x1080 && addr <= 0x10e8) { // DMA
          return directMemW(hwr.uw, addr);
        }

        if (addr >= 0x1100 && addr <= 0x1110) { // Rootcounters
          return rootcnt.scopeR(addr);
        }

        if (addr >= 0x1810 && addr <= 0x1814) { // Graphics
          return vs.scopeR(addr);
        }

        if (addr >= 0x1820 && addr <= 0x1824) { // Motion Decoder
          return directMemW(hwr.uw, addr);
        }

        switch(addr) {
          /* unused */
          case 0x1014:
          case 0x1060:
          case 0x1070:
          case 0x1074:
          case 0x10f0:
          case 0x10f4:
            return directMemW(hwr.uw, addr);
        }
        psx.error('Hardware Read w '+hex(addr));
      },

      h(addr) {
        if (addr >= 0x1044 && addr <= 0x104e) { // Controls
          return sio.read.h(addr);
        }

        if (addr >= 0x1100 && addr <= 0x1128) { // Rootcounters
          return rootcnt.scopeR(addr);
        }

        if (addr >= 0x1c00 && addr <= 0x1e0e) { // Audio
          return audio.scopeR(addr);
        }

        switch(addr) {
          /* unused */
          case 0x1014:
          case 0x1070:
          case 0x1074:
          case 0x1130:
            return directMemH(hwr.uh, addr);
        }
        psx.error('Hardware Read h '+hex(addr));
      },

      b(addr) {
        if (addr >= 0x1800 && addr <= 0x1803) { // CD-ROM
          return cdrom.scopeR(addr);
        }

        switch(addr) {
          case 0x1040: // Controls
            return sio.read.b(addr);

          /* unused */
          case 0x10f6:
            return directMemB(hwr.ub, addr);
        }
        psx.error('Hardware Read b '+hex(addr));
      }
    }
  };
})();

#undef hwr
