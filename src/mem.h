#define mem\
  pseudo.CstrMem

#define ioZero(mem)\
  mem.fill(0)

#define directMemW(mem, addr)\
  mem[((addr)&(mem.bLen-1))>>>2]

#define directMemH(mem, addr)\
  mem[((addr)&(mem.bLen-1))>>>1]

#define directMemB(mem, addr)\
  mem[((addr)&(mem.bLen-1))>>>0]
