#define GPU_INFO_TEXTUREWINDOW 2
#define GPU_INFO_DRAWAREASTART 3
#define GPU_INFO_DRAWAREAEND   4
#define GPU_INFO_OFFSET        5
#define GPU_INFO_VERSION       7

#define COLOR_MAX\
  255

#define COLOR_HALF\
  COLOR_MAX>>>1

  // Compose Blend
#define composeBlend(a)\
  var b = [\
    a&2 ? blend : 0,\
    a&2 ? bit[blend].opaque : COLOR_MAX\
  ];\
  ctx.blendFunc(bit[b[0]].src, bit[b[0]].dest)

// Compose Color
#define composeColor(a)\
  ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c);\
  ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0);\
  ctx.bufferData(ctx.ARRAY_BUFFER, new UintBcap(a), ctx.DYNAMIC_DRAW)

// Compose Vertex
#define composeVertex(a)\
  ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v);\
  ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0);\
  ctx.bufferData(ctx.ARRAY_BUFFER, new SintHcap(a), ctx.DYNAMIC_DRAW)

// Compose Texture
#define composeTexture(a)\
  for (var i in a) {\
    a[i] /= 256.0;\
  }\
  ctx.uniform1i(attrib._e, true);\
  ctx.enableVertexAttrib(attrib._t);\
  ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._t);\
  ctx.vertexAttribPointer(attrib._t, 2, ctx.FLOAT, false, 0, 0);\
  ctx.bufferData(ctx.ARRAY_BUFFER, new F32cap(a), ctx.DYNAMIC_DRAW)

// Disable Texture
#define disableTexture()\
  ctx.uniform1i(attrib._e, false);\
  ctx.disableVertexAttrib(attrib._t)

// Draw!
#define drawEnd(mode, size)\
  ctx.enable(ctx.SCISSOR_TEST);\
  ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v);\
  ctx.drawVertices(mode, 0, size);\
  ctx.disable(ctx.SCISSOR_TEST)

/***
    Base components
***/

#define RGBC(data) {\
  a: (data>>> 0)&0xff,\
  b: (data>>> 8)&0xff,\
  c: (data>>>16)&0xff,\
  n: (data>>>24)&0xff,\
}

// SIGN_EXT_16
#define POINT(data) {\
  h: (data>> 0)&0xffff,\
  v: (data>>16)&0xffff,\
}

#define UV(data) {\
  u: (data>>>0)&0xff,\
  v: (data>>>8)&0xff,\
}

#define TPAGE(data)\
  (data>>>16)&0xffff

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
  ],\
  tx: [\
    UV(data[2]),\
    UV(data[4]),\
    UV(data[6]),\
    UV(data[8]),\
  ],\
  tp: [\
    TPAGE(data[2]),\
    TPAGE(data[4]),\
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
  ],\
  tx: [\
    UV(data[ 2]),\
    UV(data[ 5]),\
    UV(data[ 8]),\
    UV(data[11]),\
  ],\
  tp: [\
    TPAGE(data[2]),\
    TPAGE(data[5]),\
  ]\
}

#define TILEx(data) {\
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
  ],\
  tx: [\
    UV(data[2])\
  ],\
  tp: [\
    TPAGE(data[2])\
  ]\
}

/***
    Vertices
***/

#define drawF(size, mode) {\
  var k  = PFx(data);\
  var cr = [];\
  var vx = [];\
  \
  composeBlend(k.cr[0].n);\
  \
  for (var i=0; i<size; i++) {\
    cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]);\
    vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v);\
  }\
  composeColor(cr);\
  composeVertex(vx);\
  disableTexture();\
  drawEnd(mode, size);\
}

/***
    Gouraud Vertices
***/

#define drawG(size, mode) {\
  var k  = PGx(data);\
  var cr = [];\
  var vx = [];\
  \
  composeBlend(k.cr[0].n);\
  \
  for (var i=0; i<size; i++) {\
    cr.push(k.cr[i].a, k.cr[i].b, k.cr[i].c, b[1]);\
    vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v);\
  }\
  composeColor(cr);\
  composeVertex(vx);\
  disableTexture();\
  drawEnd(mode, size);\
}

