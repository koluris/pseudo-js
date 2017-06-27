#define psx\
  pseudo.CstrMain

#define s_ext_w(n)\
  ((n)<<0>>0)

#define s_ext_h(n)\
  ((n)<<16>>16)

#define s_ext_b(n)\
  ((n)<<24>>24)

#define hex(n)\
  ('0x'+(n>>>0).toChars(16))
