#define cpu\
  pseudo.CstrMips

#define rs\
  ((code>>>21)&0x1f)

#define rt\
  ((code>>>16)&0x1f)

#define rd\
  ((code>>>11)&0x1f)
