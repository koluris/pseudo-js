// Preprocessor
#define bLen                    byteLength
#define createFunction          createProgram
#define Chars                   String
#define dataBin                 'arraybuffer'
#define drawVertices            drawArrays
#define enableVertexAttrib      enableVertexAttribArray
#define fetchAttribute          getAttribLocation
#define fetchContext            getContext
#define fetchFunctionParameter  getProgramParameter
#define fetchShaderParameter    getShaderParameter
#define fetchUniform            getUniformLocation
#define hei                     height
#define linkFunction            linkProgram
#define responseSort            responseType
#define SintHcap                Int16Array
#define toChars                 toString
#define UintBcap                Uint8Array
#define UintWcap                Uint32Array
#define useFunction             useProgram
#define WebGL                   'webgl'

#define SHADER_VERTEX '\
  attribute vec2 a_position;\
  attribute vec4 a_color;\
  uniform vec2 u_resolution;\
  varying vec4 v_color;\
  \
  void main() {\
    gl_Position = vec4(((a_position / u_resolution) - 1.0) * vec2(1, -1), 0, 1);\
    v_color = a_color;\
  }'

#define SHADER_FRAGMENT '\
  precision mediump float;\
  varying vec4 v_color;\
  \
  void main() {\
    gl_FragColor = v_color;\
  }'

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
