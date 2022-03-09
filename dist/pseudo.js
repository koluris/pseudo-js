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
            request('bios/scph1001.bin', function(resp) {
                console.info(resp);
            });
        },
        reset() {
            draw.reset();
            totalFrames = 0;
            //psx.run(performance.now());
        },
        run(now) {
            let frame = 10.0 + (now - totalFrames);
            let cc = frame * (33868800 / 1000);
            while (--cc > 0) {
            }
            totalFrames += frame;
            requestAF = requestAnimationFrame(psx.run);
        }
    };
};
const psx = new pseudo.CstrMain();
