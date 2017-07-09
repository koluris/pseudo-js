#define inn vs._inn

#define COLOR_MAX\
  255

#define COLOR_HALF\
  COLOR_MAX>>>1

#define iBlend(a)\
  const b = [\
    a&2 ? inn.blend : 0,\
    a&2 ? bit[inn.blend].opaque : COLOR_MAX\
  ];\
  \
  ctx.blendFunc(bit[b[0]].src, bit[b[0]].dest)

#define iColor(a)\
  ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c);\
  ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0);\
  ctx.bufferData(ctx.ARRAY_BUFFER, new UintBcap(a), ctx.DYNAMIC_DRAW)

#define iVertex(a)\
  ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v);\
  ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0);\
  ctx.bufferData(ctx.ARRAY_BUFFER, new SintHcap(a), ctx.DYNAMIC_DRAW)

/***
    Base components
***/

#define RGBC(data) {\
  _R: (data>>> 0)&0xff,\
  _G: (data>>> 8)&0xff,\
  _B: (data>>>16)&0xff,\
  _A: (data>>>24)&0xff,\
}

// Fix: SIGN_EXT_16
#define POINT(data) {\
  _X: (data>> 0)&0xffff,\
  _Y: (data>>16)&0xffff,\
}

/***
    Primitive Structures
***/

#define PFx(data) {\
  cr: [\
    RGBC(data[0])\
  ],\
  vx: [\
    POINT(data[1]),\
    POINT(data[2]),\
    POINT(data[3]),\
    POINT(data[4]),\
  ]\
}

#define PGx(data) {\
  cr: [\
    RGBC(data[0]),\
    RGBC(data[2]),\
    RGBC(data[4]),\
    RGBC(data[6]),\
  ],\
  vx: [\
    POINT(data[1]),\
    POINT(data[3]),\
    POINT(data[5]),\
    POINT(data[7]),\
  ]\
}

#define PFTx(data) {\
  cr: [\
    RGBC(data[0])\
  ],\
  vx: [\
    POINT(data[1]),\
    POINT(data[3]),\
    POINT(data[5]),\
    POINT(data[7]),\
  ]\
}

#define PGTx(data) {\
  cr: [\
    RGBC(data[0]),\
    RGBC(data[3]),\
    RGBC(data[6]),\
    RGBC(data[9]),\
  ],\
  vx: [\
    POINT(data[ 1]),\
    POINT(data[ 4]),\
    POINT(data[ 7]),\
    POINT(data[10]),\
  ]\
}

#define BLKFx(data) {\
  cr: [\
    RGBC(data[0])\
  ],\
  vx: [\
    POINT(data[1]),\
    POINT(data[2]),\
  ]\
}

#define SPRTx(data) {\
  cr: [\
    RGBC(data[0])\
  ],\
  vx: [\
    POINT(data[1]),\
    POINT(data[3]),\
  ]\
}

/***
    Vertices
***/

#define drawF(size, mode)\
  const k  = PFx(data);\
  const cr = [];\
  const vx = [];\
  \
  iBlend(k.cr[0]._A);\
  \
  for (let i=0; i<size; i++) {\
    cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]);\
    vx.push(k.vx[i]._X, k.vx[i]._Y);\
  }\
  \
  iColor(cr);\
  iVertex(vx);\
  ctx.drawVertices(mode, 0, size)

/***
    Gouraud Vertices
***/

#define drawG(size, mode)\
  const k  = PGx(data);\
  const cr = [];\
  const vx = [];\
  \
  iBlend(k.cr[0]._A);\
  \
  for (let i=0; i<size; i++) {\
    cr.push(k.cr[i]._R, k.cr[i]._G, k.cr[i]._B, b[1]);\
    vx.push(k.vx[i]._X, k.vx[i]._Y);\
  }\
  \
  iColor(cr);\
  iVertex(vx);\
  ctx.drawVertices(mode, 0, size)

/***
    Textured Vertices
***/

