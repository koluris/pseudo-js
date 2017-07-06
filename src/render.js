#define COLOR_MAX\
  255

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

#define POINT(data) {\
  _X: (data>> 0)&0xffff,\
  _Y: (data>>16)&0xffff,\
}

/***
    Primitive Structures
***/

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

/***
    Gouraud Vertices
***/

#define drawG(size, mode)\
  const k  = PGx(data);\
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
  ctx.drawVertices(mode, 0, size)

pseudo.CstrRender = (function() {
  let screen, resolution;
  
  let ctx;    // WebGL Context
  let attrib; // Enable/Disable Attributes on demand
  let bfr;    // Draw buffers

  // Generic function for shaders
  function createShader(kind, content) {
    var shader = ctx.createShader(kind);
    ctx.shaderSource (shader, content);
    ctx.compileShader(shader);
    ctx.fetchShaderParameter(shader, ctx.COMPILE_STATUS);

    return shader;
  }

  // Exposed class functions/variables
  return {
    awake(divScreen, divResolution) {
      // Get HTML elements
      screen     = divScreen;
      resolution = divResolution;

      // WebGL Canvas
      ctx = screen[0].fetchContext(WebGL);
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
    },

    reset() {
      render.resize({ w: 320, h: 240 });
      ctx.clear(ctx.COLOR_BUFFER_BIT);
    },

    resize(res) {
      // Check if we have a valid resolution
      if (res.w > 0 && res.h > 0) {
        screen.width = res.w;
        screen.hei   = res.h;
        ctx.viewport(0, 0, res.w, res.h);
        ctx.uniform2f(attrib._r, res.w/2, res.h/2);

        resolution.text(res.w+' x '+res.h);
      }
    },

    prim(addr, data) {
      switch(addr) {
        case 0x01: // FLUSH
          return;

        case 0x33: // POLY G3
          {
            drawG(3, ctx.TRIANGLE_STRIP);
          }
          return;

        case 0xa0: // LOAD IMAGE
          return;

        case 0xe1: // TEXTURE PAGE
          return;
      }
      r3ka.consoleWrite(MSG_ERROR, 'GPU Render Primitive '+hex(addr));
    }
  };
})();
