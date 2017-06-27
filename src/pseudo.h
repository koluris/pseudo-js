#define psx\
  pseudo.CstrMain

#define sextW(n)\
  ((n)<<0>>0)

#define sextH(n)\
  ((n)<<16>>16)

#define sextB(n)\
  ((n)<<24>>24)

#define hex(n)\
  ('0x'+(n>>>0).toChars(16))
