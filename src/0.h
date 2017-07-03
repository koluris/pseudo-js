// Preprocessor
#define UintWcap      Uint32Array
#define UintBcap      Uint8Array
#define Chars         String
#define toChars       toString
#define responseSort  responseType
#define dataBin       'arraybuffer'
#define bLen          byteLength

// A kind of helper for various data manipulation
function union(size) {
  const bfr = new ArrayBuffer(size);

  return {
    uw: new Uint32Array(bfr),
    uh: new Uint16Array(bfr),
    ub: new Uint8Array (bfr),

    sw: new Int32Array(bfr),
    sh: new Int16Array(bfr),
    sb: new Int8Array (bfr),
  };
}

// Declare our namespace
'use strict';
const pseudo = window.pseudo || {};
