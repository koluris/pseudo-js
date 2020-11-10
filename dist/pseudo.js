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
                switch(addr) {
                    case 0x10a8: // GPU DMA mem.hwr.uw[(((addr & 0xfff0) | 8) & (mem.hwr.uw.byteLength - 1)) >>> 2]
                        mem.hwr.uw[(((addr & 0xfff0) | 8) & (mem.hwr.uw.byteLength - 1)) >>> 2] = data;
                        vs.executeDMA(addr);
                        mem.hwr.uw[(((addr & 0xfff0) | 8) & (mem.hwr.uw.byteLength - 1)) >>> 2] = data & (~(0x01000000));
                        return;
                    case 0x1810: // GPU Data
                        vs.writeData(data);
                        return;
                    
                    case 0x10a0: // GPU DMA mem.hwr.uw[(((addr & 0xfff0) | 0) & (mem.hwr.uw.byteLength - 1)) >>> 2]
                    case 0x10a4: // GPU DMA mem.hwr.uw[(((addr & 0xfff0) | 4) & (mem.hwr.uw.byteLength - 1)) >>> 2]
                    case 0x10f0: // DPCR
                    case 0x10f4: // DICR
                    case 0x1814: // GPU Status
                        mem.hwr.uw[(( addr) & (mem.hwr.uw.byteLength - 1)) >>> 2] = data;
                        return;
                }
            }
        },
        read: {
            w(addr) {
                switch(addr) {
                    case 0x1814: // GPU Status
                        return 0x14802000;
                    
                    case 0x10a8: // GPU DMA mem.hwr.uw[(((addr & 0xfff0) | 8) & (mem.hwr.uw.byteLength - 1)) >>> 2]
                    case 0x10f0: // DPCR
                    case 0x1810: // GPU Data
                        return mem.hwr.uw[(( addr) & (mem.hwr.uw.byteLength - 1)) >>> 2];
                }
            }
        }
    };
};
const io = new pseudo.CstrHardware();
pseudo.CstrMem = function() {
    const PSX_EXE_HEADER_SIZE = 0x800;
    return {
        ram: union(0x200000),
        hwr: union(0x4000),
        writeExecutable(data) {
            const header = new Uint32Array(data, 0, PSX_EXE_HEADER_SIZE);
            const offset = header[6];
            const exe = new Uint8Array(data, PSX_EXE_HEADER_SIZE);
            for (let i = 0; i < exe.byteLength; i++) {
                mem.ram.ub[(( offset + i) & (mem.ram.ub.byteLength - 1)) >>> 0] = exe[i];
            }
            return header;
        },
        write: {
            w(addr, data) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: mem.ram. uw[((addr) & (mem.ram. uw.byteLength - 1)) >>> 2] = data; return; case 0x1f: if ((addr & 0xffff) >= 0x400) { io.write. w(addr & 0xffff, data); return; } mem.hwr. uw[((addr) & (mem.hwr. uw.byteLength - 1)) >>> 2] = data; return; }; },
            h(addr, data) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: mem.ram. uh[((addr) & (mem.ram. uh.byteLength - 1)) >>> 1] = data; return; case 0x1f: if ((addr & 0xffff) >= 0x400) { io.write. h(addr & 0xffff, data); return; } mem.hwr. uh[((addr) & (mem.hwr. uh.byteLength - 1)) >>> 1] = data; return; }; },
            b(addr, data) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: mem.ram. ub[((addr) & (mem.ram. ub.byteLength - 1)) >>> 0] = data; return; case 0x1f: if ((addr & 0xffff) >= 0x400) { io.write. b(addr & 0xffff, data); return; } mem.hwr. ub[((addr) & (mem.hwr. ub.byteLength - 1)) >>> 0] = data; return; }; },
        },
        read: {
            w(addr) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: return mem.ram. uw[((addr) & (mem.ram. uw.byteLength - 1)) >>> 2]; case 0xbf: return mem.rom. uw[((addr) & (mem.rom. uw.byteLength - 1)) >>> 2]; case 0x1f: if ((addr & 0xffff) >= 0x400) { return io.read. w(addr & 0xffff); } return mem.hwr. uw[((addr) & (mem.hwr. uw.byteLength - 1)) >>> 2]; } return 0; },
            h(addr) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: return mem.ram. uh[((addr) & (mem.ram. uh.byteLength - 1)) >>> 1]; case 0xbf: return mem.rom. uh[((addr) & (mem.rom. uh.byteLength - 1)) >>> 1]; case 0x1f: if ((addr & 0xffff) >= 0x400) { return io.read. h(addr & 0xffff); } return mem.hwr. uh[((addr) & (mem.hwr. uh.byteLength - 1)) >>> 1]; } return 0; },
            b(addr) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: return mem.ram. ub[((addr) & (mem.ram. ub.byteLength - 1)) >>> 0]; case 0xbf: return mem.rom. ub[((addr) & (mem.rom. ub.byteLength - 1)) >>> 0]; case 0x1f: if ((addr & 0xffff) >= 0x400) { return io.read. b(addr & 0xffff); } return mem.hwr. ub[((addr) & (mem.hwr. ub.byteLength - 1)) >>> 0]; } return 0; },
        }
    };
};
const mem = new pseudo.CstrMem();
pseudo.CstrMips = function() {
    const base = new Uint32Array(32);
    let pc;
    function step() {
        const code = mem.read.w(pc);
        pc += 4;
        switch(((code >>> 26) & 0x3f)) {
            case 0: // SPECIAL
                switch(code & 0x3f) {
                    case 0: // SLL
                        if (code) { // No operation
                            base[((code >>> 11) & 0x1f)] = base[((code >>> 16) & 0x1f)] << ((code >>> 6) & 0x1f);
                        }
                        return;
                    case 2: // SRL
                        base[((code >>> 11) & 0x1f)] = base[((code >>> 16) & 0x1f)] >>> ((code >>> 6) & 0x1f);
                        return;
                    case 8: // JR
                        branch(base[((code >>> 21) & 0x1f)]);
                        return;
                    case 36: // AND
                        base[((code >>> 11) & 0x1f)] = base[((code >>> 21) & 0x1f)] & base[((code >>> 16) & 0x1f)];
                        return;
                    case 37: // OR
                        base[((code >>> 11) & 0x1f)] = base[((code >>> 21) & 0x1f)] | base[((code >>> 16) & 0x1f)];
                        return;
                }
                return;
            case 2: // J
                branch(((pc & 0xf0000000) | (code & 0x3ffffff) << 2));
                return;
            case 3: // JAL
                base[31] = pc + 4;
                branch(((pc & 0xf0000000) | (code & 0x3ffffff) << 2));
                return;
            case 4: // BEQ
                if (base[((code >>> 21) & 0x1f)] === base[((code >>> 16) & 0x1f)]) {
                    branch((pc + ((((code) << 16 >> 16)) << 2)));
                }
                return;
            case 5: // BNE
                if (base[((code >>> 21) & 0x1f)] !== base[((code >>> 16) & 0x1f)]) {
                    branch((pc + ((((code) << 16 >> 16)) << 2)));
                }
                return;
            case 7: // BGTZ
                if (((base[((code >>> 21) & 0x1f)]) << 0 >> 0) > 0) {
                    branch((pc + ((((code) << 16 >> 16)) << 2)));
                }
                return;
            case 9: // ADDIU
                base[((code >>> 16) & 0x1f)] = base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16));
                return;
            case 10: // SLTI
                base[((code >>> 16) & 0x1f)] = ((base[((code >>> 21) & 0x1f)]) << 0 >> 0) < (((code) << 16 >> 16));
                return;
            case 12: // ANDI
                base[((code >>> 16) & 0x1f)] = base[((code >>> 21) & 0x1f)] & (code & 0xffff);
                return;
            case 13: // ORI
                base[((code >>> 16) & 0x1f)] = base[((code >>> 21) & 0x1f)] | (code & 0xffff);
                return;
            case 15: // LUI
                base[((code >>> 16) & 0x1f)] = code << 16;
                return;
            case 33: // LH
                base[((code >>> 16) & 0x1f)] = ((mem.read.h((base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))))) << 16 >> 16);
                return;
            case 35: // LW
                base[((code >>> 16) & 0x1f)] = mem.read.w((base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))));
                return;
            case 36: // LBU
                base[((code >>> 16) & 0x1f)] = mem.read.b((base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))));
                return;
            case 40: // SB
                mem.write.b((base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))), base[((code >>> 16) & 0x1f)]);
                return;
            case 41: // SH
                mem.write.h((base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))), base[((code >>> 16) & 0x1f)]);
                return;
            case 43: // SW
                mem.write.w((base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))), base[((code >>> 16) & 0x1f)]);
                return;
        }
    }
    function branch(addr) {
        step();
        pc = addr;
    }
    return {
        run() {
            let vblank = 1;
            requestAnimationFrame(cpu.run);
            
            while(vblank) {
                step(false);
                if (vblank++ >= 100000) {
                    vblank = 0;
                }
            }
        },
        parseExeHeader(header) {
            pc = header[2 + 2];
        }
    };
};
const cpu = new pseudo.CstrMips();
pseudo.CstrMain = function() {
    return {
        init(screen) {
            const xhr = new XMLHttpRequest();
            xhr.onload = function() {
                render.init(screen);
                cpu.parseExeHeader(mem.writeExecutable(xhr.response));
                cpu.run();
            };
            xhr.responseType = 'arraybuffer';
            xhr.open('GET', 'print-text.exe');
            xhr.send();
        }
    };
};
const psx = new pseudo.CstrMain();
pseudo.CstrRender = function() {
    let ctx, attrib, bfr; // Draw context
    // Generic function for shaders
    function createShader(kind, content) {
        const shader = ctx.createShader(kind);
        ctx.shaderSource (shader, content);
        ctx.compileShader(shader);
        ctx.getShaderParameter(shader, ctx.COMPILE_STATUS);
        return shader;
    }
    function drawScene(color, vertex) {
        ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c);
        ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0);
        ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(color), ctx.DYNAMIC_DRAW);
        ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v);
        ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0);
        ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vertex), ctx.DYNAMIC_DRAW);
        ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
    }
    // Exposed class functions/variables
    return {
        init(canvas) {
            // Draw canvas
            ctx = canvas.getContext('webgl');
            // Shaders
            const func = ctx.createProgram();
            ctx.attachShader(func, createShader(ctx.  VERTEX_SHADER, '     attribute vec2 a_position;     attribute vec4 a_color;     uniform vec2 u_resolution;     varying vec4 v_color;         void main() {         gl_Position = vec4(((a_position / u_resolution) - 1.0) * vec2(1, -1), 0, 1);         v_color = a_color;     }'));
            ctx.attachShader(func, createShader(ctx.FRAGMENT_SHADER, '     precision mediump float;     varying vec4 v_color;         void main() {         gl_FragColor = v_color;     }'));
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
            ctx.uniform2f(attrib._r, 320 / 2, 240 / 2);
            ctx.viewport(0, 0, 320 * 2, 240 * 2);
        },
        draw(addr, data) {
            switch(addr & 0xfc) {
                case 0x38: // POLY G4
                    {
                        const p = {
                            cr: [
                                { a: (data[0] >>> 0) & 0xff, b: (data[0] >>> 8) & 0xff, c: (data[0] >>> 16) & 0xff, n: (data[0] >>> 24) & 0xff, },
                                { a: (data[2] >>> 0) & 0xff, b: (data[2] >>> 8) & 0xff, c: (data[2] >>> 16) & 0xff, n: (data[2] >>> 24) & 0xff, },
                                { a: (data[4] >>> 0) & 0xff, b: (data[4] >>> 8) & 0xff, c: (data[4] >>> 16) & 0xff, n: (data[4] >>> 24) & 0xff, },
                                { a: (data[6] >>> 0) & 0xff, b: (data[6] >>> 8) & 0xff, c: (data[6] >>> 16) & 0xff, n: (data[6] >>> 24) & 0xff, },
                            ],
                            vx: [
                                { h: (data[1] >> 0) & 0xffff, v: (data[1] >> 16) & 0xffff, },
                                { h: (data[3] >> 0) & 0xffff, v: (data[3] >> 16) & 0xffff, },
                                { h: (data[5] >> 0) & 0xffff, v: (data[5] >> 16) & 0xffff, },
                                { h: (data[7] >> 0) & 0xffff, v: (data[7] >> 16) & 0xffff, },
                            ]
                        };
                        let color  = [];
                        let vertex = [];
                        for (let i = 0; i < 4; i++) {
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
                        drawScene(color, vertex);
                    }
                    return;
                case 0x74: // SPRITE 8
                    {
                        const p = {
                            vx: [
                                { h: (data[1] >> 0) & 0xffff, v: (data[1] >> 16) & 0xffff, },
                                { h: (data[3] >> 0) & 0xffff, v: (data[3] >> 16) & 0xffff, },
                            ]
                        };
                        let color  = [
                            127, 127, 127, 255,
                            127, 127, 127, 255,
                            127, 127, 127, 255,
                            127, 127, 127, 255,
                        ];
                        let vertex = [
                            p.vx[0].h,     p.vx[0].v,
                            p.vx[0].h + 8, p.vx[0].v,
                            p.vx[0].h,     p.vx[0].v + 8,
                            p.vx[0].h + 8, p.vx[0].v + 8,
                        ];
                        drawScene(color, vertex);
                    }
                    return;
            }
        }
    };
};
const render = new pseudo.CstrRender();
pseudo.CstrGraphics = function() {
    // Command Pipeline
    const pipe = {
        data: new Uint32Array(256)
    };
    const pSize = [];
    pSize[ 56] = 8;
    pSize[116] = 3;
    return {
        writeData(addr) {
            if (!pipe.size) {
                const prim  = ((addr >>> 24) & 0xff);
                const count = pSize[prim];
                if (count) {
                    pipe.data[0] = addr;
                    pipe.prim = prim;
                    pipe.size = count;
                    pipe.row  = 1;
                }
                else {
                    return;
                }
            }
            else {
                pipe.data[pipe.row] = addr;
                pipe.row++;
            }
            if (pipe.size === pipe.row) {
                pipe.size = 0;
                pipe.row  = 0;
                render.draw(pipe.prim, pipe.data);
            }
        },
        executeDMA(addr) {
            if (mem.hwr.uw[(((addr & 0xfff0) | 8) & (mem.hwr.uw.byteLength - 1)) >>> 2] === 0x01000401) {
                while(mem.hwr.uw[(((addr & 0xfff0) | 0) & (mem.hwr.uw.byteLength - 1)) >>> 2] !== 0xffffff) {
                    const count = mem.ram.uw[(( mem.hwr.uw[(((addr & 0xfff0) | 0) & (mem.hwr.uw.byteLength - 1)) >>> 2]) & (mem.ram.uw.byteLength - 1)) >>> 2];
                    let haha = mem.hwr.uw[(((addr & 0xfff0) | 0) & (mem.hwr.uw.byteLength - 1)) >>> 2] + 4;
                    let i = 0;
                    while (i < (count >>> 24)) {
                        vs.writeData(mem.ram.uw[(( haha) & (mem.ram.uw.byteLength - 1)) >>> 2]);
                        haha += 4;
                        i++;
                    }
                    mem.hwr.uw[(((addr & 0xfff0) | 0) & (mem.hwr.uw.byteLength - 1)) >>> 2] = count & 0xffffff;
                }
                return;
            }
        }
    };
};
const vs = new pseudo.CstrGraphics();
