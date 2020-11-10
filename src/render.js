/* Base structure and authentic idea PSeudo (Credits: Dennis Koluris) */

#undef RGB

#define COLOR_MAX \
    255

#define COLOR_HALF \
    COLOR_MAX >>> 1

/***
    Base components
***/

#define RGBC(data) { \
    a: (data >>>  0) & 0xff, \
    b: (data >>>  8) & 0xff, \
    c: (data >>> 16) & 0xff, \
    n: (data >>> 24) & 0xff, \
}

#define POINT(data) { \
    h: (data >>  0) & 0xffff, \
    v: (data >> 16) & 0xffff, \
}

#define UV(data) { \
    u: (data >>> 0) & 0xff, \
    v: (data >>> 8) & 0xff, \
}

#define TPAGE(data) \
    (data >>> 16) & 0xffff

/***
    Primitive Structures
***/

#define PGx(data) { \
    cr: [ \
        RGBC(data[0]), \
        RGBC(data[2]), \
        RGBC(data[4]), \
        RGBC(data[6]), \
    ], \
    vx: [ \
        POINT(data[1]), \
        POINT(data[3]), \
        POINT(data[5]), \
        POINT(data[7]), \
    ] \
}

#define TILEx(data) { \
    cr: [ \
        RGBC(data[0]) \
    ], \
    vx: [ \
        POINT(data[1]), \
        POINT(data[2]), \
    ] \
}

#define SPRTx(data) { \
    cr: [ \
        RGBC(data[0]) \
    ], \
    vx: [ \
        POINT(data[1]), \
        POINT(data[3]), \
    ], \
    tx: [ \
        UV(data[2]) \
    ], \
    tp: [ \
        TPAGE(data[2]) \
    ] \
}

