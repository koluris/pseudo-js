#define psx\
  pseudo.CstrMain

#define SIGN_EXT_32(n)\
  ((n)<<0>>0)

#define SIGN_EXT_16(n)\
  ((n)<<16>>16)

#define SIGN_EXT_8(n)\
  ((n)<<24>>24)

#define hex(n)\
  ('0x'+(n>>>0).toChars(16))
