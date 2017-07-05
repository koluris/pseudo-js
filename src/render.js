pseudo.CstrRender = (function() {
  let screen, resolution;
  let ctx;

  // Exposed class functions/variables
  return {
    awake(divScreen, divResolution) {
      // Get HTML elements
      screen     = divScreen;
      resolution = divResolution;

      // Canvas
      ctx = screen[0].fetchContext(WebGL);
      ctx.clearColor(0.1, 0.2, 0.3, 1.0);
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
