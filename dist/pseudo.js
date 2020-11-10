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
// Console output
// Declare our namespace
'use strict';
const pseudo = window.pseudo || {};
pseudo.CstrBus = function() {
    // Interrupts
    const IRQ_ENABLED  = 1;
    const IRQ_DISABLED = 0;
    // Definition and threshold of interrupts
    const interrupts = [{
        code: 0,
        target: 4
    }, {
        code: 1,
        target: 1
    }, {
        code: 2,
        target: 4
    }, {
        code: 3,
        target: 8
    }, {
        code: 4,
        target: 1
    }, {
        code: 5,
        target: 1
    }, {
        code: 6,
        target: 1
    }, {
        code: 7,
        target: 8
    }, {
        code: 8,
        target: 8
    }, {
        code: 9,
        target: 1
    }, {
        code: 10,
        target: 1
    }];
    // Exposed class functions/variables
    return {
        reset() {
            for (const item of interrupts) {
                item.queued = IRQ_DISABLED;
            }
        },
        update() { // A method to schedule when IRQs should fire
            for (const item of interrupts) {
                if (item.queued) {
                    if (item.queued++ === item.target) {
                        mem.hwr.uh[((0x1070) & (mem.hwr.uh.byteLength - 1)) >>> 1] |= (1 << item.code);
                        item.queued = IRQ_DISABLED;
                        break;
                    }
                }
            }
        },
        interruptSet(code) {
            interrupts[code].queued = IRQ_ENABLED;
        },
        
        checkDMA(addr, data) {
            const chan = ((addr >>> 4) & 0xf) - 8;
            
            if (mem.hwr.uw[((0x10f0) & (mem.hwr.uw.byteLength - 1)) >>> 2] & (8 << (chan * 4))) {
                switch(chan) {
                    case 0: break; // MDEC in
                    case 1: break; // MDEC out
                    case 2: vs.executeDMA(addr); break; // Graphics
                    case 3: break; // CD-ROM
                    case 4: break; // Audio
                    case 6: break; // Clear OT
                    default:
                        psx.error('DMA Channel ' + chan);
                        break;
                }
                mem.hwr.uw[(((addr & 0xfff0) | 8) & (mem.hwr.uw.byteLength - 1)) >>> 2] = data & (~(0x01000000));
                if (mem.hwr.uw[((0x10f4) & (mem.hwr.uw.byteLength - 1)) >>> 2] & (1 << (16 + chan))) {
                    mem.hwr.uw[((0x10f4) & (mem.hwr.uw.byteLength - 1)) >>> 2] |= 1 << (24 + chan);
                    bus.interruptSet(3);
                }
            }
        }
    };
};
const bus = new pseudo.CstrBus();
pseudo.CstrCounters = function() {
    // PSX root clock
    const PSX_CLOCK      = 33868800;
    const PSX_VSYNC_NTSC = PSX_CLOCK / 60;
    const PSX_VSYNC_PAL  = PSX_CLOCK / 50;
    const PSX_HSYNC      = PSX_CLOCK / 60 / 480;
    let vbk;
    // Exposed class functions/variables
    return {
        reset() {
            vbk = 0;
        },
        update(threshold) {
            // Graphics
            vbk += threshold * 2;
            if (vbk >= PSX_VSYNC_NTSC) { vbk = 0;
                bus.interruptSet(0);
                 vs.redraw();
                cpu.setSuspended();
            }
        }
    };
};
const rootcnt = new pseudo.CstrCounters();
pseudo.CstrHardware = function() {
    // Exposed class functions/variables
    return {
        write: {
            w(addr, data) {
                switch(true) {
                    case (addr >= 0x1080 && addr <= 0x10e8): // DMA
                        mem.hwr.uw[(( addr) & (mem.hwr.uw.byteLength - 1)) >>> 2] = data;
                        if (addr & 8) {
                            bus.checkDMA(addr, data);
                        }
                        return;
                    case (addr == 0x10f4): // DICR, thanks Calb, Galtor :)
                        mem.hwr.uw[((0x10f4) & (mem.hwr.uw.byteLength - 1)) >>> 2] = (mem.hwr.uw[((0x10f4) & (mem.hwr.uw.byteLength - 1)) >>> 2] & (~((data & 0xff000000) | 0xffffff))) | (data & 0xffffff);
                        return;
                    case (addr >= 0x1810 && addr <= 0x1814): // Graphics
                        vs.scopeW(addr, data);
                        return;
                    
                    case (addr == 0x10f0): // DPCR
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
    let ptr, suspended, opcodeCount, requestAF;
    // Base CPU stepper
    function step(inslot) {
        cpu.base[0] = 0; // As weird as this seems, it is needed
        const code  = ptr[(( cpu.base[32]) & (ptr.byteLength - 1)) >>> 2];
        opcodeCount++;
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
                        consoleOutput();
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
    function consoleOutput() {
        if (cpu.base[32] === 0xb0) {
            if (cpu.base[9] === 59 || cpu.base[9] === 61) {
                psx.consoleKernel(cpu.base[4] & 0xff);
            }
        }
    }
    // Exposed class functions/variables
    return {
        base: new Uint32Array(32 + 1),
        reset() {
            // Break emulation loop
            cpu.pause();
            // Reset processors
            cpu.base.fill(0);
            opcodeCount = 0;
            cpu.base[32] = 0xbfc00000;
            ptr = mem.ram.uw;
        },
        run() {
            suspended = false;
            requestAF = requestAnimationFrame(cpu.run);
            while(!suspended) { // And u don`t stop!
                step(false);
                if (opcodeCount >= 100) {
                    // Rootcounters, interrupts
                    rootcnt.update(64);
                        bus.update();
                    
                    opcodeCount = 0;
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
    let divOutput;
    let divDropzone;
    let iso;
    // AJAX function
    function request(path, fn) {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status === 404) {
                psx.consoleInformation('error', 'Unable to read file "' + path + '"');
            }
            else {
                fn(xhr.response);
            }
        };
        xhr.responseType = 'arraybuffer';
        xhr.open('GET', path);
        xhr.send();
    }
    // Chunk reader function
    function chunkReader(file, start, size, kind, fn) {
        const end = start + size;
        // Check boundaries
        if (file.size > end) {
            const reader = new FileReader();
            reader.onload = function(e) { // Callback
                fn(e.target.result);
            };
            // Read sliced area
            const slice = file.slice(start, end);
            if (kind === 'text') {
                reader.readAsText(slice);
            }
            else {
                reader.readAsArrayBuffer(slice);
            }
        }
    }
    function executable(resp) {
        // Set mem & processor
        cpu.parseExeHeader(
            mem.writeExecutable(resp)
        );
        psx.consoleInformation('info', 'PSX-EXE has been transferred to RAM');
    }
    function reset() {
        divOutput.text(' ');
        
        // Reset all emulator components
            bus.reset();
            cpu.reset();
            mem.reset();
         render.reset();
        rootcnt.reset();
             vs.reset();
    }
    // Exposed class functions/variables
    return {
        init(screen, blink, kb, res, output, dropzone) {
            divOutput   = output;
            divDropzone = dropzone;
            
            render.init(screen, res);
        },
        openFile(file) {
            // PS-X EXE
            chunkReader(file, 0, 8, 'text', function(id) {
                if (id === 'PS-X EXE') {
                    const reader = new FileReader();
                    reader.onload = function(e) { // Callback
                        reset();
                        executable(e.target.result);
                        cpu.run();
                    };
                    // Read file
                    reader.readAsArrayBuffer(file);
                }
            });
        },
        drop: {
            file(e) {
                e.preventDefault();
                psx.drop.exit();
        
                const dt = e.dataTransfer;
                if (dt.files) {
                    psx.openFile(dt.files[0]);
                }
            },
            over(e) {
                e.preventDefault();
            },
            enter() {
                divDropzone.addClass('dropzone-active');
            },
            exit() {
                divDropzone.removeClass('dropzone-active');
            }
        },
        hex(number) {
            return '0x' + (number >>> 0).toString(16);
        },
        consoleInformation(kind, text) {
            divOutput.append(
                '<div class="' + kind + '"><span>PSeudo:: </span>' + text + '</div>'
            );
        },
        consoleKernel(char) {
            divOutput.append(
                String.fromCharCode(char).replace(/\n/, '<br/>').toUpperCase()
            );
        },
        error(out) {
            cpu.pause();
            throw new Error('/// PSeudo ' + out);
        }
    };
};
const psx = new pseudo.CstrMain();
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
        ctx.getShaderParameter(shader, ctx.COMPILE_STATUS);
        return shader;
    }
    function drawAreaCalc(n) {
        return Math.round((n * res.w) / 100);
    }
    // Compose Blend
    function composeBlend(a) {
        const b = [
            a & 2 ? blend : 0,
            a & 2 ? bit[blend].opaque : 255
        ];
        ctx.blendFunc(bit[b[0]].src, bit[b[0]].target);
        return b[1];
    }
    function createColor(color) {
        ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c);
        ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0);
        ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(color), ctx.DYNAMIC_DRAW);
    }
    function createVertex(vertex) {
        ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v);
        ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0);
        ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vertex), ctx.DYNAMIC_DRAW);
    }
    function createTexture(texture) {
        ctx.uniform1i(attrib._e, true);
        ctx.enableVertexAttribArray(attrib._t);
        ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._t);
        ctx.vertexAttribPointer(attrib._t, 2, ctx.FLOAT, false, 0, 0);
        ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(texture), ctx.DYNAMIC_DRAW);
    }
    function disableTexture() {
        ctx.uniform1i(attrib._e, false);
        ctx.disableVertexAttribArray(attrib._t);
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
        ctx.drawArrays(mode, 0, size);
    }
    
    function drawG(data, size, mode) {          const p = { cr: [ { a: (data[0] >>> 0) & 0xff, b: (data[0] >>> 8) & 0xff, c: (data[0] >>> 16) & 0xff, n: (data[0] >>> 24) & 0xff, }, { a: (data[2] >>> 0) & 0xff, b: (data[2] >>> 8) & 0xff, c: (data[2] >>> 16) & 0xff, n: (data[2] >>> 24) & 0xff, }, { a: (data[4] >>> 0) & 0xff, b: (data[4] >>> 8) & 0xff, c: (data[4] >>> 16) & 0xff, n: (data[4] >>> 24) & 0xff, }, { a: (data[6] >>> 0) & 0xff, b: (data[6] >>> 8) & 0xff, c: (data[6] >>> 16) & 0xff, n: (data[6] >>> 24) & 0xff, }, ], vx: [ { h: (data[1] >> 0) & 0xffff, v: (data[1] >> 16) & 0xffff, }, { h: (data[3] >> 0) & 0xffff, v: (data[3] >> 16) & 0xffff, }, { h: (data[5] >> 0) & 0xffff, v: (data[5] >> 16) & 0xffff, }, { h: (data[7] >> 0) & 0xffff, v: (data[7] >> 16) & 0xffff, }, ] };
        
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
    
    function drawSprite(data, size) {
        const p = { cr: [ { a: (data[0] >>> 0) & 0xff, b: (data[0] >>> 8) & 0xff, c: (data[0] >>> 16) & 0xff, n: (data[0] >>> 24) & 0xff, } ], vx: [ { h: (data[1] >> 0) & 0xffff, v: (data[1] >> 16) & 0xffff, }, { h: (data[3] >> 0) & 0xffff, v: (data[3] >> 16) & 0xffff, }, ], tx: [ { u: (data[2] >>> 0) & 0xff, v: (data[2] >>> 8) & 0xff, } ], tp: [ (data[2] >>> 16) & 0xffff ] };
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
                    255 >>> 1,
                    255 >>> 1,
                    255 >>> 1,
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
            ctx = canvas[0].getContext('webgl2', { antialias: false, depth: false, desynchronized: true, preserveDrawingBuffer: true, stencil: false });
            ctx.enable(ctx.BLEND);
            ctx.clearColor(21 / 255.0, 21 / 255.0, 21 / 255.0, 1.0);
            // Shaders
            const func = ctx.createProgram();
            ctx.attachShader(func, createShader(ctx.  VERTEX_SHADER, '     attribute vec2 a_position;     attribute vec4 a_color;     attribute vec2 a_texCoord;     uniform vec2 u_resolution;     varying vec4 v_color;     varying vec2 v_texCoord;         void main() {         gl_Position = vec4(((a_position / u_resolution) - 1.0) * vec2(1, -1), 0, 1);         v_color = a_color;         v_texCoord = a_texCoord;     }'));
            ctx.attachShader(func, createShader(ctx.FRAGMENT_SHADER, '     precision mediump float;     uniform sampler2D u_texture;     uniform bool u_enabled;     varying vec4 v_color;     varying vec2 v_texCoord;         void main() {         if (u_enabled) {             gl_FragColor = texture2D(u_texture, v_texCoord) * (v_color * vec4(2.0, 2.0, 2.0, 1));         }         else {             gl_FragColor = v_color;         }     }'));
            ctx.linkProgram(func);
            ctx.getProgramParameter(func, ctx.LINK_STATUS);
            ctx.useProgram (func);
            // Attributes
            attrib = {
                _c: ctx.getAttribLocation(func, 'a_color'),
                _p: ctx.getAttribLocation(func, 'a_position'),
                _t: ctx.getAttribLocation(func, 'a_texCoord'),
                _r: ctx.getUniformLocation  (func, 'u_resolution'),
                _e: ctx.getUniformLocation  (func, 'u_enabled')
            };
            ctx.enableVertexAttribArray(attrib._c);
            ctx.enableVertexAttribArray(attrib._p);
            ctx.enableVertexAttribArray(attrib._t);
            // Buffers
            bfr = {
                _c: ctx.createBuffer(),
                _v: ctx.createBuffer(),
                _t: ctx.createBuffer(),
            };
            // Blend
            bit = [
                { src: ctx.SRC_ALPHA, target: ctx.ONE_MINUS_SRC_ALPHA, opaque: 128 },
                { src: ctx.ONE,       target: ctx.ONE_MINUS_SRC_ALPHA, opaque:   0 },
                { src: ctx.ZERO,      target: ctx.ONE_MINUS_SRC_COLOR, opaque:   0 },
                { src: ctx.SRC_ALPHA, target: ctx.ONE,                 opaque:  64 },
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
                        const p = { cr: [ { a: (data[0] >>> 0) & 0xff, b: (data[0] >>> 8) & 0xff, c: (data[0] >>> 16) & 0xff, n: (data[0] >>> 24) & 0xff, } ], vx: [ { h: (data[1] >> 0) & 0xffff, v: (data[1] >> 16) & 0xffff, }, { h: (data[2] >> 0) & 0xffff, v: (data[2] >> 16) & 0xffff, }, ] };
                        let color  = [];
                        let vertex = [];
                        for (let i = 0; i < 4; i++) {
                            color.push(
                                p.cr[0].a,
                                p.cr[0].b,
                                p.cr[0].c,
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
                    return;
                case 0xa0: // LOAD IMAGE
                    vs.photoRead(data);
                    return;
                case 0xe1: // TEXTURE PAGE
                    blend = (data[0] >>> 5) & 3;
                    spriteTP = data[0] & 0x7ff;
                    ctx.blendFunc(bit[blend].src, bit[blend].target);
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
                    ofs.h = (((data[0]) << 0 >> 0) << 21) >> 21;
                    ofs.v = (((data[0]) << 0 >> 0) << 10) >> 21;
                    return;
            }
            psx.error('GPU Render Primitive ' + psx.hex(addr));
        }
    };
};
const render = new pseudo.CstrRender();
pseudo.CstrTexCache = function() {
    const TEX_04BIT   = 0;
    const TEX_08BIT   = 1;
    const TEX_15BIT   = 2;
    const TEX_15BIT_2 = 3;
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
                cc : new Uint32Array(256),
            };
        },
        reset(ctx) {
            // Cached white texture for non-textured shader
            const white = ctx.createTexture();
            ctx.bindTexture(ctx.TEXTURE_2D, white);
            ctx.texImage2D (ctx.TEXTURE_2D, 0, ctx.RGBA, 1, 1, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
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
            return (((p ? 255 : 0) & 0xff) << 24) | ((( (p >>> 10) << 3) & 0xff) << 16) | ((( (p >>> 5) << 3) & 0xff) << 8) | (( p << 3) & 0xff);
        },
        fetchTexture(ctx, tp, clut) {
            const uid = (clut << 16) | tp;
            for (const tc of cache) {
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
                            const p = vs.vram.uh[(tc.pos.h + h) * 1024 + tc.pos.w + w];
                            tex.bfr.uw[idx++] = tex.cc[(p >>>  0) & 15];
                            tex.bfr.uw[idx++] = tex.cc[(p >>>  4) & 15];
                            tex.bfr.uw[idx++] = tex.cc[(p >>>  8) & 15];
                            tex.bfr.uw[idx++] = tex.cc[(p >>> 12) & 15];
                        }
                    }
                    break;
                case TEX_08BIT: // 256 color palette
                    for (let i = 0; i < 256; i++) {
                        tex.cc[i] = tcache.pixel2texel(vs.vram.uh[tc.pos.cc]);
                        tc.pos.cc++;
                    }
                    for (let h = 0, idx = 0; h < 256; h++) {
                        for (let w = 0; w < (256 / 2); w++) {
                            const p = vs.vram.uh[(tc.pos.h + h) * 1024 + tc.pos.w + w];
                            tex.bfr.uw[idx++] = tex.cc[(p >>> 0) & 255];
                            tex.bfr.uw[idx++] = tex.cc[(p >>> 8) & 255];
                        }
                    }
                    break;
                case TEX_15BIT:   // No color palette
                case TEX_15BIT_2: // Seen on some rare cases
                    for (let h = 0, idx = 0; h < 256; h++) {
                        for (let w = 0; w < 256; w++) {
                            const p = vs.vram.uh[(tc.pos.h + h) * 1024 + tc.pos.w + w];
                            tex.bfr.uw[idx++] = tcache.pixel2texel(p);
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
            ctx.texImage2D   (ctx.TEXTURE_2D, 0, ctx.RGBA, TEX_SIZE, TEX_SIZE, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, tex.bfr.ub);
            // Advance cache counter
            tc.uid = uid;
            index  = (index + 1) & (TCACHE_MAX - 1);
        },
        invalidate(iX, iY, iW, iH) {
            for (const tc of cache) {
                //if (((tc.pos.w + 255) >= iX) && ((tc.pos.h + 255) >= iY) && ((tc.pos.w) <= iW) && ((tc.pos.h) <= iH)) {
                    tc.uid = -1;
                    //continue;
                //}
            }
        }
    };
};
const tcache = new pseudo.CstrTexCache();
pseudo.CstrGraphics = function() {
    // Constants
    const GPU_STAT_ODDLINES         = 0x80000000;
    const GPU_STAT_DMABITS          = 0x60000000;
    const GPU_STAT_READYFORCOMMANDS = 0x10000000;
    const GPU_STAT_READYFORVRAM     = 0x08000000;
    const GPU_STAT_IDLE             = 0x04000000;
    const GPU_STAT_DISPLAYDISABLED  = 0x00800000;
    const GPU_STAT_INTERLACED       = 0x00400000;
    const GPU_STAT_RGB24            = 0x00200000;
    const GPU_STAT_PAL              = 0x00100000;
    const GPU_STAT_DOUBLEHEIGHT     = 0x00080000;
    const GPU_STAT_WIDTHBITS        = 0x00070000;
    const GPU_STAT_MASKENABLED      = 0x00001000;
    const GPU_STAT_MASKDRAWN        = 0x00000800;
    const GPU_STAT_DRAWINGALLOWED   = 0x00000400;
    const GPU_STAT_DITHER           = 0x00000200;
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
    // VRAM Operations
    const vrop = {
        h: {},
        v: {},
    };
    // Resolution Mode
    const resMode = [
        256, 320, 512, 640, 368, 384, 512, 640
    ];
    let modeDMA, vpos, vdiff, isVideoPAL, isVideo24Bit, disabled;
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
                if (modeDMA === GPU_DMA_MEM2VRAM) {
                    if ((i += fetchFromRAM(stream, addr, size - i)) >= size) {
                        continue;
                    }
                    addr += i;
                }
        
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
                    if (pipe.size > 128) { // Lines with termination code
                        if ((pipe.size == 254 && pipe.row >= 3) || (pipe.size == 255 && pipe.row >= 4 && !(pipe.row & 1))) {
                            if ((pipe.data[pipe.row] & 0xf000f000) == 0x50005000) {
                                pipe.row = pipe.size - 1;
                            }
                        }
                    }
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
    function fetchFromRAM(stream, addr, size) {
        let count = 0;
        if (!vrop.enabled) {
            modeDMA = GPU_DMA_NONE;
            return 0;
        }
        size <<= 1;
        while (vrop.v.p < vrop.v.end) {
            while (vrop.h.p < vrop.h.end) {
                // Keep position of vram
                const ramValue = mem.ram.uh[(( addr) & (mem.ram.uh.byteLength - 1)) >>> 1];
                // Check if it`s a 16-bit (stream), or a 32-bit (command) address
                const pos = (vrop.v.p << 10) + vrop.h.p;
                if (stream) {
                    vs.vram.uh[pos] = ramValue;
                }
                else { // A dumb hack for now
                    if (!(count % 2)) {
                        vs.vram.uw[pos >>> 1] = addr;
                    }
                }
                addr += 2;
                vrop.h.p++;
                if (++count === size) {
                    if (vrop.h.p === vrop.h.end) {
                        vrop.h.p = vrop.h.start;
                        vrop.v.p++;
                    }
                    return fetchEnd(count);
                }
            }
            vrop.h.p = vrop.h.start;
            vrop.v.p++;
        }
        return fetchEnd(count);
    }
    function fetchEnd(count) {
        if (vrop.v.p >= vrop.v.end) {
            vrop.enabled = false;
            vrop.raw.ub.fill(0);
            modeDMA = GPU_DMA_NONE;
        }
        if (count % 2) {
            count++;
        }
        return count >>> 1;
    }
    function photoData(data) {
        const p = [
            (data[1] >>>  0) & 0xffff,
            (data[1] >>> 16) & 0xffff,
            (data[2] >>>  0) & 0xffff,
            (data[2] >>> 16) & 0xffff,
        ];
        vrop.h.start = vrop.h.p = p[0];
        vrop.v.start = vrop.v.p = p[1];
        vrop.h.end   = vrop.h.p + p[2];
        vrop.v.end   = vrop.v.p + p[3];
        return p;
    }
    // Exposed class functions/variables
    return {
        vram: union(1024 * 512 * 2),
        reset() {
            vs.vram.uh.fill(0);
            ret.data     = 0x400;
            ret.status   = GPU_STAT_READYFORCOMMANDS | GPU_STAT_IDLE | GPU_STAT_DISPLAYDISABLED | 0x2000;
            modeDMA      = GPU_DMA_NONE;
            vpos         = 0;
            vdiff        = 0;
            isVideoPAL   = false;
            isVideo24Bit = false;
            disabled     = true;
            // VRAM Operations
            vrop.enabled = false;
            vrop.raw     = 0;
            vrop.pvram   = 0;
            vrop.h.p     = 0;
            vrop.h.start = 0;
            vrop.h.end   = 0;
            vrop.v.p     = 0;
            vrop.v.start = 0;
            vrop.v.end   = 0;
            // Command Pipe
            pipeReset();
        },
        redraw() {
            ret.status ^= GPU_STAT_ODDLINES;
            render.swapBuffers(disabled);
        },
        scopeW(addr, data) {
            switch(addr & 0xf) {
                case 0: // Data
                    dataMem.write(false, data, 1);
                    return;
                case 4: // Status
                    switch(((data >>> 24) & 0xff)) {
                        case 0x00:
                            ret.status   = 0x14802000;
                            disabled     = true;
                            isVideoPAL   = false;
                            isVideo24Bit = false;
                            return;
                        case 0x01:
                            pipeReset();
                            return;
                        case 0x03:
                            disabled = data & 1 ? true : false;
                            return;
                        case 0x04:
                            modeDMA = data & 3;
                            return;
                        case 0x05:
                            vpos = Math.max(vpos, (data >>> 10) & 0x1ff);
                            return;
                
                        case 0x07:
                            vdiff = ((data >>> 10) & 0x3ff) - (data & 0x3ff);
                            return;
                        case 0x08:
                            isVideoPAL   = ((data) & 8) ? true : false;
                            isVideo24Bit = ((data >>> 4) & 1) ? true : false;
                            {
                                // Basic info
                                const w = resMode[(data & 3) | ((data & 0x40) >>> 4)];
                                const h = (data & 4) ? 480 : 240;
                
                                if (((data >>> 5) & 1) || h == vdiff) { // No distinction for interlaced & normal mode
                                    render.resize({ w: w, h: h });
                                }
                                else { // Special cases
                                    vdiff = vdiff == 226 ? 240 : vdiff; // pdx-059, wurst2k
                                    render.resize({ w: w, h: vpos ? vpos : vdiff });
                                }
                            }
                            return;
                        case 0x10:
                            switch(data & 0xffffff) {
                                case 7:
                                    ret.data = 2;
                                    return;
                            }
                            return;
                        
                        case 0x02:
                        case 0x06:
                            return;
                    }
                    psx.error('GPU Write Status ' + psx.hex(((data >>> 24) & 0xff)));
                    return;
            }
        },
        scopeR(addr) {
            switch(addr & 0xf) {
                case 0: // Data
                    dataMem.read(false, 0, 1);
                    return ret.data;
                case 4: // Status
                    return ret.status | GPU_STAT_READYFORVRAM;
            }
        },
        executeDMA(addr) {
            const size = (mem.hwr.uw[(((addr & 0xfff0) | 4) & (mem.hwr.uw.byteLength - 1)) >>> 2] >>> 16) * (mem.hwr.uw[(((addr & 0xfff0) | 4) & (mem.hwr.uw.byteLength - 1)) >>> 2] & 0xffff);
            switch(mem.hwr.uw[(((addr & 0xfff0) | 8) & (mem.hwr.uw.byteLength - 1)) >>> 2]) {
                case 0x01000200:
                    //dataMem.read(true, mem.hwr.uw[(((addr & 0xfff0) | 0) & (mem.hwr.uw.byteLength - 1)) >>> 2], size);
                    return;
                case 0x01000201:
                    dataMem.write(true, mem.hwr.uw[(((addr & 0xfff0) | 0) & (mem.hwr.uw.byteLength - 1)) >>> 2], size);
                    return;
                case 0x01000401:
                    while(mem.hwr.uw[(((addr & 0xfff0) | 0) & (mem.hwr.uw.byteLength - 1)) >>> 2] !== 0xffffff) {
                        const count = mem.ram.uw[(( mem.hwr.uw[(((addr & 0xfff0) | 0) & (mem.hwr.uw.byteLength - 1)) >>> 2]) & (mem.ram.uw.byteLength - 1)) >>> 2];
                        dataMem.write(true, mem.hwr.uw[(((addr & 0xfff0) | 0) & (mem.hwr.uw.byteLength - 1)) >>> 2] + 4, count >>> 24);
                        mem.hwr.uw[(((addr & 0xfff0) | 0) & (mem.hwr.uw.byteLength - 1)) >>> 2] = count & 0xffffff;
                    }
                    return;
                
                case 0x00000401: // Disable DMA?
                    return;
            }
            psx.error('GPU DMA ' + psx.hex(mem.hwr.uw[(((addr & 0xfff0) | 8) & (mem.hwr.uw.byteLength - 1)) >>> 2]));
        },
        photoWrite(data) {
            const p = photoData(data);
            vrop.pvram = p[1] * 1024;
            modeDMA = GPU_DMA_VRAM2MEM;
            ret.status |= GPU_STAT_READYFORVRAM;
        },
        photoRead(data) {
            const p = photoData(data);
            vrop.enabled = true;
            vrop.raw = new union((p[2] * p[3]) * 4);
            modeDMA = GPU_DMA_MEM2VRAM;
            // Cache invalidation
            tcache.invalidate(vrop.h.start, vrop.v.start, vrop.h.end, vrop.v.end);
        }
    };
};
const vs = new pseudo.CstrGraphics();
