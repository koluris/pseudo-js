#define cdrom\
  pseudo.CstrCdrom

#define CDFRAMESIZERAW\
  2352

#define DATASIZE\
  (CDFRAMESIZERAW - 12)

#define BCD2INT(n)\
  ((n)/16 * 10 + (n)%16)

#define INT2BCD(n)\
  ((n)/10 * 16 + (n)%10)
