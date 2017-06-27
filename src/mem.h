#define mem\
  pseudo.CstrMem

#define io_acc_w(mem, addr)\
  mem[((addr)&(mem.bLen-1))>>>2]

#define io_acc_h(mem, addr)\
  mem[((addr)&(mem.bLen-1))>>>1]

#define io_acc_b(mem, addr)\
  mem[((addr)&(mem.bLen-1))>>>0]
