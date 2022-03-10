// Data manipulation helper
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
'use strict';
const pseudo = window.pseudo || {};
pseudo.CstrDraw = function() {
    let ctx;
    // Exposed class methods/variables
    return {
        init(screen) {
            ctx = screen[0].getContext('WebGL'.toLowerCase());
            ctx.clearColor(21 / 255.0, 21 / 255.0, 21 / 255.0, 1.0);
        },
        reset() {
            ctx.clear(ctx.COLOR_BUFFER_BIT);
        }
    };
};
const draw = new pseudo.CstrDraw();
pseudo.CstrHardware = function() {
    // Exposed class functions/variables
    return {
        write: {
            w(addr, data) {
                switch(true) {
                    
                    case (addr == 0x1000): // ?
                    case (addr == 0x1004): // ?
                    case (addr == 0x1008): // ?
                    case (addr == 0x100c): // ?
                    case (addr == 0x1010): // ?
                    case (addr == 0x1014): // SPU
                    case (addr == 0x1018): // DV5
                    case (addr == 0x101c): // ?
                    case (addr == 0x1020): // COM
                    case (addr == 0x1060): // RAM Size
                        mem.hwr.uw[(( addr) & (mem.hwr.uw.byteLength - 1)) >>> 2] = data;
                        return;
                    default:
                        psx.error('Hardware W32 ' + psx.hex(addr) + ' <- ' + psx.hex(data));
                        return;
                }
            },
            h(addr, data) {
                switch(true) {
                    
                    case (addr >= 0x1c00 && addr <= 0x1dfe): // SPU
                        mem.hwr.uh[(( addr) & (mem.hwr.uh.byteLength - 1)) >>> 1] = data;
                        return;
                    default:
                        psx.error('Hardware W16 ' + psx.hex(addr) + ' <- ' + psx.hex(data));
                        return;
                }
            },
            b(addr, data) {
                switch(true) {
                    
                    case (addr == 0x2041): // DIP Switch?
                        mem.hwr.ub[(( addr) & (mem.hwr.ub.byteLength - 1)) >>> 0] = data;
                        return;
                    default:
                        psx.error('Hardware W08 ' + psx.hex(addr) + ' <- ' + psx.hex(data));
                        return;
                }
            }
        }
    };
};
const io = new pseudo.CstrHardware();
pseudo.CstrMem = function() {
    // Exposed class methods/variables
    return {
        ram: union(0x200000),
        rom: union(0x80000),
        hwr: union(0x4000),
        reset() {
            // Reset all, except for BIOS
            mem.ram.ub.fill(0);
            mem.hwr.ub.fill(0);
        },
        writeROM(data) {
            mem.rom.ub.set(new Uint8Array(data));
        },
        write: {
            w(addr, data) {
                switch(addr >>> 24) {
                    case 0x00:
                    case 0x80:
                    case 0xa0:
                        if (cpu.copr[12] & 0x10000) {
                            return;
                        }
                        mem.ram.uw[(( addr) & (mem.ram.uw.byteLength - 1)) >>> 2] = data;
                        return;
                    case 0x1f:
                        if ((addr & 0xffff) >= 0x400) {
                            io.write.w(addr & 0xffff, data);
                            return;
                        }
                        mem.hwr.uw[(( addr) & (mem.hwr.uw.byteLength - 1)) >>> 2] = data;
                        return;
                }
                if ((addr) == 0xfffe0130) {
                    return;
                }
                psx.error('Mem W32 ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            },
            h(addr, data) {
                switch(addr >>> 24) {
                    case 0x1f:
                        if ((addr & 0xffff) >= 0x400) {
                            io.write.h(addr & 0xffff, data);
                            return;
                        }
                        mem.hwr.uh[(( addr) & (mem.hwr.uh.byteLength - 1)) >>> 2] = data;
                        return;
                }
                psx.error('Mem W16 ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            },
            b(addr, data) {
                switch(addr >>> 24) {
                    case 0x1f:
                        if ((addr & 0xffff) >= 0x400) {
                            io.write.b(addr & 0xffff, data);
                            return;
                        }
                        mem.hwr.ub[(( addr) & (mem.hwr.ub.byteLength - 1)) >>> 2] = data;
                        return;
                }
                psx.error('Mem W08 ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            }
        },
        read: {
            w(addr) {
                switch(addr >>> 24) {
                    case 0xa0:
                        return mem.ram.uw[(( addr) & (mem.ram.uw.byteLength - 1)) >>> 2];
                    case 0xbf:
                        return mem.rom.uw[(( addr) & (mem.rom.uw.byteLength - 1)) >>> 2];
                }
                psx.error('Mem R32 ' + psx.hex(addr));
            }
        }
    };
};
const mem = new pseudo.CstrMem();
pseudo.CstrMips = function() {
    let branched, cc;
    // Base CPU stepper
    function step(inslot) {
        const code = mem.read.w(cpu.base[32]);
        cpu.base[32] += 4;
        switch(((code >>> 26) & 0x3f)) {
            case 0: // SPECIAL
                switch(code & 0x3f) {
                    case 0: // SLL
                        if (code) { // No operation
                            cpu.base[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 16) & 0x1f)] << ((code >>> 6) & 0x1f);
                        }
                        break;
                    case 8: // JR
                        branch(cpu.base[((code >>> 21) & 0x1f)]); // TODO: Verbose
                        break;
                    case 33: // ADDU
                        cpu.base[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] + cpu.base[((code >>> 16) & 0x1f)];
                        break;
                    case 37: // OR
                        cpu.base[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] | cpu.base[((code >>> 16) & 0x1f)];
                        break;
                    case 43: // SLTU
                        cpu.base[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] < cpu.base[((code >>> 16) & 0x1f)];
                        break;
                    default:
                        psx.error('Special CPU instruction ' + (code & 0x3f));
                        break;
                }
                break;
            case 3: // JAL
                cpu.base[31] = cpu.base[32] + 4;
            case 2: // J
                branch(((cpu.base[32] & 0xf0000000) | (code & 0x3ffffff) << 2));
                break;
            case 5: // BNE
                if (cpu.base[((code >>> 21) & 0x1f)] !== cpu.base[((code >>> 16) & 0x1f)]) {
                    branch((cpu.base[32] + ((((code) << 16 >> 16)) << 2)));
                }
                break;
            case 8: // ADDI
            case 9: // ADDIU
                cpu.base[((code >>> 16) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16));
                break;
            case 12: // ANDI
                cpu.base[((code >>> 16) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] & (code & 0xffff);
                break;
            case 13: // ORI
                cpu.base[((code >>> 16) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] | (code & 0xffff);
                break;
            case 15: // LUI
                cpu.base[((code >>> 16) & 0x1f)] = code << 16;
                break;
            case 16: // COP0
                switch(((code >>> 21) & 0x1f)) {
                    case 4: // MTC0
                        cpu.copr[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 16) & 0x1f)];
                        break;
                    default:
                        psx.error('Coprocessor 0 instruction ' + ((code >>> 21) & 0x1f));
                        break;
                }
                break;
            case 35: // LW
                cpu.base[((code >>> 16) & 0x1f)] = mem.read.w((cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))));
                cc += 3;
                break;
            case 40: // SB
                mem.write.b((cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))), cpu.base[((code >>> 16) & 0x1f)]);
                break;
            case 41: // SH
                mem.write.h((cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))), cpu.base[((code >>> 16) & 0x1f)]);
                break;
            case 43: // SW
                mem.write.w((cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))), cpu.base[((code >>> 16) & 0x1f)]);
                break;
            default:
                psx.error('Basic CPU instruction ' + ((code >>> 26) & 0x3f));
                break;
        }
        cpu.base[0] = 0;
        cc++;
    }
    function branch(addr) {
        // Execute instruction in slot
        branched = true;
        step(true);
        cpu.base[32] = addr;
    }
    // Exposed class methods/variables
    return {
        base: new Uint32Array(32 + 3), // + cpu.base[32], cpu.base[33], cpu.base[34]
        copr: new Uint32Array(16),
        reset() {
            // Reset processors
            cpu.base.fill(0);
            cpu.copr.fill(0);
            cpu.copr[12] = 0x10900000;
            cpu.copr[15] = 0x2;
            cpu.base[32] = 0xbfc00000;
        },
        run() {
            // Next code block
            branched = false;
            cc = 0;
            while(!branched) { // Run until Jump/Branch instruction
                step(false);
            }
            return cc;
        }
    };
};
const cpu = new pseudo.CstrMips();
pseudo.CstrMain = function() {
    let requestAF, totalFrames;
    // AJAX function
    function request(path, callback) {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status === 404) {
                console.info('Unable to read file "' + path + '"');
            }
            else {
                callback(xhr.response);
            }
        };
        xhr.responseType = 'ARRAYBUFFER'.toLowerCase();
        xhr.open('GET', path);
        xhr.send();
    }
    // Exposed class methods/variables
    return {
        init(screen) {
            draw.init(screen);
            request('bios/scph1001.bin', function(data) {
                mem.writeROM(data);
            });
        },
        reset() {
            totalFrames = 0;
            // Reset all emulator components
             cpu.reset();
            draw.reset();
             mem.reset();
        },
        run(now) {
            let frame = 10.0 + (now - totalFrames);
            let cc = frame * (33868800 / 1000);
            while (cc > 0) {
                let blockTime = cpu.run();
                cc -= blockTime;
                console.info('Block count ' + blockTime);
            }
            psx.error('EOF');
            totalFrames += frame;
            requestAF = requestAnimationFrame(psx.run);
        },
        hex(number) {
            return '0x' + (number >>> 0).toString(16);
        },
        error(out) {
            cancelAnimationFrame(requestAF);
            requestAF = undefined;
            throw new Error('/// PSeudo ' + out);
        }
    };
};
const psx = new pseudo.CstrMain();
