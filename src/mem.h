#define mem\
  pseudo.CstrMem

#define ioAccW(mem, addr)\
  mem[((addr)&(mem.bLen-1))>>>2]
