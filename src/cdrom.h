#define cdrom\
  pseudo.CstrCdrom

#define UDF_FRAMESIZERAW\
  2352

#define UDF_DATASIZE\
  (UDF_FRAMESIZERAW - 12)

#define BCD2INT(n)\
  (Math.floor((n)/16) * 10 + (n)%16)

#define INT2BCD(n)\
  (Math.floor((n)/10) * 16 + (n)%10)
