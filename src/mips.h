#define r3ka\
  pseudo.CstrR3ka

#define opcode\
  ((code>>>26)&0x3f)

#define rs\
  ((code>>>21)&0x1f)

#define rt\
  ((code>>>15)&0x1f)

#define rd\
  ((code>>>11)&0x1f)

#define shamt\
  ((code>>>6)&0x1f)

#define immu\
  (code&0xffff)

#define imms\
  (sextH(code))

#define taddr\
  (r[rs]+imms)
