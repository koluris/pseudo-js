#define cdrom\
  pseudo.CstrCdrom

#define UDF_FRAMESIZERAW\
  2352

#define UDF_DATASIZE\
  (UDF_FRAMESIZERAW - 12)

#define BCD2INT(n)\
  (parseInt((n)/16) * 10 + (n)%16)

#define INT2BCD(n)\
  (parseInt((n)/10) * 16 + (n)%10)
