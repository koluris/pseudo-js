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
                }
                mem.hwr.uw[(( addr) & (mem.hwr.uw.byteLength - 1)) >>> 2] = data;
                return;
            }
        },
        read: {
            w(addr) {
                switch(addr) {
                    case 0x1814: // GPU Status
                        return 0x14802000;
                }
                return mem.hwr.uw[(( addr) & (mem.hwr.uw.byteLength - 1)) >>> 2];
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
            cpu.setpc(header[4]);
            const exe = new Uint8Array(data, PSX_EXE_HEADER_SIZE);
            for (let i = 0; i < exe.byteLength; i++) {
                mem.ram.ub[(( offset + i) & (mem.ram.ub.byteLength - 1)) >>> 0] = exe[i];
            }
        },
        write: {
            w(addr, data) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: mem.ram. uw[((addr) & (mem.ram. uw.byteLength - 1)) >>> 2] = data; return; case 0x1f: io.write. w(addr & 0xffff, data); return; }; },
            h(addr, data) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: mem.ram. uh[((addr) & (mem.ram. uh.byteLength - 1)) >>> 1] = data; return; case 0x1f: io.write. h(addr & 0xffff, data); return; }; },
            b(addr, data) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: mem.ram. ub[((addr) & (mem.ram. ub.byteLength - 1)) >>> 0] = data; return; case 0x1f: io.write. b(addr & 0xffff, data); return; }; },
        },
        read: {
            w(addr) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: return mem.ram. uw[((addr) & (mem.ram. uw.byteLength - 1)) >>> 2]; case 0x1f: return io.read. w(addr & 0xffff); } return 0; },
            h(addr) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: return mem.ram. uh[((addr) & (mem.ram. uh.byteLength - 1)) >>> 1]; case 0x1f: return io.read. h(addr & 0xffff); } return 0; },
            b(addr) { switch(addr >>> 24) { case 0x00: case 0x80: case 0xA0: return mem.ram. ub[((addr) & (mem.ram. ub.byteLength - 1)) >>> 0]; case 0x1f: return io.read. b(addr & 0xffff); } return 0; },
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
                if (vblank++ > 100000) {
                    vblank = 0;
                }
            }
        },
        setpc(addr) {
            pc = addr;
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
                mem.writeExecutable(xhr.response);
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
    let ctx;
    // Exposed class functions/variables
    return {
        init(canvas) {
            ctx = canvas.getContext('2d');
        },
        draw(addr, data) {
            switch(addr & 0xfc) {
                case 0x38: // POLY G4
                    {
                        const p = {
                            colors: [
                                { r: (data[0] >>> 0) & 0xff, g: (data[0] >>> 8) & 0xff, b: (data[0] >>> 16) & 0xff, a: (data[0] >>> 24) & 0xff, },
                                { r: (data[2] >>> 0) & 0xff, g: (data[2] >>> 8) & 0xff, b: (data[2] >>> 16) & 0xff, a: (data[2] >>> 24) & 0xff, },
                                { r: (data[4] >>> 0) & 0xff, g: (data[4] >>> 8) & 0xff, b: (data[4] >>> 16) & 0xff, a: (data[4] >>> 24) & 0xff, },
                                { r: (data[6] >>> 0) & 0xff, g: (data[6] >>> 8) & 0xff, b: (data[6] >>> 16) & 0xff, a: (data[6] >>> 24) & 0xff, },
                            ],
                            points: [
                                { x: (data[1] >> 0) & 0xffff, y: (data[1] >> 16) & 0xffff, },
                                { x: (data[3] >> 0) & 0xffff, y: (data[3] >> 16) & 0xffff, },
                                { x: (data[5] >> 0) & 0xffff, y: (data[5] >> 16) & 0xffff, },
                                { x: (data[7] >> 0) & 0xffff, y: (data[7] >> 16) & 0xffff, },
                            ]
                        };
                        const gradient = ctx.createLinearGradient(0, 0, p.points[3].x, p.points[3].y);
                        gradient.addColorStop(0, 'RGBA(' + p.colors[0].r + ', ' + p.colors[0].g + ', ' + p.colors[0].b + ', 255)');
                        gradient.addColorStop(1, 'RGBA(' + p.colors[3].r + ', ' + p.colors[3].g + ', ' + p.colors[3].b + ', 255)');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(
                            p.points[0].x,
                            p.points[0].y,
                            p.points[3].x,
                            p.points[3].y,
                        );
                    }
                    return;
                case 0x74: // SPRITE 8
                    {
                        const p = {
                            colors: [
                                { r: (data[0] >>> 0) & 0xff, g: (data[0] >>> 8) & 0xff, b: (data[0] >>> 16) & 0xff, a: (data[0] >>> 24) & 0xff, }
                            ],
                            points: [
                                { x: (data[1] >> 0) & 0xffff, y: (data[1] >> 16) & 0xffff, },
                                { x: (data[3] >> 0) & 0xffff, y: (data[3] >> 16) & 0xffff, },
                            ]
                        };
                        ctx.fillStyle = 'RGBA(' + p.colors[0].r + ', ' + p.colors[0].g + ', ' + p.colors[0].b + ', 255)';
                        ctx.fillRect(
                            p.points[0].x,
                            p.points[0].y,
                            8,
                            8,
                        );
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
