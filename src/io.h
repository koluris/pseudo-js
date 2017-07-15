#define io\
  pseudo.CstrHardware

#define data32\
  directMemW(mem.__hwr.uw, 0x1070)

#define mask32\
  directMemW(mem.__hwr.uw, 0x1074)

#define data16\
  directMemH(mem.__hwr.uh, 0x1070)

#define mask16\
  directMemH(mem.__hwr.uh, 0x1074)
