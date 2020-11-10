// A kind of helper for various data manipulation
function union(size) {
    let bfr = new ArrayBuffer(size);

    return {
        uw: new Uint32Array(bfr),
        uh: new Uint16Array(bfr),
        ub: new Uint8Array(bfr),

        sw: new Int32Array(bfr),
        sh: new Int16Array(bfr),
        sb: new Int8Array(bfr),
    };
}

/***
    Mem banks
***/
#define directMemW(module, addr) \
    module[((addr) & (module.byteLength - 1)) >>> 2]

#define directMemH(module, addr) \
    module[((addr) & (module.byteLength - 1)) >>> 1]

#define directMemB(module, addr) \
    module[((addr) & (module.byteLength - 1)) >>> 0]

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
    ((n) <<  0 >>  0)

#define SIGN_EXT_16(n) \
    ((n) << 16 >> 16)

// Declare our namespace
'use strict';
let pseudo = window.pseudo || {};

// 21 processor instructions
//  2 draw primitives
//  1 DMA channel
