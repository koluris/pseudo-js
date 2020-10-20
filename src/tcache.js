#define vram vs.__vram

#define COLOR_32BIT(a, b, c, r) \
  ((a) << 24) | ((b) << 16) | ((c) << 8) | (r)

pseudo.CstrTexCache = (function() {
  const TEX_04BIT  = 0;
  const TEX_08BIT  = 1;
  const TEX_15BIT  = 2;

  // Maximum texture cache
  const TCACHE_MAX = 384;

  var cache;
  var index;

  return {
    init() {
      for (var i = 0; i < TCACHE_MAX; i++) {
        cache[i] = {
          pos: { // Mem position of texture and color lookup table
          },

          tex: 0
        };
      }
    },

    reset() {
      for (const tc in cache) {
        ctx.deleteTextures(1, tc.tex);
        tc.pos.w  = 0;
        tc.pos.h  = 0;
        tc.pos.cc = 0;
        tc.uid    = 0;
        tc.tex    = 0;

        createTexture(tc, 256, 256);
      }

      index = 0;
    },

    pixel2texel(p) {
      return COLOR_32BIT(p ? 255 : 0, (p >>> 10) << 3, (p >>> 5) << 3, p << 3);
    },

    createTexture(tc, w, h) {
      tc.tex = ctx.createTexture();
      ctx.bindTexture  (ctx.TEXTURE_2D, tc.tex);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
      ctx.texPhoto2D   (ctx.TEXTURE_2D, 0, ctx.RGBA, TEX_SIZE, TEX_SIZE, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, 0);
    },

    fetchTexture(tp, clut) {
      const uid = (clut << 16) | tp;

      for (const tc in cache) {
        if (tc.uid === uid) { // Found cached texture
          ctx.bindTexture(ctx.TEXTURE_2D, tc.tex);
          return;
        }
      }

      // Basic info
      const tc  = cache[index];
      tc.pos.w  = (tp & 15) * 64;
      tc.pos.h  = ((tp >>> 4) & 1) * 256;
      tc.pos.cc = (clut & 0x7fff) * 16;
    }
  };
})();

// #define	TCACHE_MAX\
//   384

// #define TEX_SIZE\
//   256

// pseudo.CstrTexCache = (function() {
//   var stack, idx;

//   var bTex  = union(TEX_SIZE*TEX_SIZE*4);
//   var ctbl2 = union(TEX_SIZE*4);

//   function pixel2texel(tx, p, n) {
//     do {
//       var c = vram.uh[p++];
//       tx.ub[idx++] = (c>>0x0)<<3;
//       tx.ub[idx++] = (c>>0x5)<<3;
//       tx.ub[idx++] = (c>>0xa)<<3;
//       tx.ub[idx++] = c ? COLOR_MAX : 0;
//     }
//     while (--n);
//   }

//   return {
//     reset() {
//       stack = [];
//     },

//     fetchTexture(ctx, tp, clut) {
//       var id = tp | (clut<<16);
      
//       if (stack[id]) {
//         ctx.bindTexture(ctx.TEXTURE_2D, stack[id]);
//         return;
//       }

//       var tex  = (tp&15)*64+(tp&16)*(FRAME_W*256/16);
//       var ctbl = (clut&0x7fff)*16;

//       switch((tp>>7)&3) {
//         case 0: // 04-bit
//           idx = 0;
//           pixel2texel(ctbl2, ctbl, 16);
//           idx = 0;
//           for (var v=0; v<256; v++) {
//             for (var h=0; h<256/4; h++) {
//               var c = vram.uh[tex+h];
//               bTex.uw[idx++] = ctbl2.uw[(c>> 0)&15];
//               bTex.uw[idx++] = ctbl2.uw[(c>> 4)&15];
//               bTex.uw[idx++] = ctbl2.uw[(c>> 8)&15];
//               bTex.uw[idx++] = ctbl2.uw[(c>>12)&15];
//             }
//             tex += FRAME_W;
//           }
//           break;

//         case 1: // 08-bit
//           idx = 0;
//           pixel2texel(ctbl2, ctbl, 256);
//           idx = 0;
//           for (var v=0; v<256; v++) {
//             for (var h=0; h<256/2; h++) {
//               var c = vram.uh[tex+h];
//               bTex.uw[idx++] = ctbl2.uw[(c>>0)&255];
//               bTex.uw[idx++] = ctbl2.uw[(c>>8)&255];
//             }
//             tex += FRAME_W;
//           }
//           break;

//         case 2: // 16-bit
//           idx = 0;
//           for (var v=0; v<256; v++) {
//             pixel2texel(bTex, tex, 256);
//             tex += FRAME_W;
//           }
//           break;
//       }

//       // Create texture
//       stack[id] = ctx.createTexture();
//       ctx.bindTexture  (ctx.TEXTURE_2D, stack[id]);
//       ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
//       ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
//       ctx.texPhoto2D   (ctx.TEXTURE_2D, 0, ctx.RGBA, TEX_SIZE, TEX_SIZE, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, bTex.ub);
//     },

//     invalidate(iX, iY, iW, iH) {
//       // for (const tc in stack) {
//       //   if (((tc.pos.w + 255) >= iX) && ((tc.pos.h + 255) >= iY) && ((tc.pos.w) <= iW) && ((tc.pos.h) <= iH)) {
//       //     tc.uid = 0;
//       //     continue;
//       //   }
//       // }
//     }
//   };
// })();

#undef vram
