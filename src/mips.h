#define r3ka\
  pseudo.CstrR3ka

#define opcode\
  ((code>>>26)&0x3f)

#define rt\
  ((code>>>15)&0x1f)

#define rs\
  ((code>>>21)&0x1f)

#define immu\
  (code&0xffff)

#define imms\
  (sextH(code))

#define taddr\
  (r[rs]+imms)
