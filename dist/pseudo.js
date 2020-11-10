// Preprocessor
// A kind of helper for various data manipulation
function union(size) {
    const bfr = new ArrayBuffer(size);
    return {
        uw: new Uint32Array(bfr),
        uh: new Uint16Array(bfr),
        ub: new Uint8Array(bfr),
        sw: new Int32Array(bfr),
        sh: new Int16Array(bfr),
        sb: new Int8Array(bfr),
    };
}
// Declare our namespace
'use strict';
const pseudo = window.pseudo || {};
pseudo.CstrHardware = function() {
    return {
        write: {
            w(addr, data) {
                switch(true) {
                    case (addr >= 0x1080 && addr <= 0x10e8): // DMA
                        mem.hwr.uw[(( addr) & (mem.hwr.uw.byteLength - 1)) >>> 2] = data;
                        if (addr & 8) {
                            const chan = ((addr >>> 4) & 0xf) - 8;
                            if (chan === 2) {
                                vs.executeDMA(addr);
                            }
                            mem.hwr.uw[(((addr & 0xfff0) | 8) & (mem.hwr.uw.byteLength - 1)) >>> 2] = data & (~(0x01000000));
                        }
                        return;
                    case (addr >= 0x1810 && addr <= 0x1814): // Graphics
                        vs.scopeW(addr, data);
                        return;
                    
                    case (addr == 0x10f0): // DPCR
                    case (addr == 0x10f4): // DICR
                        mem.hwr.uw[(( addr) & (mem.hwr.uw.byteLength - 1)) >>> 2] = data;
                        return;
                }
                psx.error('Hardware Write w ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            }
        },
        read: {
            w(addr) {
                switch(true) {
                    case (addr >= 0x1810 && addr <= 0x1814): // Graphics
                        return vs.scopeR(addr);
                    
                    case (addr >= 0x1080 && addr <= 0x10e8): // DMA
                    case (addr == 0x10f0): // DPCR
                        return mem.hwr.uw[(( addr) & (mem.hwr.uw.byteLength - 1)) >>> 2];
                }
                psx.error('Hardware Read w ' + psx.hex(addr));
            }
        }
    };
};
const io = new pseudo.CstrHardware();
pseudo.CstrMem = function() {
    const PSX_EXE_HEADER_SIZE = 0x800;
    // Exposed class functions/variables
    return {
        ram: union(0x200000),
        hwr: union(0x4000),
        reset() {
            // Reset all, except for BIOS
            mem.ram.ub.fill(0);
            mem.hwr.ub.fill(0);
        },
        writeExecutable(data) {
            const header = new Uint32Array(data, 0, PSX_EXE_HEADER_SIZE);
            const offset = header[2 + 4] & (mem.ram.ub.byteLength - 1); // Offset needs boundaries...
            const size   = header[2 + 5];
            mem.ram.ub.set(new Uint8Array(data, PSX_EXE_HEADER_SIZE, size), offset);
            return header;
        },
        write: {
            w(addr, data) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: mem.ram. uw[((addr) & (mem.ram. uw.byteLength - 1)) >>> 2] = data; return; case 0x1f: if ((addr & 0xffff) >= 0x400) { io.write. w(addr & 0xffff, data); return; } mem.hwr. uw[((addr) & (mem.hwr. uw.byteLength - 1)) >>> 2] = data; return; } psx.error('Mem W ' +  '32' + ' ' + psx.hex(addr) + ' <- ' + psx.hex(data)); },
            h(addr, data) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: mem.ram. uh[((addr) & (mem.ram. uh.byteLength - 1)) >>> 1] = data; return; case 0x1f: if ((addr & 0xffff) >= 0x400) { io.write. h(addr & 0xffff, data); return; } mem.hwr. uh[((addr) & (mem.hwr. uh.byteLength - 1)) >>> 1] = data; return; } psx.error('Mem W ' +  '16' + ' ' + psx.hex(addr) + ' <- ' + psx.hex(data)); },
            b(addr, data) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: mem.ram. ub[((addr) & (mem.ram. ub.byteLength - 1)) >>> 0] = data; return; case 0x1f: if ((addr & 0xffff) >= 0x400) { io.write. b(addr & 0xffff, data); return; } mem.hwr. ub[((addr) & (mem.hwr. ub.byteLength - 1)) >>> 0] = data; return; } psx.error('Mem W ' +  '08' + ' ' + psx.hex(addr) + ' <- ' + psx.hex(data)); },
        },
        read: {
            w(addr) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: return mem.ram. uw[((addr) & (mem.ram. uw.byteLength - 1)) >>> 2]; case 0xbf: return mem.rom. uw[((addr) & (mem.rom. uw.byteLength - 1)) >>> 2]; case 0x1f: if ((addr & 0xffff) >= 0x400) { return io.read. w(addr & 0xffff); } return mem.hwr. uw[((addr) & (mem.hwr. uw.byteLength - 1)) >>> 2]; } psx.error('Mem R ' +  '32' + ' ' + psx.hex(addr)); return 0; },
            h(addr) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: return mem.ram. uh[((addr) & (mem.ram. uh.byteLength - 1)) >>> 1]; case 0xbf: return mem.rom. uh[((addr) & (mem.rom. uh.byteLength - 1)) >>> 1]; case 0x1f: if ((addr & 0xffff) >= 0x400) { return io.read. h(addr & 0xffff); } return mem.hwr. uh[((addr) & (mem.hwr. uh.byteLength - 1)) >>> 1]; } psx.error('Mem R ' +  '16' + ' ' + psx.hex(addr)); return 0; },
            b(addr) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: return mem.ram. ub[((addr) & (mem.ram. ub.byteLength - 1)) >>> 0]; case 0xbf: return mem.rom. ub[((addr) & (mem.rom. ub.byteLength - 1)) >>> 0]; case 0x1f: if ((addr & 0xffff) >= 0x400) { return io.read. b(addr & 0xffff); } return mem.hwr. ub[((addr) & (mem.hwr. ub.byteLength - 1)) >>> 0]; } psx.error('Mem R ' +  '08' + ' ' + psx.hex(addr)); return 0; },
        },
        executeDMA(addr) {
            if (!mem.hwr.uw[(((addr & 0xfff0) | 4) & (mem.hwr.uw.byteLength - 1)) >>> 2] || mem.hwr.uw[(((addr & 0xfff0) | 8) & (mem.hwr.uw.byteLength - 1)) >>> 2] !== 0x11000002) {
                return;
            }
            let p = mem.hwr.uw[(((addr & 0xfff0) | 0) & (mem.hwr.uw.byteLength - 1)) >>> 2];
            for (let i = mem.hwr.uw[(((addr & 0xfff0) | 4) & (mem.hwr.uw.byteLength - 1)) >>> 2] - 1; i >= 0; i--, p -= 4) {
                mem.write.w(p, (i == 0) ? 0xffffff : (p - 4) & 0xffffff);
            }
        }
    };
};
const mem = new pseudo.CstrMem();
// Inline functions for speedup
pseudo.CstrMips = function() {
    // Base + Coprocessor
    const base = new Uint32Array(32 + 3); // + cpu.base[32], lo, hi
    let ptr, suspended, requestAF;
    // Base CPU stepper
    function step(inslot) {
        //cpu.base[0] = 0; // As weird as this seems, it is needed
        const code  = ptr[(( cpu.base[32]) & (ptr.byteLength - 1)) >>> 2];
        cpu.base[32] += 4;
        switch(((code >>> 26) & 0x3f)) {
            case 0: // SPECIAL
                switch(code & 0x3f) {
                    case 0: // SLL
                        if (code) { // No operation?
                            cpu.base[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 16) & 0x1f)] << ((code >>> 6) & 0x1f);
                        }
                        return;
                    case 2: // SRL
                        cpu.base[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 16) & 0x1f)] >>> ((code >>> 6) & 0x1f);
                        return;
                    case 8: // JR
                        branch(cpu.base[((code >>> 21) & 0x1f)]);
                        ptr = mem.ram.uw;
                        return;
                    case 36: // AND
                        cpu.base[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] & cpu.base[((code >>> 16) & 0x1f)];
                        return;
                    case 37: // OR
                        cpu.base[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] | cpu.base[((code >>> 16) & 0x1f)];
                        return;
                }
                psx.error('Special CPU instruction ' + (code & 0x3f));
                return;
            case 2: // J
                branch(((cpu.base[32] & 0xf0000000) | (code & 0x3ffffff) << 2));
                return;
            case 3: // JAL
                cpu.base[31] = cpu.base[32] + 4;
                branch(((cpu.base[32] & 0xf0000000) | (code & 0x3ffffff) << 2));
                return;
            case 4: // BEQ
                if (cpu.base[((code >>> 21) & 0x1f)] === cpu.base[((code >>> 16) & 0x1f)]) {
                    branch((cpu.base[32] + ((((code) << 16 >> 16)) << 2)));
                }
                return;
            case 5: // BNE
                if (cpu.base[((code >>> 21) & 0x1f)] !== cpu.base[((code >>> 16) & 0x1f)]) {
                    branch((cpu.base[32] + ((((code) << 16 >> 16)) << 2)));
                }
                return;
            case 7: // BGTZ
                if (((cpu.base[((code >>> 21) & 0x1f)]) << 0 >> 0) > 0) {
                    branch((cpu.base[32] + ((((code) << 16 >> 16)) << 2)));
                }
                return;
            case 9: // ADDIU
                cpu.base[((code >>> 16) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16));
                return;
            case 10: // SLTI
                cpu.base[((code >>> 16) & 0x1f)] = ((cpu.base[((code >>> 21) & 0x1f)]) << 0 >> 0) < (((code) << 16 >> 16));
                return;
            case 12: // ANDI
                cpu.base[((code >>> 16) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] & (code & 0xffff);
                return;
            case 13: // ORI
                cpu.base[((code >>> 16) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] | (code & 0xffff);
                return;
            case 15: // LUI
                cpu.base[((code >>> 16) & 0x1f)] = code << 16;
                return;
            case 33: // LH
                cpu.base[((code >>> 16) & 0x1f)] = ((mem.read.h((cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))))) << 16 >> 16);
                return;
            case 35: // LW
                cpu.base[((code >>> 16) & 0x1f)] = mem.read.w((cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))));
                return;
            case 36: // LBU
                cpu.base[((code >>> 16) & 0x1f)] = mem.read.b((cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))));
                return;
            case 40: // SB
                mem.write.b((cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))), cpu.base[((code >>> 16) & 0x1f)]);
                return;
            case 41: // SH
                mem.write.h((cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))), cpu.base[((code >>> 16) & 0x1f)]);
                return;
            case 43: // SW
                mem.write.w((cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))), cpu.base[((code >>> 16) & 0x1f)]);
                return;
        }
        psx.error('Basic CPU instruction ' + ((code >>> 26) & 0x3f));
    }
    function branch(addr) {
        // Execute instruction in slot
        step(true);
        cpu.base[32] = addr;
    }
    // Exposed class functions/variables
    return {
        base: new Uint32Array(32 + 1),
        reset() {
            // Break emulation loop
            cpu.pause();
            // Reset processors
            cpu.base.fill(0);
            cpu.base[32] = 0xbfc00000;
            ptr = mem.ram.uw;
        },
        run() {
            suspended = false;
            requestAF = requestAnimationFrame(cpu.run);
            let vbk = 0;
            while(!suspended) { // And u don`t stop!
                step(false);
                vbk += 64;
                if (vbk >= 100000) { vbk = 0;
                    cpu.setSuspended();
                }
            }
        },
        parseExeHeader(header) {
            cpu.base[28] = header[2 + 3];
            cpu.base[29] = header[2 + 10];
            cpu.base[32] = header[2 + 2];
            ptr = mem.ram.uw;
        },
        setSuspended() {
            suspended = true;
        },
        pause() {
            cancelAnimationFrame(requestAF);
            requestAF = undefined;
            suspended = true;
        },
        resume() {
            cpu.run();
        },
        setpc(addr) {
            ptr = mem.ram.uw;
        }
    };
};
const cpu = new pseudo.CstrMips();
pseudo.CstrMain = function() {
    // AJAX function
    function request(path, fn) {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
            fn(xhr.response);
        };
        xhr.responseType = 'arraybuffer';
        xhr.open('GET', path);
        xhr.send();
    }
    return {
        init(screen) {
            render.init(screen);
            request('print-text.exe', function(resp) {
                   cpu.reset();
                   mem.reset();
                render.reset();
                    vs.reset();
                cpu.parseExeHeader(
                    mem.writeExecutable(resp)
                );
                cpu.run();
            });
        },
        hex(number) {
            return '0x' + (number >>> 0).toString(16);
        },
        error(out) {
            cpu.pause();
            throw new Error('/// PSeudo ' + out);
        }
    };
};
const psx = new pseudo.CstrMain();
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
        ctx.getShaderParameter(shader, ctx.COMPILE_STATUS);
        return shader;
    }
    function drawScene(color, vertex, texture, mode, size) {
        ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c);
        ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0);
        ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(color), ctx.DYNAMIC_DRAW);
        ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v);
        ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0);
        ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vertex), ctx.DYNAMIC_DRAW);
        ctx.drawArrays(mode, 0, size);
    }
    
    function drawG(data, size, mode) {          const p = { cr: [ { a: (data[0] >>> 0) & 0xff, b: (data[0] >>> 8) & 0xff, c: (data[0] >>> 16) & 0xff, n: (data[0] >>> 24) & 0xff, }, { a: (data[2] >>> 0) & 0xff, b: (data[2] >>> 8) & 0xff, c: (data[2] >>> 16) & 0xff, n: (data[2] >>> 24) & 0xff, }, { a: (data[4] >>> 0) & 0xff, b: (data[4] >>> 8) & 0xff, c: (data[4] >>> 16) & 0xff, n: (data[4] >>> 24) & 0xff, }, { a: (data[6] >>> 0) & 0xff, b: (data[6] >>> 8) & 0xff, c: (data[6] >>> 16) & 0xff, n: (data[6] >>> 24) & 0xff, }, ], vx: [ { h: (data[1] >> 0) & 0xffff, v: (data[1] >> 16) & 0xffff, }, { h: (data[3] >> 0) & 0xffff, v: (data[3] >> 16) & 0xffff, }, { h: (data[5] >> 0) & 0xffff, v: (data[5] >> 16) & 0xffff, }, { h: (data[7] >> 0) & 0xffff, v: (data[7] >> 16) & 0xffff, }, ] };
        
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
    
    function drawSprite(data, size) {
        const p = { cr: [ { a: (data[0] >>> 0) & 0xff, b: (data[0] >>> 8) & 0xff, c: (data[0] >>> 16) & 0xff, n: (data[0] >>> 24) & 0xff, } ], vx: [ { h: (data[1] >> 0) & 0xffff, v: (data[1] >> 16) & 0xffff, }, { h: (data[3] >> 0) & 0xffff, v: (data[3] >> 16) & 0xffff, }, ] };
        let color   = [];
        let vertex  = [];
        let texture = [];
        if (size) {
            p.vx[1].h = size;
            p.vx[1].v = size;
        }
        for (let i = 0; i < 4; i++) {
            color.push(
                127,
                127,
                127,
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
            ctx = canvas[0].getContext('webgl2', { antialias: false, depth: false, desynchronized: true, preserveDrawingBuffer: true, stencil: false });
            // Shaders
            const func = ctx.createProgram();
            ctx.attachShader(func, createShader(ctx.  VERTEX_SHADER, '     attribute vec2 a_position;     attribute vec4 a_color;     uniform vec2 u_resolution;     varying vec4 v_color;         void main() {         gl_Position = vec4(((a_position / u_resolution) - 1.0) * vec2(1, -1), 0, 1);         v_color = a_color;     }'));
            ctx.attachShader(func, createShader(ctx.FRAGMENT_SHADER, '     precision mediump float;     uniform sampler2D u_texture;     varying vec4 v_color;     varying vec2 v_texCoord;         void main() {         gl_FragColor = v_color;     }'));
            ctx.linkProgram(func);
            ctx.getProgramParameter(func, ctx.LINK_STATUS);
            ctx.useProgram (func);
            // Attributes
            attrib = {
                _c: ctx.getAttribLocation(func, 'a_color'),
                _p: ctx.getAttribLocation(func, 'a_position'),
                _r: ctx.getUniformLocation  (func, 'u_resolution'),
            };
            ctx.enableVertexAttribArray(attrib._c);
            ctx.enableVertexAttribArray(attrib._p);
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
                
                case 0x01: // FLUSH
                case 0x02: // BLOCK FILL
                case 0xa0: // LOAD IMAGE
                case 0xe1: // TEXTURE PAGE
                case 0xe3: // DRAW AREA START
                case 0xe4: // DRAW AREA END
                case 0xe5: // DRAW OFFSET
                    return;
            }
            psx.error('GPU Render Primitive ' + psx.hex(addr & 0xfc));
        }
    };
};
const render = new pseudo.CstrRender();
pseudo.CstrGraphics = function() {
    // Constants
    const GPU_DMA_NONE     = 0;
    const GPU_DMA_FIFO     = 1;
    const GPU_DMA_MEM2VRAM = 2;
    const GPU_DMA_VRAM2MEM = 3;
    // Primitive Size
    const pSize = [
        0x00,0x01,0x03,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x04,0x04,0x04,0x04,0x07,0x07,0x07,0x07, 0x05,0x05,0x05,0x05,0x09,0x09,0x09,0x09,
        0x06,0x06,0x06,0x06,0x09,0x09,0x09,0x09, 0x08,0x08,0x08,0x08,0x0c,0x0c,0x0c,0x0c,
        0x03,0x03,0x03,0x03,0x00,0x00,0x00,0x00, 0xfe,0xfe,0xfe,0xfe,0xfe,0xfe,0xfe,0xfe,
        0x04,0x04,0x04,0x04,0x00,0x00,0x00,0x00, 0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
        0x03,0x03,0x03,0x03,0x04,0x04,0x04,0x04, 0x02,0x02,0x02,0x02,0x03,0x03,0x03,0x03,
        0x02,0x02,0x02,0x02,0x03,0x03,0x03,0x03, 0x02,0x02,0x02,0x02,0x03,0x03,0x03,0x03,
        0x04,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x03,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x03,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x00,0x01,0x01,0x01,0x01,0x01,0x01,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    ];
    const ret = {
          data: 0,
        status: 0,
    };
    // Command Pipeline
    const pipe = {
        data: new Uint32Array(256)
    };
    // Resolution Mode
    const resMode = [
        256, 320, 512, 640, 368, 384, 512, 640
    ];
    let modeDMA;
    function pipeReset() {
        pipe.data.fill(0);
        pipe.prim = 0;
        pipe.size = 0;
        pipe.row  = 0;
    }
    const dataMem = {
        write(stream, addr, size) {
            let i = 0;
            while (i < size) {
                ret.data = stream ? mem.ram.uw[(( addr) & (mem.ram.uw.byteLength - 1)) >>> 2] : addr;
                addr += 4;
                i++;
                if (!pipe.size) {
                    const prim  = ((ret.data >>> 24) & 0xff);
                    const count = pSize[prim];
                    if (count) {
                        pipe.data[0] = ret.data;
                        pipe.prim = prim;
                        pipe.size = count;
                        pipe.row  = 1;
                    }
                    else {
                        continue;
                    }
                }
                else {
                    pipe.data[pipe.row] = ret.data;
                    pipe.row++;
                }
                if (pipe.size === pipe.row) {
                    pipe.size = 0;
                    pipe.row  = 0;
                    render.draw(pipe.prim, pipe.data);
                }
            }
        }
    };
    // Exposed class functions/variables
    return {
        vram: union(1024 * 512 * 2),
        reset() {
            vs.vram.uh.fill(0);
            ret.status = 0;
            modeDMA    = GPU_DMA_NONE;
            // Command Pipe
            pipeReset();
        },
        scopeW(addr, data) {
            switch(addr & 0xf) {
                case 0: // Data
                    dataMem.write(false, data, 1);
                    return;
                case 4: // Status
                    switch(((data >>> 24) & 0xff)) {
                        case 0x00:
                            ret.status = 0x14802000;
                            return;
                        case 0x04:
                            modeDMA = data & 3;
                            return;
                        case 0x08:
                            render.resize({
                                w: resMode[(data & 3) | ((data & 0x40) >>> 4)],
                                h: (data & 4) ? 480 : 240
                            });
                            return;
                        
                        case 0x03:
                        case 0x05:
                        case 0x06:
                        case 0x07:
                            return;
                    }
                    psx.error('GPU Write Status ' + psx.hex(((data >>> 24) & 0xff)));
                    return;
            }
        },
        scopeR(addr) {
            switch(addr & 0xf) {
                case 0: // Data
                    return ret.data;
                case 4: // Status
                    return ret.status;
            }
        },
        executeDMA(addr) {
            const size = (mem.hwr.uw[(((addr & 0xfff0) | 4) & (mem.hwr.uw.byteLength - 1)) >>> 2] >>> 16) * (mem.hwr.uw[(((addr & 0xfff0) | 4) & (mem.hwr.uw.byteLength - 1)) >>> 2] & 0xffff);
            switch(mem.hwr.uw[(((addr & 0xfff0) | 8) & (mem.hwr.uw.byteLength - 1)) >>> 2]) {
                case 0x01000401:
                    while(mem.hwr.uw[(((addr & 0xfff0) | 0) & (mem.hwr.uw.byteLength - 1)) >>> 2] !== 0xffffff) {
                        const count = mem.ram.uw[(( mem.hwr.uw[(((addr & 0xfff0) | 0) & (mem.hwr.uw.byteLength - 1)) >>> 2]) & (mem.ram.uw.byteLength - 1)) >>> 2];
                        dataMem.write(true, mem.hwr.uw[(((addr & 0xfff0) | 0) & (mem.hwr.uw.byteLength - 1)) >>> 2] + 4, count >>> 24);
                        mem.hwr.uw[(((addr & 0xfff0) | 0) & (mem.hwr.uw.byteLength - 1)) >>> 2] = count & 0xffffff;
                    }
                    return;
                
                case 0x00000401: // Disable DMA?
                case 0x01000200: // Read
                case 0x01000201: // Write
                    return;
            }
            psx.error('GPU DMA ' + psx.hex(mem.hwr.uw[(((addr & 0xfff0) | 8) & (mem.hwr.uw.byteLength - 1)) >>> 2]));
        }
    };
};
const vs = new pseudo.CstrGraphics();
