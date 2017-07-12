#define	TCACHE_MAX\
  2048

#define TEX_SIZE\
  256

pseudo.CstrTexCache = (function() {
  let stack;

  return {
    reset() {
      stack = [];
    },

    fetchTexture(ctx, tp, clut) {
      const id = tp | (clut<<16);
      
      if (stack[id]) {
        console.dir('Texture in cache '+id);
      }

      switch((tp>>7)&3) {
        case 0: // 04-bit
          psx.error('Texture cache '+((tp>>7)&3));
          break;

        case 1: // 08-bit
          psx.error('Texture cache '+((tp>>7)&3));
          break;

        case 2: // 16-bit
          psx.error('Texture cache '+((tp>>7)&3));
          break;
      }
    }
  };
})();
