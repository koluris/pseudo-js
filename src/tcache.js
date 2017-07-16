// Based on FPSE 0.08

#define vram vs.__vram

#define	TCACHE_MAX\
  2048

#define TEX_SIZE\
  256

pseudo.CstrTexCache = (function() {
  var stack, idx;

  var bTex  = union(TEX_SIZE*TEX_SIZE*4);
  var ctbl2 = union(TEX_SIZE*4);

  function pixel2texel(tx, p, n) {
    do {
      var c = vram.uh[p++];
      tx.ub[idx++] = (c>>0x0)<<3;
      tx.ub[idx++] = (c>>0x5)<<3;
      tx.ub[idx++] = (c>>0xa)<<3;
      tx.ub[idx++] = c ? COLOR_MAX : 0;
    }
    while (--n);
  }

  return {
    reset() {
      stack = [];
    },

    fetchTexture(ctx, tp, clut) {
      var id = tp | (clut<<16);
      
      if (stack[id]) {
        ctx.bindTexture(ctx.TEXTURE_2D, stack[id]);
        return;
      }

      var tex  = (tp&15)*64+(tp&16)*(FRAME_W*256/16);
      var ctbl = (clut&0x7fff)*16;

      switch((tp>>7)&3) {
        case 0: // 04-bit
          idx = 0;
          pixel2texel(ctbl2, ctbl, 16);
          idx = 0;
          for (var v=0; v<256; v++) {
            for (var h=0; h<256/4; h++) {
              var c = vram.uh[tex+h];
              bTex.uw[idx++] = ctbl2.uw[(c>> 0)&15];
              bTex.uw[idx++] = ctbl2.uw[(c>> 4)&15];
              bTex.uw[idx++] = ctbl2.uw[(c>> 8)&15];
              bTex.uw[idx++] = ctbl2.uw[(c>>12)&15];
            }
            tex += FRAME_W;
          }
          break;

        case 1: // 08-bit
          idx = 0;
          pixel2texel(ctbl2, ctbl, 256);
          idx = 0;
          for (var v=0; v<256; v++) {
            for (var h=0; h<256/2; h++) {
              var c = vram.uh[tex+h];
              bTex.uw[idx++] = ctbl2.uw[(c>>0)&255];
              bTex.uw[idx++] = ctbl2.uw[(c>>8)&255];
            }
            tex += FRAME_W;
          }
          break;

        case 2: // 16-bit
          idx = 0;
          for (var v=0; v<256; v++) {
            pixel2texel(bTex, tex, 256);
            tex += FRAME_W;
          }
          break;
      }

      // Create texture
      stack[id] = ctx.createTexture();
      ctx.bindTexture  (ctx.TEXTURE_2D, stack[id]);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
      ctx.texPhoto2D   (ctx.TEXTURE_2D, 0, ctx.RGBA, TEX_SIZE, TEX_SIZE, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, bTex.ub);
    }
  };
})();

#undef vram