pseudo.CstrRender = function() {
    let ctx, attrib, bfr, divRes; // Draw context
    let blend, bit, ofs;
    let drawArea, spriteTP;

    // Resolution
    const res = {
        w: 0,
        h: 0,
    };

    // Generic function for shaders
    function createShader(kind, content) {
        const shader = ctx.createShader(kind);
        ctx.shaderSource (shader, content);
        ctx.compileShader(shader);
        ctx.fetchShaderParameter(shader, ctx.COMPILE_STATUS);

        return shader;
    }

    function drawAreaCalc(n) {
        return Math.round((n * res.w) / 100);
    }

    // Compose Blend
    function composeBlend(a) {
        const b = [
            a & 2 ? blend : 0,
            a & 2 ? bit[blend].opaque : COLOR_MAX
        ];

        ctx.blendFunc(bit[b[0]].src, bit[b[0]].dest);
        return b[1];
    }

    function createColor(color) {
        ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c);
        ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0);
        ctx.bufferData(ctx.ARRAY_BUFFER, new UintBcap(color), ctx.DYNAMIC_DRAW);
    }

    function createVertex(vertex) {
        ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v);
        ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0);
        ctx.bufferData(ctx.ARRAY_BUFFER, new SintHcap(vertex), ctx.DYNAMIC_DRAW);
    }

    function createTexture(texture) {
        ctx.uniform1i(attrib._e, true);
        ctx.enableVertexAttrib(attrib._t);
        ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._t);
        ctx.vertexAttribPointer(attrib._t, 2, ctx.FLOAT, false, 0, 0);
        ctx.bufferData(ctx.ARRAY_BUFFER, new F32cap(texture), ctx.DYNAMIC_DRAW);
    }

    function disableTexture() {
        ctx.uniform1i(attrib._e, false);
        ctx.disableVertexAttrib(attrib._t);
    }

    function drawScene(color, vertex, texture, mode, size) {
        createColor   (color);
        createVertex (vertex);

        if (texture) {
            createTexture(texture.map(n => n / 256.0));
        }
        else {
            disableTexture();
        }

        ctx.drawVertices(mode, 0, size);
    }

    /***
        Gouraud Vertices
    ***/

    function drawG(data, size, mode) { \
        const p = PGx(data);
        let color  = [];
        let vertex = [];
        
        const opaque = composeBlend(p.cr[0].n);
        
        for (let i = 0; i < size; i++) {
            color.push(
                p.cr[i].a,
                p.cr[i].b,
                p.cr[i].c,
                opaque
            );

            vertex.push(
                p.vx[i].h + ofs.h,
                p.vx[i].v + ofs.v,
            );
        }

        drawScene(color, vertex, null, mode, size);
    }

    /***
        Sprites
    ***/

    function drawSprite(data, size) {
        const p = SPRTx(data);
        let color   = [];
        let vertex  = [];
        let texture = [];
        
        const opaque = composeBlend(p.cr[0].n);
        
        if (size) {
            p.vx[1].h = size;
            p.vx[1].v = size;
        }

        for (let i = 0; i < 4; i++) {
            if (p.cr[0].n & 1) {
                color.push(
                    COLOR_HALF,
                    COLOR_HALF,
                    COLOR_HALF,
                    opaque
                );
            }
            else {
                color.push(
                    p.cr[0].a,
                    p.cr[0].b,
                    p.cr[0].c,
                    opaque
                );
            }
        }

        vertex = [
            p.vx[0].h + ofs.h,             p.vx[0].v + ofs.v,
            p.vx[0].h + ofs.h + p.vx[1].h, p.vx[0].v + ofs.v,
            p.vx[0].h + ofs.h,             p.vx[0].v + ofs.v + p.vx[1].v,
            p.vx[0].h + ofs.h + p.vx[1].h, p.vx[0].v + ofs.v + p.vx[1].v,
        ];

        texture = [
            p.tx[0].u,             p.tx[0].v,
            p.tx[0].u + p.vx[1].h, p.tx[0].v,
            p.tx[0].u,             p.tx[0].v + p.vx[1].v,
            p.tx[0].u + p.vx[1].h, p.tx[0].v + p.vx[1].v,
        ];

        tcache.fetchTexture(ctx, spriteTP, p.tp[0]);
        drawScene(color, vertex, texture, ctx.TRIANGLE_STRIP, 4);
    }

    // Exposed class functions/variables
    return {
        init(canvas, resolution) {
            divRes = resolution[0];

            // Draw canvas
            ctx = canvas[0].fetchContext(WebGL);
            ctx.enable(ctx.BLEND);
            ctx.clearColor(21 / 255.0, 21 / 255.0, 21 / 255.0, 1.0);

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

            // Texture Cache
            tcache.init();
        },

        reset() {
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

            // Texture Cache
            tcache.reset(ctx);
            render.resize({ w: 640, h: 480 });
        },

        swapBuffers(clear) {
            if (clear) {
                ctx.clear(ctx.COLOR_BUFFER_BIT);
            }
        },

        resize(data) {
            // Same resolution? Ciao!
            if (data.w === res.w && data.h === res.h) {
                return;
            }
    
            // Check if we have a valid resolution
            if (data.w > 0 && data.h > 0) {
                // Store valid resolution
                res.w = data.w;
                res.h = data.h;
              
                //ctx.uniform2f(attrib._r, res.w / 2, res.h / 2);
                //ctx.viewport((640 - res.w) / 2, (480 - res.h) / 2, res.w, res.h);
                ctx.uniform2f(attrib._r, res.w / 2, res.h / 2);
                ctx.viewport(0, 0, 640, 480);
                render.swapBuffers(true);
    
                divRes.innerText = res.w + ' x ' + res.h;
            }
        },

        draw(addr, data) {
            // Primitives
            switch(addr & 0xfc) {
                case 0x38: // POLY G4
                    drawG(data, 4, ctx.TRIANGLE_STRIP);
                    return;

                case 0x74: // SPRITE 8
                    drawSprite(data, 8);
                    return;

                case 0x7c: // SPRITE 16
                    drawSprite(data, 16);
                    return;
            }

            // Operations
            switch(addr) {
                case 0x01: // FLUSH
                    vs.scopeW(0x1f801814, 0x01000000);
                    return;

                case 0x02: // BLOCK FILL
                    {
                        const p = TILEx(data);
                        let color  = [];
                        let vertex = [];

                        for (let i = 0; i < 4; i++) {
                            color.push(
                                p.cr[0].a,
                                p.cr[0].b,
                                p.cr[0].c,
                                COLOR_MAX
                            );
                        }

                        vertex = [
                            p.vx[0].h,             p.vx[0].v,
                            p.vx[0].h + p.vx[1].h, p.vx[0].v,
                            p.vx[0].h,             p.vx[0].v + p.vx[1].v,
                            p.vx[0].h + p.vx[1].h, p.vx[0].v + p.vx[1].v,
                        ];
                        
                        drawScene(color, vertex, null, ctx.TRIANGLE_STRIP, 4);
                    }
                    return;

                case 0xa0: // LOAD IMAGE
                    vs.photoRead(data);
                    return;

                case 0xe1: // TEXTURE PAGE
                    blend = (data[0] >>> 5) & 3;
                    spriteTP = data[0] & 0x7ff;
                    ctx.blendFunc(bit[blend].src, bit[blend].dest);
                    return;

                case 0xe3: // DRAW AREA START
                    {
                        const pane = {
                            h: data[0] & 0x3ff, v: (data[0] >> 10) & 0x1ff
                        };

                        drawArea.start.h = drawAreaCalc(pane.h);
                        drawArea.start.v = drawAreaCalc(pane.v);
                    }
                    return;

                case 0xe4: // DRAW AREA END
                    {
                        const pane = {
                            h: data[0] & 0x3ff, v: (data[0] >> 10) & 0x1ff
                        };

                        drawArea.end.h = drawAreaCalc(pane.h);
                        drawArea.end.v = drawAreaCalc(pane.v);
                    }
                    return;

                case 0xe5: // DRAW OFFSET
                    ofs.h = (SIGN_EXT_32(data[0]) << 21) >> 21;
                    ofs.v = (SIGN_EXT_32(data[0]) << 10) >> 21;
                    return;
            }

            psx.error('GPU Render Primitive ' + psx.hex(addr));
        }
    };
};

const render = new pseudo.CstrRender();
