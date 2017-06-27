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

#define imm_u\
  (code&0xffff)

#define imm_s\
  (s_ext_h(code))

#define ob\
  (r[rs]+imm_s)

#define b_addr\
  (pc+(imm_s<<2))

#define s_addr\
  ((pc&0xf0000000)|(code&0x3ffffff)<<2)
