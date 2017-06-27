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

#define ob\
  (r[rs]+imms)

#define baddr\
  (pc+(imms<<2))

#define taddr\
  ((pc&0xf0000000)|(code&0x3ffffff)<<2)
