#define fetchContext    getContext
#define responseSort    responseType
#define SintWcap        Int32Array
#define SintHcap        Int16Array
#define SintBcap        Int8Array
#define UintWcap        Uint32Array
#define UintHcap        Uint16Array
#define UintBcap        Uint8Array

// Data manipulation helper
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

'use strict';

const pseudo = window.pseudo || {};
