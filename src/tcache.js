/* Base structure taken from FPSE open source emulator, and improved upon (Credits: BERO, LDChen) */

#define COLOR_32BIT(a, b, c, r) \
    (((a) & 0xff) << 24) | (((b) & 0xff) << 16) | (((c) & 0xff) << 8) | ((r) & 0xff)

pseudo.CstrTexCache = function() {
    const TEX_04BIT = 0;

    // Maximum texture cache
    const TCACHE_MAX = 384;
    const TEX_SIZE   = 256;

    let cache = [];
    let index;
    let tex;

    // Exposed class functions/variables
    return {
        init() {
            for (let i = 0; i < TCACHE_MAX; i++) {
                cache[i] = {
                    pos: { // Mem position of texture and color lookup table
                    },

                    tex: undefined
                };
            }

            tex = { // Texture and color lookup table buffer
                bfr: union(TEX_SIZE * TEX_SIZE * 4),
                cc : new UintWcap(256),
            };
        },

        reset(ctx) {
            // Reset texture cache
            for (const tc of cache) {
                if (tc.tex) {
                    ctx.deleteTexture(tc.tex);
                }
                tc.uid = -1;
            }
            index = 0;
        },

        pixel2texel(p) {
            return COLOR_32BIT(p ? 255 : 0, (p >>> 10) << 3, (p >>> 5) << 3, p << 3);
        },

        fetchTexture(ctx, tp, clut) {
            const uid = (clut << 16) | tp;

            // Basic info
            const tc  = cache[index];
            tc.pos.w  = (tp & 15) * 64;
            tc.pos.h  = ((tp >>> 4) & 1) * 256;
            tc.pos.cc = (clut & 0x7fff) * 16;

            // Reset
            tex.bfr.ub.fill(0);
            tex.cc.fill(0);

            switch((tp >>> 7) & 3) {
                case TEX_04BIT: // 16 color palette
                    for (let i = 0; i < 16; i++) {
                        tex.cc[i] = tcache.pixel2texel(vs.vram.uh[tc.pos.cc]);
                        tc.pos.cc++;
                    }

                    for (let h = 0, idx = 0; h < 256; h++) {
                        for (let w = 0; w < (256 / 4); w++) {
                            const p = vs.vram.uh[(tc.pos.h + h) * FRAME_W + tc.pos.w + w];
                            tex.bfr.uw[idx++] = tex.cc[(p >>>  0) & 15];
                            tex.bfr.uw[idx++] = tex.cc[(p >>>  4) & 15];
                            tex.bfr.uw[idx++] = tex.cc[(p >>>  8) & 15];
                            tex.bfr.uw[idx++] = tex.cc[(p >>> 12) & 15];
                        }
                    }
                    break;

                default:
                    console.info('Texture Cache Unknown ' + ((tp >>> 7) & 3));
                    break;
            }

            // Attach texture
            tc.tex = ctx.createTexture();
            ctx.bindTexture  (ctx.TEXTURE_2D, tc.tex);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
            ctx.texPhoto2D   (ctx.TEXTURE_2D, 0, ctx.RGBA, TEX_SIZE, TEX_SIZE, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, tex.bfr.ub);

            // Advance cache counter
            tc.uid = uid;
            index  = (index + 1) & (TCACHE_MAX - 1);
        }
    };
};

const tcache = new pseudo.CstrTexCache();
