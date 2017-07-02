#define io\
  pseudo.CstrHardware

#define data32\
  directMemW(mem._hwr.uw, 0x1070)

#define mask32\
  directMemW(mem._hwr.uw, 0x1074)

#define data16\
  directMemH(mem._hwr.uh, 0x1070)

#define mask16\
  directMemH(mem._hwr.uh, 0x1074)
