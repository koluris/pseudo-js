// Preprocessor
#define bSize                   byteLength
#define createFunction          createProgram
#define dataBin                 'arraybuffer'
#define dest                    target
#define disableVertexAttrib     disableVertexAttribArray
#define drawVertices            drawArrays
#define enableVertexAttrib      enableVertexAttribArray
#define F32cap                  Float32Array
#define fetchAttribute          getAttribLocation
#define fetchChannelData        getChannelData
#define fetchContext            getContext
#define fetchFunctionParameter  getProgramParameter
#define fetchShaderParameter    getShaderParameter
#define fetchUniform            getUniformLocation
#define linkFunction            linkProgram
#define readAsBuffer            readAsArrayBuffer
#define responseSort            responseType
#define SintWcap                Int32Array
#define SintHcap                Int16Array
#define SintBcap                Int8Array
#define texPhoto2D              texImage2D
#define Text                    String
#define toText                  toString
#define UintWcap                Uint32Array
#define UintHcap                Uint16Array
#define UintBcap                Uint8Array
#define useFunction             useProgram
#define WebGL                   'webgl2', { antialias: false, depth: false, desynchronized: true, preserveDrawingBuffer: true, stencil: false }

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

/***
    Graphics
***/
#define FRAME_W \
    1024

#define FRAME_H \
    512

#define SHADER_VERTEX ' \
    attribute vec2 a_position; \
    attribute vec4 a_color; \
    uniform vec2 u_resolution; \
    varying vec4 v_color; \
    \
    void main() { \
        gl_Position = vec4(((a_position / u_resolution) - 1.0) * vec2(1, -1), 0, 1); \
        v_color = a_color; \
    }'

#define SHADER_FRAGMENT ' \
    precision mediump float; \
    uniform sampler2D u_texture; \
    varying vec4 v_color; \
    varying vec2 v_texCoord; \
    \
    void main() { \
        gl_FragColor = v_color; \
    }'

// Declare our namespace
'use strict';
const pseudo = window.pseudo || {};
