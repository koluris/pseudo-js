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
                    case (addr == 0x1070): // IRQ Status
                        mem.hwr.uw[((0x1070) & (mem.hwr.uw.byteLength - 1)) >>> 2] &= data & mem.hwr.uw[((0x1074) & (mem.hwr.uw.byteLength - 1)) >>> 2];
                        return;
                    case (addr >= 0x1810 && addr <= 0x1814): // Graphics
                        vs.scopeW(addr, data);
                        return;
                    
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
                    case (addr == 0x1074): // IRQ Mask
                    case (addr == 0x10f0): // DPCR
                        mem.hwr.uw[(( addr) & (mem.hwr.uw.byteLength - 1)) >>> 2] = data;
                        return;
                }
                psx.error('Hardware Write w ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            },
            h(addr, data) {
                switch(true) {
                    
                    case (addr >= 0x1100 && addr <= 0x1128): // Rootcounters
                    case (addr >= 0x1c00 && addr <= 0x1dfe): // SPU
                        mem.hwr.uh[(( addr) & (mem.hwr.uh.byteLength - 1)) >>> 1] = data;
                        return;
                }
                psx.error('Hardware Write h ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            },
            b(addr, data) {
                switch(true) {
                    
                    case (addr == 0x2041): // DIP Switch?
                        mem.hwr.ub[(( addr) & (mem.hwr.ub.byteLength - 1)) >>> 0] = data;
                        return;
                }
                psx.error('Hardware Write b ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            }
        },
        read: {
            w(addr) {
                switch(true) {
                    case (addr >= 0x1810 && addr <= 0x1814): // Graphics
                        return vs.scopeR(addr);
                    
                    case (addr == 0x1074): // IRQ Mask
                    case (addr == 0x10f0): // DPCR
                        return mem.hwr.uw[(( addr) & (mem.hwr.uw.byteLength - 1)) >>> 2];
                }
                psx.error('Hardware Read w ' + psx.hex(addr));
            },
            h(addr) {
                switch(true) {
                    
                    case (addr >= 0x1c00 && addr <= 0x1e3e): // SPU
                        return mem.hwr.uh[(( addr) & (mem.hwr.uh.byteLength - 1)) >>> 1];
                }
                psx.error('Hardware Read h ' + psx.hex(addr));
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
                psx.error('Mem Write w ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            },
            h(addr, data) {
                switch(addr >>> 24) {
                    case 0x80:
                        mem.ram.uh[(( addr) & (mem.ram.uh.byteLength - 1)) >>> 1] = data;
                        return;
                    case 0x1f:
                        if ((addr & 0xffff) >= 0x400) {
                            io.write.h(addr & 0xffff, data);
                            return;
                        }
                        mem.hwr.uh[(( addr) & (mem.hwr.uh.byteLength - 1)) >>> 1] = data;
                        return;
                }
                psx.error('Mem Write h ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            },
            b(addr, data) {
                switch(addr >>> 24) {
                    case 0x00:
                    case 0x80:
                    case 0xa0:
                        mem.ram.ub[(( addr) & (mem.ram.ub.byteLength - 1)) >>> 0] = data;
                        return;
                    case 0x1f:
                        if ((addr & 0xffff) >= 0x400) {
                            io.write.b(addr & 0xffff, data);
                            return;
                        }
                        mem.hwr.ub[(( addr) & (mem.hwr.ub.byteLength - 1)) >>> 0] = data;
                        return;
                }
                psx.error('Mem Write b ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            }
        },
        read: {
            w(addr) {
                switch(addr >>> 24) {
                    case 0x00:
                    case 0x80:
                    case 0xa0:
                        return mem.ram.uw[(( addr) & (mem.ram.uw.byteLength - 1)) >>> 2];
                    case 0xbf:
                        return mem.rom.uw[(( addr) & (mem.rom.uw.byteLength - 1)) >>> 2];
                    case 0x1f:
                        if ((addr & 0xffff) >= 0x400) {
                            return io.read.w(addr & 0xffff);
                        }
                        return mem.hwr.uw[(( addr) & (mem.hwr.uw.byteLength - 1)) >>> 2];
                }
                psx.error('Mem Read w ' + psx.hex(addr));
            },
            h(addr) {
                switch(addr >>> 24) {
                    case 0x80:
                        return mem.ram.uh[(( addr) & (mem.ram.uh.byteLength - 1)) >>> 1];
                    case 0x1f:
                        if ((addr & 0xffff) >= 0x400) {
                            return io.read.h(addr & 0xffff);
                        }
                        return mem.hwr.uh[(( addr) & (mem.hwr.uh.byteLength - 1)) >>> 1];
                }
                psx.error('Mem Read h ' + psx.hex(addr));
            },
            b(addr) {
                switch(addr >>> 24) {
                    case 0x00:
                    case 0x80:
                        return mem.ram.ub[(( addr) & (mem.ram.ub.byteLength - 1)) >>> 0];
                    case 0xbf:
                        return mem.rom.ub[(( addr) & (mem.rom.ub.byteLength - 1)) >>> 0];
                    case 0x1f:
                        if ((addr & 0xffff) >= 0x400) {
                            return io.read.b(addr & 0xffff);
                        }
                        return mem.hwr.ub[(( addr) & (mem.hwr.ub.byteLength - 1)) >>> 0];
                }
                psx.error('Mem Read b ' + psx.hex(addr));
            }
        }
    };
};
const mem = new pseudo.CstrMem();
// Inline functions for speedup
pseudo.CstrMips = function() {
    // SW & LW tables
    const mask = [
        [0x00ffffff, 0x0000ffff, 0x000000ff, 0x00000000],
        [0x00000000, 0xff000000, 0xffff0000, 0xffffff00],
        [0xffffff00, 0xffff0000, 0xff000000, 0x00000000],
        [0x00000000, 0x000000ff, 0x0000ffff, 0x00ffffff],
    ];
    const shift = [
        [0x18, 0x10, 0x08, 0x00],
        [0x00, 0x08, 0x10, 0x18],
        [0x18, 0x10, 0x08, 0x00],
        [0x00, 0x08, 0x10, 0x18],
    ];
    // Cache for expensive calculation
    const power32 = Math.pow(2, 32); 
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
                    case 2: // SRL
                        cpu.base[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 16) & 0x1f)] >>> ((code >>> 6) & 0x1f);
                        break;
                    case 3: // SRA
                        cpu.base[((code >>> 11) & 0x1f)] = ((cpu.base[((code >>> 16) & 0x1f)]) << 0 >> 0) >> ((code >>> 6) & 0x1f);
                        break;
                    case 4: // SLLV
                        cpu.base[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 16) & 0x1f)] << (cpu.base[((code >>> 21) & 0x1f)] & 31);
                        break;
                    case 6: // SRLV
                        cpu.base[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 16) & 0x1f)] >>> (cpu.base[((code >>> 21) & 0x1f)] & 31);
                        break;
                    case 7: // SRAV
                        cpu.base[((code >>> 11) & 0x1f)] = ((cpu.base[((code >>> 16) & 0x1f)]) << 0 >> 0) >> (cpu.base[((code >>> 21) & 0x1f)] & 31);
                        break;
                    case 9: // JALR
                        cpu.base[((code >>> 11) & 0x1f)] = cpu.base[32] + 4;
                    case 8: // JR
                        branch(cpu.base[((code >>> 21) & 0x1f)]);
                        consoleOutput();
                        break;
                    case 12: // SYSCALL
                        cpu.base[32] -= 4;
                        exception(0x20, inslot);
                        break;
                    case 16: // MFHI
                        cpu.base[((code >>> 11) & 0x1f)] = cpu.base[34];
                        break;
                    case 17: // MTHI
                        cpu.base[34] = cpu.base[((code >>> 21) & 0x1f)];
                        return;
                    case 18: // MFLO
                        cpu.base[((code >>> 11) & 0x1f)] = cpu.base[33];
                        break;
                    case 19: // MTLO
                        cpu.base[33] = cpu.base[((code >>> 21) & 0x1f)];
                        break;
                    case 25: // MULTU
                        { const temp = cpu.base[((code >>> 21) & 0x1f)] *  cpu.base[((code >>> 16) & 0x1f)]; cpu.base[33] = temp & 0xffffffff; cpu.base[34] = Math.floor(temp / power32); };
                        break;
                    case 26: // DIV
                        if ( ((cpu.base[((code >>> 16) & 0x1f)]) << 0 >> 0)) { cpu.base[33] = ((cpu.base[((code >>> 21) & 0x1f)]) << 0 >> 0) /  ((cpu.base[((code >>> 16) & 0x1f)]) << 0 >> 0); cpu.base[34] = ((cpu.base[((code >>> 21) & 0x1f)]) << 0 >> 0) %  ((cpu.base[((code >>> 16) & 0x1f)]) << 0 >> 0); };
                        break;
                    case 27: // DIVU
                        if ( cpu.base[((code >>> 16) & 0x1f)]) { cpu.base[33] = cpu.base[((code >>> 21) & 0x1f)] /  cpu.base[((code >>> 16) & 0x1f)]; cpu.base[34] = cpu.base[((code >>> 21) & 0x1f)] %  cpu.base[((code >>> 16) & 0x1f)]; };
                        break;
                    case 32: // ADD
                    case 33: // ADDU
                        cpu.base[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] + cpu.base[((code >>> 16) & 0x1f)];
                        break;
                    case 35: // SUBU
                        cpu.base[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] - cpu.base[((code >>> 16) & 0x1f)];
                        break;
                    case 36: // AND
                        cpu.base[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] & cpu.base[((code >>> 16) & 0x1f)];
                        break;
                    case 37: // OR
                        cpu.base[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] | cpu.base[((code >>> 16) & 0x1f)];
                        break;
                    case 39: // NOR
                        cpu.base[((code >>> 11) & 0x1f)] = (~(cpu.base[((code >>> 21) & 0x1f)] | cpu.base[((code >>> 16) & 0x1f)]));
                        break;
                    case 42: // SLT
                        cpu.base[((code >>> 11) & 0x1f)] = ((cpu.base[((code >>> 21) & 0x1f)]) << 0 >> 0) < ((cpu.base[((code >>> 16) & 0x1f)]) << 0 >> 0);
                        break;
                    case 43: // SLTU
                        cpu.base[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] < cpu.base[((code >>> 16) & 0x1f)];
                        break;
                    default:
                        psx.error('Special CPU instruction ' + (code & 0x3f));
                        break;
                }
                break;
            case 1: // REGIMM
                switch(((code >>> 16) & 0x1f)) {
                    case 0: // BLTZ
                        if (((cpu.base[((code >>> 21) & 0x1f)]) << 0 >> 0) <  0) {
                            branch((cpu.base[32] + ((((code) << 16 >> 16)) << 2)));
                        }
                        break;
                    case 1: // BGEZ
                        if (((cpu.base[((code >>> 21) & 0x1f)]) << 0 >> 0) >= 0) {
                            branch((cpu.base[32] + ((((code) << 16 >> 16)) << 2)));
                        }
                        break;
                    default:
                        psx.error('Bcond CPU instruction ' + ((code >>> 16) & 0x1f));
                        break;
                }
                break;
            case 3: // JAL
                cpu.base[31] = cpu.base[32] + 4;
            case 2: // J
                branch(((cpu.base[32] & 0xf0000000) | (code & 0x3ffffff) << 2));
                break;
            case 4: // BEQ
                if (cpu.base[((code >>> 21) & 0x1f)] === cpu.base[((code >>> 16) & 0x1f)]) {
                    branch((cpu.base[32] + ((((code) << 16 >> 16)) << 2)));
                }
                break;
            case 5: // BNE
                if (cpu.base[((code >>> 21) & 0x1f)] !== cpu.base[((code >>> 16) & 0x1f)]) {
                    branch((cpu.base[32] + ((((code) << 16 >> 16)) << 2)));
                }
                break;
            case 6: // BLEZ
                if (((cpu.base[((code >>> 21) & 0x1f)]) << 0 >> 0) <= 0) {
                    branch((cpu.base[32] + ((((code) << 16 >> 16)) << 2)));
                }
                break;
            case 7: // BGTZ
                if (((cpu.base[((code >>> 21) & 0x1f)]) << 0 >> 0) > 0) {
                    branch((cpu.base[32] + ((((code) << 16 >> 16)) << 2)));
                }
                break;
            case 8: // ADDI
            case 9: // ADDIU
                cpu.base[((code >>> 16) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16));
                break;
            case 10: // SLTI
                cpu.base[((code >>> 16) & 0x1f)] = ((cpu.base[((code >>> 21) & 0x1f)]) << 0 >> 0) < (((code) << 16 >> 16));
                break;
            case 11: // SLTIU
                cpu.base[((code >>> 16) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] < (code & 0xffff);
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
                    case 0: // MFC0
                        cpu.base[((code >>> 16) & 0x1f)] = cpu.copr[((code >>> 11) & 0x1f)];
                        break;
                    case 4: // MTC0
                        cpu.copr[((code >>> 11) & 0x1f)] = cpu.base[((code >>> 16) & 0x1f)];
                        break;
                    case 16: // RFE
                        cpu.copr[12] = (cpu.copr[12] & 0xfffffff0) | ((cpu.copr[12] >>> 2) & 0xf);
                        break;
                    default:
                        psx.error('Coprocessor 0 instruction ' + ((code >>> 21) & 0x1f));
                        break;
                }
                break;
            case 32: // LB
                cpu.base[((code >>> 16) & 0x1f)] = ((mem.read.b((cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))))) << 24 >> 24);
                cc += 3;
                break;
            case 33: // LH
                cpu.base[((code >>> 16) & 0x1f)] = ((mem.read.h((cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))))) << 16 >> 16);
                cc += 3;
                break;
            case 35: // LW
                cpu.base[((code >>> 16) & 0x1f)] = mem.read.w((cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))));
                cc += 3;
                break;
            case 36: // LBU
                cpu.base[((code >>> 16) & 0x1f)] = mem.read.b((cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))));
                cc += 3;
                break;
            case 37: // LHU
                cpu.base[((code >>> 16) & 0x1f)] = mem.read.h((cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))));
                cc += 3;
                break;
            case 40: // SB
                mem.write.b((cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))), cpu.base[((code >>> 16) & 0x1f)]);
                break;
            case 41: // SH
                mem.write.h((cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))), cpu.base[((code >>> 16) & 0x1f)]);
                break;
            case 42: // SWL
                { const temp = (cpu.base[((code >>> 21) & 0x1f)] + (((code) << 16 >> 16))); mem.write.w(temp & (~(3)), (cpu.base[((code >>> 16) & 0x1f)] >>> shift[ 2][temp & 3]) | (mem.read.w(temp & (~(3))) & mask[ 2][temp & 3])); };
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
    function exception(code, inslot) {
        cpu.copr[12] = (cpu.copr[12] & (~(0x3f))) | ((cpu.copr[12] << 2) & 0x3f);
        cpu.copr[13] = code;
        cpu.copr[14] = cpu.base[32];
        cpu.base[32] = 0x80;
    }
    function consoleOutput() {
        if (cpu.base[32] === 0xb0) {
            if (cpu.base[9] === 59 || cpu.base[9] === 61) {
                psx.consoleKernel(cpu.base[4] & 0xff);
            }
        }
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
        bootstrap() {
            const start = performance.now();
            while(cpu.base[32] !== 0x80030000) {
                step(false);
            }
            const delta = parseFloat(performance.now() - start).toFixed(2);
            console.info('Bootstrap completed in ' + delta + ' ms');
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
              vs.reset();
        },
        run(now) {
            let frame = 10.0 + (now - totalFrames);
            let cc = frame * (33868800 / 1000);
            while(cc -= cpu.run() > 0) {
                if (mem.hwr.uw[((0x1070) & (mem.hwr.uw.byteLength - 1)) >>> 2] & mem.hwr.uw[((0x1074) & (mem.hwr.uw.byteLength - 1)) >>> 2]) {
                    psx.error('Interrupt!');
                }
            }
            psx.error('EOF');
            totalFrames += frame;
            requestAF = requestAnimationFrame(psx.run);
        },
        hex(number) {
            return '0x' + (number >>> 0).toString(16);
        },
        consoleKernel(char) {
            console.warn(String.fromCharCode(char).toUpperCase());
        },
        error(out) {
            cancelAnimationFrame(requestAF);
            requestAF = undefined;
            throw new Error('/// PSeudo ' + out);
        }
    };
};
const psx = new pseudo.CstrMain();
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
    let modeDMA, vdiff, isVideoPAL, isVideo24Bit, disabled;
    function pipeReset() {
        pipe.data.fill(0);
        pipe.prim = 0;
        pipe.size = 0;
        pipe.row  = 0;
    }
    const dataMem = {
        write(stream, addr, size) {
            for (let i = 0; i < size; i++) {
                if (vrop.allowStore) {
                    if ((i += fetchMem(stream, addr, size - i)) >= size) {
                        continue;
                    }
                    addr += i;
                }
                ret.data = stream ? mem.ram.uw[(( addr) & (mem.ram.uw.byteLength - 1)) >>> 2] : addr;
                addr += 4;
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
        },
        read(stream, addr, size) {
            do {
                const vramValue = vs.vram.uw[(vrop.pvram + vrop.h.p) >>> 1];
                if (stream) {
                    mem.ram.uw[(( addr) & (mem.ram.uw.byteLength - 1)) >>> 2] = vramValue;
                }
                else {
                    ret.data = vramValue;
                }
                addr += 4;
                if (vrop.allowRead) {
                    if ((vrop.h.p += 2) >= vrop.h.end) {
                        vrop.h.p = vrop.h.start;
                        vrop.pvram += 1024;
                        if (++vrop.v.p >= vrop.v.end) {
                            vrop.allowRead = false;
                            break;
                        }
                    }
                }
            } while (--size);
        }
    };
    function fetchMem(stream, addr, size) {
        let count = 0;
        size <<= 1;
        while (vrop.v.p < vrop.v.end) {
            while (vrop.h.p < vrop.h.end) {
                // Keep position of vram
                const ramValue = mem.ram.uh[(( addr) & (mem.ram.uh.byteLength - 1)) >>> 1];
                if (isVideo24Bit) {
                    vrop.raw.uh[count] = ramValue;
                }
                else {
                    vrop.raw.uw[count] = tcache.pixel2texel(ramValue);
                }
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
                    return fetchMemEnd(count);
                }
            }
            vrop.h.p = vrop.h.start;
            vrop.v.p++;
        }
        return fetchMemEnd(count);
    }
    function fetchMemEnd(count) {
        if (vrop.v.p >= vrop.v.end) {
            // Draw buffer on screen
            render.outputVRAM(
                vrop.raw,
                vrop.h.start,
                vrop.v.start,
                vrop.h.end - vrop.h.start,
                vrop.v.end - vrop.v.start,
                isVideo24Bit
            );
            vrop.allowStore = false;
            vrop.raw.ub.fill(0);
        }
        if (count % 2) {
            count++;
        }
        return count >>> 1;
    }
    function photoData(data) {
        const p = [
            (data[1] >>>  0) & 0x03ff, // srcX
            (data[1] >>> 16) & 0x01ff, // srcY
            (data[2] >>>  0) & 0xffff, // iW
            (data[2] >>> 16) & 0xffff, // iH
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
        vpos: 0,
        reset() {
            vs.vram.uh.fill(0);
            ret.data     = 0x400;
            ret.status   = GPU_STAT_READYFORCOMMANDS | GPU_STAT_IDLE | GPU_STAT_DISPLAYDISABLED | 0x2000;
            modeDMA      = GPU_DMA_NONE;
            vs.vpos      = 0;
            vdiff        = 0;
            isVideoPAL   = false;
            isVideo24Bit = false;
            disabled     = true;
            // VRAM Operations
            vrop.allowStore = false;
            vrop.allowRead  = false;
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
            render.swapBuffers();
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
                            vs.vpos = (data >>> 10) & 0x1ff;
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
                                    render.resize({ w: w, h: vs.vpos ? vs.vpos : vdiff });
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
            const size = (bcr >>> 16) * (bcr & 0xffff);
            switch(chcr) {
                case 0x01000200:
                    dataMem.read(true, madr, size);
                    return;
                case 0x01000201:
                    dataMem.write(true, madr, size);
                    return;
                case 0x01000401:
                    while(madr !== 0xffffff) {
                        const count = mem.ram.uw[(( madr) & (mem.ram.uw.byteLength - 1)) >>> 2];
                        dataMem.write(true, madr + 4, count >>> 24);
                        madr = count & 0xffffff;
                    }
                    return;
                
                case 0x00000401: // Disable DMA?
                    return;
            }
            psx.error('GPU DMA ' + psx.hex(chcr));
        },
        photoSendTo(data) {
            const p = photoData(data);
            vrop.allowStore = true;
            vrop.raw = new union((p[2] * p[3]) * 4);
            // Cache invalidation
            tcache.invalidate(vrop.h.start, vrop.v.start, vrop.h.end, vrop.v.end);
        },
        photoReadFrom(data) {
            const p = photoData(data);
            vrop.allowRead = true;
            vrop.pvram = p[1] * 1024;
        }
    };
};
const vs = new pseudo.CstrGraphics();