/***
    Textured Vertices
***/

#define drawFT(size) {\
  var k  = PFTx(data);\
  var cr = [];\
  var vx = [];\
  var tx = [];\
  \
  blend = (k.tp[1]>>>5)&3;\
  composeBlend(k.cr[0].n);\
  \
  for (var i=0; i<size; i++) {\
    if (k.cr.n&1) {\
      cr.push(COLOR_HALF, COLOR_HALF, COLOR_HALF, b[1]);\
    }\
    else {\
      cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]);\
    }\
    vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v);\
    tx.push(k.tx[i].u, k.tx[i].v);\
  }\
  tcache.fetchTexture(ctx, k.tp[1], k.tp[0]);\
  \
  composeColor(cr);\
  composeVertex(vx);\
  composeTexture(tx);\
  drawEnd(ctx.TRIANGLE_STRIP, size);\
}

/***
    Gouraud/Textured Vertices
***/

#define drawGT(size) {\
  var k  = PGTx(data);\
  var cr = [];\
  var vx = [];\
  var tx = [];\
  \
  blend = (k.tp[1]>>>5)&3;\
  composeBlend(k.cr[0].n);\
  \
  for (var i=0; i<size; i++) {\
    cr.push(k.cr[i].a, k.cr[i].b, k.cr[i].c, b[1]);\
    vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v);\
    tx.push(k.tx[i].u, k.tx[i].v);\
  }\
  tcache.fetchTexture(ctx, k.tp[1], k.tp[0]);\
  \
  composeColor(cr);\
  composeVertex(vx);\
  composeTexture(tx);\
  drawEnd(ctx.TRIANGLE_STRIP, size);\
}

/***
    Tiles
***/

#define drawTile(size) {\
  var k  = TILEx(data);\
  var cr = [];\
  \
  composeBlend(k.cr[0].n);\
  \
  if (size) {\
      k.vx[1].h = size;\
      k.vx[1].v = size;\
  }\
  for (var i=0; i<4; i++) {\
    cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]);\
  }\
  var vx = [\
    k.vx[0].h+ofs.h,           k.vx[0].v+ofs.v,\
    k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v,\
    k.vx[0].h+ofs.h,           k.vx[0].v+ofs.v+k.vx[1].v,\
    k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v+k.vx[1].v,\
  ];\
  composeColor(cr);\
  composeVertex(vx);\
  disableTexture();\
  drawEnd(ctx.TRIANGLE_STRIP, 4);\
}

/***
    Sprites
***/

#define drawSprite(size) {\
  var k  = SPRTx(data);\
  var cr = [];\
  \
  composeBlend(k.cr[0].n);\
  \
  if (size) {\
    k.vx[1].h = size;\
    k.vx[1].v = size;\
  }\
  for (var i=0; i<4; i++) {\
    if (k.cr[0].n&1) {\
      cr.push(COLOR_HALF, COLOR_HALF, COLOR_HALF, b[1]);\
    }\
    else {\
      cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]);\
    }\
  }\
  var vx = [\
    k.vx[0].h+ofs.h,           k.vx[0].v+ofs.v,\
    k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v,\
    k.vx[0].h+ofs.h,           k.vx[0].v+ofs.v+k.vx[1].v,\
    k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v+k.vx[1].v,\
  ];\
  var tx = [\
    k.tx[0].u,           k.tx[0].v,\
    k.tx[0].u+k.vx[1].h, k.tx[0].v,\
    k.tx[0].u,           k.tx[0].v+k.vx[1].v,\
    k.tx[0].u+k.vx[1].h, k.tx[0].v+k.vx[1].v,\
  ];\
  tcache.fetchTexture(ctx, spriteTP, k.tp[0]);\
  \
  composeColor(cr);\
  composeVertex(vx);\
  composeTexture(tx);\
  drawEnd(ctx.TRIANGLE_STRIP, 4);\
}

