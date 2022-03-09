'use strict';
const pseudo = window.pseudo || {};
pseudo.CstrMain = function() {
    let suspended, requestAF, totalFrames;
    // Exposed class functions/variables
    return {
        init() {
            totalFrames = 0;
            psx.run(performance.now());
        },
        run(now) {
            let frame = 10.0 + (now - totalFrames);
            let cc = frame * (33868800 / 1000);
            console.info(frame);
            while (--cc > 0) {
            }
            totalFrames += frame;
            requestAF = requestAnimationFrame(psx.run);
        }
    };
};
const psx = new pseudo.CstrMain();