#define drawFT(size)\
  const k  = PFTx(data);\
  const cr = [];\
  const vx = [];\
  \
  for (let i=0; i<size; i++) {\
    if (k.cr._A&1) {\
      cr.push(COLOR_HALF, COLOR_HALF, COLOR_HALF, COLOR_MAX);\
    }\
    else {\
      cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, COLOR_MAX);\
    }\
    vx.push(k.vx[i]._X, k.vx[i]._Y);\
  }\
  \
  iColor(cr);\
  iVertex(vx);\
  ctx.drawVertices(ctx.TRIANGLE_STRIP, 0, size)

/***
    Gouraud/Textured Vertices
***/

#define drawGT(size)\
  const k  = PGTx(data);\
  const cr = [];\
  const vx = [];\
  \
  for (let i=0; i<size; i++) {\
    cr.push(k.cr[i]._R, k.cr[i]._G, k.cr[i]._B, COLOR_MAX);\
    vx.push(k.vx[i]._X, k.vx[i]._Y);\
  }\
  \
  iColor(cr);\
  iVertex(vx);\
  ctx.drawVertices(ctx.TRIANGLE_STRIP, 0, size)

/***
    Tiles
***/

#define drawTile(size)\
  const k  = BLKFx(data);\
  const cr = [];\
  \
  iBlend(k.cr[0]._A);\
  \
  if (size) {\
      k.vx[1]._X = size;\
      k.vx[1]._Y = size;\
  }\
  \
  for (let i=0; i<4; i++) {\
    cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]);\
  }\
  \
  const vx = [\
    k.vx[0]._X,            k.vx[0]._Y,\
    k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y,\
    k.vx[0]._X,            k.vx[0]._Y+k.vx[1]._Y,\
    k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y+k.vx[1]._Y,\
  ];\
  \
  iColor(cr);\
  iVertex(vx);\
  ctx.drawVertices(ctx.TRIANGLE_STRIP, 0, 4)

/***
    Sprites
***/

#define drawSprite(size)\
  const k  = SPRTx(data);\
  const cr = [];\
  \
  iBlend(k.cr[0]._A);\
  \
  if (size) {\
    k.vx[1]._X = size;\
    k.vx[1]._Y = size;\
  }\
  \
  for (let i=0; i<4; i++) {\
    if (k.cr[0]._A&1) {\
      cr.push(COLOR_HALF, COLOR_HALF, COLOR_HALF, b[1]);\
    }\
    else {\
      cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, b[1]);\
    }\
  }\
  \
  const vx = [\
    k.vx[0]._X,            k.vx[0]._Y,\
    k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y,\
    k.vx[0]._X,            k.vx[0]._Y+k.vx[1]._Y,\
    k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y+k.vx[1]._Y,\
  ];\
  \
  iColor(cr);\
  iVertex(vx);\
  ctx.drawVertices(ctx.TRIANGLE_STRIP, 0, 4)