pseudo.CstrRender = (function() {
  var divScreen, divRes, divDouble, divFooter;
  
  var ctx, attrib, bfr; // WebGL Context
  var blend, bit, ofs;
  var drawArea, spriteTP;

  // Resolution
  var res = {
        native: { w:   0, h:   0 },
      override: { w: 320, h: 240 },
    multiplier: 1
  };

  // Information
  info = new UintWcap(8);

  // Generic function for shaders
  function createShader(kind, content) {
    var shader = ctx.createShader(kind);
    ctx.shaderSource (shader, content);
    ctx.compileShader(shader);
    ctx.fetchShaderParameter(shader, ctx.COMPILE_STATUS);

    return shader;
  }

  function drawAreaCalc(n) {
    return Math.round((n * (res.override.w * res.multiplier)) / 100);
  }

  // Exposed class functions/variables
  return {
    awake(screen, resolution, double, footer) {
      // Get HTML elements
      divScreen = screen[0];
      divRes    = resolution[0];
      divDouble = double;
      divFooter = footer;

      // WebGL Canvas
      ctx = divScreen.fetchContext(WebGL);
      ctx. enable(ctx.BLEND);
      ctx.disable(ctx.DEPTH_TEST);
      ctx.disable(ctx.CULL_FACE);
      ctx.clearColor(0.0, 0.0, 0.0, 1.0);

      // Shaders
      var func = ctx.createFunction();
      ctx.attachShader(func, createShader(ctx.  VERTEX_SHADER, SHADER_VERTEX));
      ctx.attachShader(func, createShader(ctx.FRAGMENT_SHADER, SHADER_FRAGMENT));
      ctx.linkFunction(func);
      ctx.fetchFunctionParameter(func, ctx.LINK_STATUS);
      ctx.useFunction (func);

      // Attributes
      attrib = {
        _c: ctx.fetchAttribute(func, 'a_color'),
        _p: ctx.fetchAttribute(func, 'a_position'),
        _t: ctx.fetchAttribute(func, 'a_texCoord'),
        _r: ctx.fetchUniform  (func, 'u_resolution'),
        _e: ctx.fetchUniform  (func, 'u_enabled')
      };

      ctx.enableVertexAttrib(attrib._c);
      ctx.enableVertexAttrib(attrib._p);
      ctx.enableVertexAttrib(attrib._t);

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
    },

    reset() {
      ioZero(info);
      info[7]  = 2;
      spriteTP = 0;
         blend = 0;

      // Draw Area Start/End
      drawArea = {
        start: { h: 0, v: 0 },
          end: { h: 0, v: 0 },
      };

      // Offset
      ofs = {
        h: 0, v: 0
      };

      render.resize({ w: 320, h: 240 });
      ctx.clear(ctx.COLOR_BUFFER_BIT);
    },

    resize(data) {
      // Same resolution? Ciao!
      if (data.w === res.native.w && data.h === res.native.h) {
        return;
      }

      // Check if we have a valid resolution
      if (data.w > 0 && data.h > 0) {
        // Store valid resolution
        res.native.w = data.w;
        res.native.h = data.h;

        // Native PSX resolution
        ctx.uniform2f(attrib._r, data.w/2, data.h/2);
        divRes.innerText = data.w+' x '+data.h;

        // Construct desired resolution
        var w = (res.override.w || data.w) * res.multiplier;
        var h = (res.override.h || data.h) * res.multiplier;

        divScreen.width = w;
        divScreen.hei   = h;
        ctx.viewport(0, 0, w, h);
      }
      else {
        console.info('Not a valid resolution');
      }
    },

    doubleResolution() {
      res.multiplier = res.multiplier === 1 ? 2 : 1;

      // Show/hide elements
      if (res.multiplier === 1) {
        divFooter.show();
      }
      else {
        divFooter.hide();
      }
      
      // Redraw
      var w = res.native.w;
      var h = res.native.h;

      res.native.w = -1;
      res.native.h = -1;

      render.resize({ w: w, h: h });
    },

    draw(addr, data) {
      // Primitives
      switch(addr&0xfc) {
        case 0x20: // POLY F3
          drawF(3, ctx.TRIANGLE_STRIP);
          return;

        case 0x24: // POLY FT3
          drawFT(3);
          return;

        case 0x28: // POLY F4
          drawF(4, ctx.TRIANGLE_STRIP);
          return;

        case 0x2c: // POLY FT4
          drawFT(4);
          return;

        case 0x30: // POLY G3
          drawG(3, ctx.TRIANGLE_STRIP);
          return;

        case 0x34: // POLY GT3
          drawGT(3);
          return;

        case 0x38: // POLY G4
          drawG(4, ctx.TRIANGLE_STRIP);
          return;

        case 0x3c: // POLY GT4
          drawGT(4);
          return;

        case 0x40: // LINE F2
          drawF(2, ctx.LINE_STRIP);
          return;

        case 0x48: // LINE F3
          drawF(3, ctx.LINE_STRIP);
          return;

        case 0x4c: // LINE F4
          drawF(4, ctx.LINE_STRIP);
          return;

        case 0x50: // LINE G2
          drawG(2, ctx.LINE_STRIP);
          return;

        case 0x58: // LINE G3
          drawG(3, ctx.LINE_STRIP);
          return;

        case 0x5c: // LINE G4
          drawG(4, ctx.LINE_STRIP);
          return;

        case 0x60: // TILE S
          drawTile(0);
          return;

        case 0x64: // SPRITE S
          drawSprite(0);
          return;

        case 0x68: // TILE 1
          drawTile(1);
          return;

        case 0x70: // TILE 8
          drawTile(8);
          return;

        case 0x74: // SPRITE 8
          drawSprite(8);
          return;

        case 0x78: // TILE 16
          drawTile(16);
          return;

        case 0x7c: // SPRITE 16
          drawSprite(16);
          return;
      }

      // Operations
      switch(addr) {
        case 0x01: // FLUSH
          return;

        case 0x02: // BLOCK FILL
          {
            var k  = TILEx(data);
            var cr = [];

            for (var i=0; i<4; i++) {
              cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, COLOR_MAX);
            }

            var vx = [
              k.vx[0].h,           k.vx[0].v,
              k.vx[0].h+k.vx[1].h, k.vx[0].v,
              k.vx[0].h,           k.vx[0].v+k.vx[1].v,
              k.vx[0].h+k.vx[1].h, k.vx[0].v+k.vx[1].v,
            ];

            composeColor(cr);
            composeVertex(vx);
            disableTexture();
            ctx.drawVertices(ctx.TRIANGLE_STRIP, 0, 4);
          }
          return;

        case 0x80: // MOVE IMAGE
          return;

        case 0xa0: // LOAD IMAGE
          vs.inread(data);
          return;

        case 0xc0: // STORE IMAGE
          return;

        case 0xe1: // TEXTURE PAGE
          blend = (data[0]>>>5)&3;
          spriteTP = data[0]&0x7ff;
          vs.texp(spriteTP);
          ctx.blendFunc(bit[blend].src, bit[blend].dest);
          return;

        case 0xe2: // TEXTURE WINDOW
          info[GPU_INFO_TEXTUREWINDOW] = data[0]&0xfffff;
          return;

        case 0xe3: // DRAW AREA START
          {
            var pane = {
              h: data[0]&0x3ff, v: (data[0]>>10)&0x1ff
            };

            drawArea.start.h = drawAreaCalc(pane.h);
            drawArea.start.v = drawAreaCalc(pane.v);

            info[GPU_INFO_DRAWAREASTART] = data[0]&0x3fffff;
          }
          return;

        case 0xe4: // DRAW AREA END
          {
            var pane = {
              h: data[0]&0x3ff, v: (data[0]>>10)&0x1ff
            };

            drawArea.end.h = drawAreaCalc(pane.h);
            drawArea.end.v = drawAreaCalc(pane.v);

            info[GPU_INFO_DRAWAREAEND] = data[0]&0x3fffff;
          }
          return;

        case 0xe5: // DRAW OFFSET
          ofs.h = (SIGN_EXT_32(data[0])<<21)>>21;
          ofs.v = (SIGN_EXT_32(data[0])<<10)>>21;

          info[GPU_INFO_OFFSET] = data[0]&0x7fffff;
          return;

        case 0xe6: // STP
          vs.stp(data);
          return;
      }
      cpu.consoleWrite(MSG_ERROR, 'GPU Render Primitive '+hex(addr));
    },

    infoRead(n) {
      return info[n];
    }
  };
})();
