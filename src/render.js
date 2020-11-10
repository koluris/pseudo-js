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
    let ctx, attrib, bfr; // Draw context

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

    function drawScene(color, vertex, texture, mode, size) {
        createColor   (color);
        createVertex (vertex);
        ctx.drawVertices(mode, 0, size);
    }

    /***
        Gouraud Vertices
    ***/

    function drawG(data, size, mode) { \
        const p = PGx(data);
        let color  = [];
        let vertex = [];

        for (let i = 0; i < size; i++) {
            color.push(
                p.cr[i].a,
                p.cr[i].b,
                p.cr[i].c,
                255
            );

            vertex.push(
                p.vx[i].h,
                p.vx[i].v,
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

        if (size) {
            p.vx[1].h = size;
            p.vx[1].v = size;
        }

        for (let i = 0; i < 4; i++) {
            color.push(
                COLOR_HALF,
                COLOR_HALF,
                COLOR_HALF,
                255
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

    // Exposed class functions/variables
    return {
        init(canvas) {
            // Draw canvas
            ctx = canvas[0].fetchContext(WebGL);

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
                _r: ctx.fetchUniform  (func, 'u_resolution'),
            };

            ctx.enableVertexAttrib(attrib._c);
            ctx.enableVertexAttrib(attrib._p);

            // Buffers
            bfr = {
                _c: ctx.createBuffer(),
                _v: ctx.createBuffer(),
            };
        },

        reset() {
            render.resize({ w: 640, h: 480 });
        },

        resize(data) {
            // Store valid resolution
            res.w = data.w;
            res.h = data.h;

            ctx.uniform2f(attrib._r, res.w / 2, res.h / 2);
            ctx.viewport(0, 0, 640, 480);
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
                case 0xa0: // LOAD IMAGE
                    vs.photoRead(data);
                    return;

                /* unused */
                case 0x01: // FLUSH
                case 0x02: // BLOCK FILL
                case 0xe1: // TEXTURE PAGE
                case 0xe3: // DRAW AREA START
                case 0xe4: // DRAW AREA END
                case 0xe5: // DRAW OFFSET
                    return;
            }

            psx.error('GPU Render Primitive ' + psx.hex(addr));
        }
    };
};

const render = new pseudo.CstrRender();
