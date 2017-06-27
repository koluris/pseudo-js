#define hwr mem._hwr

pseudo.CstrHardware = (function() {
  return {
    write: {
      w(addr, data) {
        addr&=0xffff;

        if (addr >= 0x0000 && addr <= 0x03ff) { // Scratchpad
          return io_acc_w(hwr.uw, addr);
        }
        psx.error('pseudo / Hardware write w '+hex(addr)+' <- '+hex(data));
      }
    }
  };
})();

#undef hwr
