#define pcr\
  directMemW(mem._hwr.uw, 0x10f0)

#define icr\
  directMemW(mem._hwr.uw, 0x10f4)

#define madr\
  directMemW(mem._hwr.uw, (addr&0xfff0)|0)

#define bcr\
  directMemW(mem._hwr.uw, (addr&0xfff0)|4)

#define chcr\
  directMemW(mem._hwr.uw, (addr&0xfff0)|8)

pseudo.CstrDMA = (function() {
  return {
    execute(addr, data) {
      var chan = ((addr&0xf0)>>>4)-8;

      console.dir(chan);
    }
  };
})();
