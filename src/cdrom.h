#define cdrom\
  pseudo.CstrCdrom

#define BCD2INT(n)\
  ((n)/16 * 10 + (n)%16)

#define INT2BCD(n)\
  ((n)/10 * 16 + (n)%10)
