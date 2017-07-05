pseudo.CstrRender = (function() {
  let screen, ctx;

  // Exposed class functions/variables
  return {
    awake(element) {
      // Canvas
      screen = element;
      ctx = screen[0].fetchContext(WebGL);
      ctx.clearColor(0.1, 0.2, 0.3, 1.0);
    },

    reset() {
      ctx.clear(ctx.COLOR_BUFFER_BIT);
    }
  };
})();
