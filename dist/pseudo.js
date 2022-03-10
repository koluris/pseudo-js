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
pseudo.CstrMem = function() {
    // Exposed class methods/variables
    return {
        rom: union(0x80000),
        reset() {
            // Reset all, except for BIOS
        },
        writeROM(data) {
            mem.rom.ub.set(new Uint8Array(data));
        },
        read: {
            w(addr) {
                switch(addr >>> 24) {
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
    function step() {
        const code  = mem.read.w(cpu.base[32]);
        cpu.base[32] += 4;
        switch(((code >>> 26) & 0x3f)) {
            case 13: // ORI
                cpu.base[((code >>> 16) & 0x1f)] = cpu.base[((code >>> 21) & 0x1f)] | (code & 0xffff);
                return;
            case 15: // LUI
                cpu.base[((code >>> 16) & 0x1f)] = code << 16;
                break;
            default:
                psx.error(psx.hex(((code >>> 26) & 0x3f)));
                break;
        }
        cpu.base[0] = 0;
        cc++;
    }
    // Exposed class methods/variables
    return {
        base: new Uint32Array(32 + 3), // + cpu.base[32], cpu.base[33], cpu.base[34]
        reset() {
            // Reset processors
            cpu.base.fill(0);
            branched = false;
            cpu.base[32] = 0xbfc00000;
            cc = 0;
        },
        run() {
            // Reset frames
            cc = 0;
            while(!branched) { // Run until Jump/Branch instruction
                step();
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
                console.info(blockTime);
            }
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
