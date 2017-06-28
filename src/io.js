#define hwr mem._hwr

pseudo.CstrHardware = (function() {
  return {
    write: {
      w(addr, data) {
        addr&=0xffff;

        if (addr >= 0x0000 && addr <= 0x03ff) { // Scratchpad
          io_acc_w(hwr.uw, addr) = data;
          return;
        }

        switch(addr) {
          case 0x1000:
          case 0x1004:
          case 0x1008:
          case 0x100c:
          case 0x1010:
          case 0x1014:
          case 0x1018:
          case 0x101c:
          case 0x1020:
          case 0x1060:
            io_acc_w(hwr.uw, addr) = data;
            return;
        }
        psx.error('pseudo / Hardware write w '+hex(addr)+' <- '+hex(data));
      },

      h(addr, data) {
        addr&=0xffff;
        
        if (addr >= 0x1d80 && addr <= 0x1d86) { // Audio
          io_acc_h(hwr.uh, addr) = data;
          return;
        }
        psx.error('pseudo / Hardware write h '+hex(addr)+' <- '+hex(data));
      },

      b(addr, data) {
        addr&=0xffff;
        switch(addr) {
          case 0x2041:
            io_acc_b(hwr.ub, addr) = data;
            return;
        }
        psx.error('pseudo / Hardware write b '+hex(addr)+' <- '+hex(data));
      }
    }
  };
})();

#undef hwr
