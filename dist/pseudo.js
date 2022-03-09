'use strict';
const pseudo = window.pseudo || {};
pseudo.CstrDraw = function() {
    let ctx;
    // Exposed class methods/variables
    return {
        init(screen) {
            ctx = screen[0].getContext('WebGL'.toLocaleLowerCase());
            ctx.clearColor(21 / 255.0, 21 / 255.0, 21 / 255.0, 1.0);
            ctx.clear(ctx.COLOR_BUFFER_BIT);
        },
        reset() {
        }
    };
};
const draw = new pseudo.CstrDraw();
pseudo.CstrMain = function() {
    let requestAF, totalFrames;
    // Exposed class methods/variables
    return {
        init(screen) {
            draw.init(screen);
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
