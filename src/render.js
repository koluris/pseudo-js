pseudo.CstrRender = (function() {
  let screen, resolution;
  let ctx;

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
    },

    reset() {
      render.resize({ w: 320, h: 240 });
      ctx.clear(ctx.COLOR_BUFFER_BIT);
    },

    resize(res) {
      // Check, if we have a valid resolution
      if (res.w > 0 && res.h > 0) {
        screen.width = res.w;
        screen.hei   = res.h;

        resolution.text(res.w+' x '+res.h);
      }
    }
  };
})();
