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
        }
    };
};
const mem = new pseudo.CstrMem();
pseudo.CstrMips = function() {
    // Exposed class methods/variables
    return {
        base: new Uint32Array(32 + 3), // + pc, lo, hi
        reset() {
            // Reset processors
            cpu.base.fill(0);
            pc = 0xbfc00000;
        },
        run() {
            psx.error('EOF');
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
            while (--cc > 0) {
                cpu.run();
            }
            totalFrames += frame;
            requestAF = requestAnimationFrame(psx.run);
        },
        error(out) {
            cancelAnimationFrame(requestAF);
            requestAF = undefined;
            throw new Error('/// PSeudo ' + out);
        }
    };
};
const psx = new pseudo.CstrMain();