pseudo.CstrRender = (function() {
  let screen, resolution;
  
  let ctx;    // WebGL Context
  let attrib; // Enable/Disable Attributes on demand
  let bfr;    // Draw buffers
  let bit;    // Blend bits

  // Resolution Override
  let res;
  // let resolutionMultiplier;
  // let overrideRes = {
  //   w: 320, h: 240
  // };

  // Generic function for shaders
  function createShader(kind, content) {
    const shader = ctx.createShader(kind);
    ctx.shaderSource (shader, content);
    ctx.compileShader(shader);
    ctx.fetchShaderParameter(shader, ctx.COMPILE_STATUS);

    return shader;
  }

  // Exposed class functions/variables
  return {
    awake(divScreen, divResolution) {
      // Get HTML elements
      screen     = divScreen[0];
      resolution = divResolution[0];

      // WebGL Canvas
      ctx = screen.fetchContext(WebGL);
      ctx. enable(ctx.BLEND);
      ctx.disable(ctx.DEPTH_TEST);
      ctx.disable(ctx.CULL_FACE);
      ctx.clearColor(0.0, 0.0, 0.0, 1.0);

      // Shaders
      const func = ctx.createFunction();
      ctx.attachShader(func, createShader(ctx.  VERTEX_SHADER, SHADER_VERTEX));
      ctx.attachShader(func, createShader(ctx.FRAGMENT_SHADER, SHADER_FRAGMENT));
      ctx.linkFunction(func);
      ctx.fetchFunctionParameter(func, ctx.LINK_STATUS);
      ctx.useFunction (func);

      // Attributes
      attrib = {
        _c: ctx.fetchAttribute(func, 'a_color'),
        _p: ctx.fetchAttribute(func, 'a_position'),
        _r: ctx.fetchUniform  (func, 'u_resolution')
      };

      ctx.enableVertexAttrib(attrib._c);
      ctx.enableVertexAttrib(attrib._p);

      // Buffers
      bfr = {
        _c: ctx.createBuffer(),
        _v: ctx.createBuffer(),
        _t: ctx.createBuffer(),
      };

      // Blend
      bit = [
        { src: ctx.SRC_ALPHA, dest: ctx.ONE_MINUS_SRC_ALPHA, opaque: 128 },
        { src: ctx.ONE,       dest: ctx.ONE_MINUS_SRC_ALPHA, opaque:   0 },
        { src: ctx.ZERO,      dest: ctx.ONE_MINUS_SRC_COLOR, opaque:   0 },
        { src: ctx.SRC_ALPHA, dest: ctx.ONE,                 opaque:  64 },
      ];

      // Standard value
      res = {
        native     : { w:   0, h:   0 },
        override   : { w: 320, h: 240 },
        multiplier : 1
      };
    },

    reset() {
      render.resize({ w: 320, h: 240 });
      ctx.clear(ctx.COLOR_BUFFER_BIT);
    },

    resize(data) {
      // Check if we have a valid resolution
      if (data.w > 0 && data.h > 0) {
        // Store valid resolution
        res.native.w = data.w;
        res.native.h = data.h;

        // Native PSX resolution
        ctx.uniform2f(attrib._r, data.w/2, data.h/2);
        resolution.innerText = data.w+' x '+data.h;

        // Construct desired resolution
        let w = (res.override.w || data.w) * res.multiplier;
        let h = (res.override.h || data.h) * res.multiplier;

        screen.width = w;
        screen.hei   = h;
        ctx.viewport(0, 0, w, h);
      }
      else {
        psx.error('Not a valid resolution');
      }
    },

    doubleResolution() {
      res.multiplier = res.multiplier === 1 ? 2 : 1;

      // Show/hide elements
      if (res.multiplier === 1) {
        $('#bar-boxes').show();
      }
      else {
        $('#bar-boxes').hide();
      }

      // Redraw
      render.resize({ w: res.native.w, h: res.native.h });
    },

    prim(addr, data) {
      switch(addr) {
        case 0x01: // FLUSH
          return;

        case 0x02: // BLOCK FILL
          {
            const k  = BLKFx(data);
            const cr = [];

            for (let i=0; i<4; i++) {
              cr.push(k.cr[0]._R, k.cr[0]._G, k.cr[0]._B, COLOR_MAX);
            }

            const vx = [
              k.vx[0]._X,            k.vx[0]._Y,
              k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y,
              k.vx[0]._X,            k.vx[0]._Y+k.vx[1]._Y,
              k.vx[0]._X+k.vx[1]._X, k.vx[0]._Y+k.vx[1]._Y,
            ];

            iColor(cr);
            iVertex(vx);
            ctx.drawVertices(ctx.TRIANGLE_STRIP, 0, 4);
          }
          return;

        case 0x20:
        case 0x21:
        case 0x22:
        case 0x23: // POLY F3
          {
            drawF(3, ctx.TRIANGLE_STRIP);
          }
          return;

        case 0x24:
        case 0x25:
        case 0x26:
        case 0x27: // POLY FT3
          {
            drawFT(3);
          }
          return;

        case 0x28:
        case 0x29:
        case 0x2a:
        case 0x2b: // POLY F4
          {
            drawF(4, ctx.TRIANGLE_STRIP);
          }
          return;

        case 0x2c:
        case 0x2d:
        case 0x2e:
        case 0x2f: // POLY FT4
          {
            drawFT(4);
          }
          return;

        case 0x30:
        case 0x31:
        case 0x32:
        case 0x33: // POLY G3
          {
            drawG(3, ctx.TRIANGLE_STRIP);
          }
          return;

        case 0x34:
        case 0x35:
        case 0x36:
        case 0x37: // POLY GT3
          {
            drawGT(3);
          }
          return;

        case 0x38:
        case 0x39:
        case 0x3a:
        case 0x3b: // POLY G4
          {
            drawG(4, ctx.TRIANGLE_STRIP);
          }
          return;

        case 0x3c:
        case 0x3d:
        case 0x3e:
        case 0x3f: // POLY GT4
          {
            drawGT(4);
          }
          return;

        case 0x40:
        case 0x41:
        case 0x42:
        case 0x43: // LINE F2
          {
            drawF(2, ctx.LINE_STRIP);
          }
          return;

        case 0x48:
        case 0x49:
        case 0x4a:
        case 0x4b: // LINE F3
          {
            drawF(3, ctx.LINE_STRIP);
          }
          return;

        case 0x4c:
        case 0x4d:
        case 0x4e:
        case 0x4f: // LINE F4
          {
            drawF(4, ctx.LINE_STRIP);
          }
          return;

        case 0x50:
        case 0x51:
        case 0x52:
        case 0x53: // LINE G2
          {
            drawG(2, ctx.LINE_STRIP);
          }
          return;

        case 0x58:
        case 0x59:
        case 0x5a:
        case 0x5b: // LINE G3
          {
            drawG(3, ctx.LINE_STRIP);
          }
          return;

        case 0x5c:
        case 0x5d:
        case 0x5e:
        case 0x5f: // LINE G4
          {
            drawG(4, ctx.LINE_STRIP);
          }
          return;

        case 0x60:
        case 0x61:
        case 0x62:
        case 0x63: // TILE S
          {
            drawTile(0);
          }
          return;

        case 0x64:
        case 0x65:
        case 0x66:
        case 0x67: // SPRITE S
          {
            drawSprite(0);
          }
          return;

        case 0x68:
        case 0x69:
        case 0x6a:
        case 0x6b: // TILE 1
          {
            drawTile(1);
          }
          return;

        case 0x70:
        case 0x71:
        case 0x72:
        case 0x73: // TILE 8
          {
            drawTile(8);
          }
          return;

        case 0x74:
        case 0x75:
        case 0x76:
        case 0x77: // SPRITE 8
          {
            drawSprite(8);
          }
          return;

        case 0x78:
        case 0x79:
        case 0x7a:
        case 0x7b: // TILE 16
          {
            drawTile(16);
          }
          return;

        case 0x7c:
        case 0x7d:
        case 0x7e:
        case 0x7f: // SPRITE 16
          {
            drawSprite(16);
          }
          return;

        case 0x80: // MOVE IMAGE
          return;

        case 0xa0: // LOAD IMAGE
          return;

        case 0xc0: // STORE IMAGE
          return;

        case 0xe1: // TEXTURE PAGE
          inn.blend  = (data[0]>>>5)&3;
          ctx.blendFunc(bit[inn.blend].src, bit[inn.blend].dest);
          return;

        case 0xe2: // TEXTURE WINDOW
          return;

        case 0xe3: // DRAW AREA START
          return;

        case 0xe4: // DRAW AREA END
          return;

        case 0xe5: // DRAW OFFSET
          return;

        case 0xe6: // STP
          inn.status = (inn.status&(~(3<<11))) | ((data[0]&3)<<11);
          return;
      }
      r3ka.consoleWrite(MSG_ERROR, 'GPU Render Primitive '+hex(addr));
    }
  };
})();

#undef inn
