// Preprocessor
#define bLen                    byteLength
#define createFunction          createProgram
#define Chars                   String
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
#define hei                     height
#define linkFunction            linkProgram
#define readAsBuffer            readAsArrayBuffer
#define responseSort            responseType
#define SintHcap                Int16Array
#define SintWcap                Int32Array
#define texPhoto2D              texImage2D
#define toChars                 toString
#define UintBcap                Uint8Array
#define UintHcap                Uint16Array
#define UintWcap                Uint32Array
#define useFunction             useProgram
#define WebGL                   'webgl', { preserveDrawingBuffer: true }

#define SHADER_VERTEX '\
  attribute vec2 a_position;\
  attribute vec4 a_color;\
  attribute vec2 a_texCoord;\
  uniform vec2 u_resolution;\
  varying vec4 v_color;\
  varying vec2 v_texCoord;\
  \
  void main() {\
    gl_Position = vec4(((a_position / u_resolution) - 1.0) * vec2(1, -1), 0, 1);\
    v_color = a_color;\
    v_texCoord = a_texCoord;\
  }'

#define SHADER_FRAGMENT '\
  precision mediump float;\
  uniform sampler2D u_texture;\
  uniform bool u_enabled;\
  varying vec4 v_color;\
  varying vec2 v_texCoord;\
  \
  void main() {\
    if (u_enabled) {\
      gl_FragColor = texture2D(u_texture, v_texCoord) * (v_color * vec4(2.0, 2.0, 2.0, 1));\
    }\
    else {\
      gl_FragColor = v_color;\
    }\
  }'

// A kind of helper for various data manipulation
function union(size) {
  var bfr = new ArrayBuffer(size);

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
var pseudo = window.pseudo || {};
