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
#define WebGL                   'webgl', { preserveDrawingBuffer: true }

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

#define audio   pseudo.CstrAudio
#define bus     pseudo.CstrBus
#define cdrom   pseudo.CstrCdrom
#define cop2    pseudo.CstrCop2
#define cpu     pseudo.CstrMips
#define io      pseudo.CstrHardware
#define mdec    pseudo.CstrMdec
#define mem     pseudo.CstrMem
#define psx     pseudo.CstrMain
#define render  pseudo.CstrRender
#define rootcnt pseudo.CstrCounters
#define sio     pseudo.CstrSerial
#define tcache  pseudo.CstrTexCache
#define vs      pseudo.CstrGraphics

/***
    Mem banks
***/
#define directMemW(mem, addr) \
    mem[((addr) & (mem.bSize - 1)) >>> 2]

#define directMemH(mem, addr) \
    mem[((addr) & (mem.bSize - 1)) >>> 1]

#define directMemB(mem, addr) \
    mem[((addr) & (mem.bSize - 1)) >>> 0]

/***
    Hardware IO
***/
#define data32 \
    directMemW(mem.__hwr.uw, 0x1070)

#define mask32 \
    directMemW(mem.__hwr.uw, 0x1074)

#define data16 \
    directMemH(mem.__hwr.uh, 0x1070)

#define mask16 \
    directMemH(mem.__hwr.uh, 0x1074)

#define dpcr \
    directMemW(mem.__hwr.uw, 0x10f0)

#define dicr \
    directMemW(mem.__hwr.uw, 0x10f4)

/***
    DMA
***/
#define madr \
    directMemW(mem.__hwr.uw, (addr & 0xfff0) | 0)

#define bcr \
    directMemW(mem.__hwr.uw, (addr & 0xfff0) | 4)

#define chcr \
    directMemW(mem.__hwr.uw, (addr & 0xfff0) | 8)

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
    Bus interrupts
***/
#define IRQ_VBLANK  0
#define IRQ_GPU     1
#define IRQ_CD      2
#define IRQ_DMA     3
#define IRQ_RTC0    4
#define IRQ_RTC1    5
#define IRQ_RTC2    6
#define IRQ_SIO0    7
#define IRQ_SIO1    8
#define IRQ_SPU     9
#define IRQ_PIO     10

/***
    CD-ROM & ISO
***/
#define UDF_FRAMESIZERAW \
    2352

#define UDF_DATASIZE \
    (UDF_FRAMESIZERAW - 12)

#define BCD2INT(n) \
    (parseInt((n) / 16) * 10 + (n) % 16)

#define INT2BCD(n) \
    (parseInt((n) / 10) * 16 + (n) % 10)

#define MSF2SECTOR(m, s, f) \
    (((m) * 60 + (s) - 2) * 75 + (f))

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
    attribute vec2 a_texCoord; \
    uniform vec2 u_resolution; \
    varying vec4 v_color; \
    varying vec2 v_texCoord; \
    \
    void main() { \
        gl_Position = vec4(((a_position / u_resolution) - 1.0) * vec2(1, -1), 0, 1); \
        v_color = a_color; \
        v_texCoord = a_texCoord; \
    }'

#define SHADER_FRAGMENT ' \
    precision mediump float; \
    uniform sampler2D u_texture; \
    uniform bool u_enabled; \
    varying vec4 v_color; \
    varying vec2 v_texCoord; \
    \
    void main() { \
        if (u_enabled) { \
            gl_FragColor = texture2D(u_texture, v_texCoord) * (v_color * vec4(2.0, 2.0, 2.0, 1)); \
        } \
        else { \
            gl_FragColor = v_color; \
        } \
    }'

// Console output
#define MSG_INFO  'info'
#define MSG_ERROR 'error'

// Declare our namespace
'use strict';
var pseudo = window.pseudo || {};
