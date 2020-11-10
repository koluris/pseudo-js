// Preprocessor
#define bSize         byteLength
#define dataBin       'arraybuffer'
#define fetchContext  getContext
#define responseSort  responseType
#define SintWcap      Int32Array
#define SintHcap      Int16Array
#define SintBcap      Int8Array
#define toText        toString
#define UintWcap      Uint32Array
#define UintHcap      Uint16Array
#define UintBcap      Uint8Array

// A kind of helper for various data manipulation
function union(size) {
    const bfr = new ArrayBuffer(size);

    return {
        uw: new UintWcap(bfr),
        uh: new UintHcap(bfr),
        ub: new UintBcap(bfr),

        sw: new SintWcap(bfr),
        sh: new SintHcap(bfr),
        sb: new SintBcap(bfr),
    };
}

/***
    Mem banks
***/
#define directMemW(module, addr) \
    module[((addr) & (module.bSize - 1)) >>> 2]

#define directMemH(module, addr) \
    module[((addr) & (module.bSize - 1)) >>> 1]

#define directMemB(module, addr) \
    module[((addr) & (module.bSize - 1)) >>> 0]

/***
    DMA
***/
#define madr \
    directMemW(mem.hwr.uw, (addr & 0xfff0) | 0)

#define bcr \
    directMemW(mem.hwr.uw, (addr & 0xfff0) | 4)

#define chcr \
    directMemW(mem.hwr.uw, (addr & 0xfff0) | 8)

/***
    Mips processor
***/
#define SIGN_EXT_32(n) \
    ((n) << 0 >> 0)

#define SIGN_EXT_16(n) \
    ((n) << 16 >> 16)

#define SIGN_EXT_8(n) \
    ((n) << 24 >> 24)

#define rs \
    ((code >>> 21) & 0x1f)

#define rt \
    ((code >>> 16) & 0x1f)

#define rd \
    ((code >>> 11) & 0x1f)

// Declare our namespace
'use strict';
const pseudo = window.pseudo || {};
