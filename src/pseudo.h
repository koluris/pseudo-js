#define psx\
  pseudo.CstrMain

// Console output
#define MSG_INFO  'info'
#define MSG_ERROR 'error'

// Format to Hexadecimal
#define hex(n)\
  ('0x'+(n>>>0).toChars(16))

// Arithmetic operations
#define SIGN_EXT_32(n)\
  ((n)<<0>>0)

#define SIGN_EXT_16(n)\
  ((n)<<16>>16)

#define SIGN_EXT_8(n)\
  ((n)<<24>>24)
