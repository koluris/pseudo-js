#define PSX_CLK 33868800

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
            let cc = frame * (PSX_CLK / 1000);

            while (--cc > 0) {
            }
            totalFrames += frame;
            requestAF = requestAnimationFrame(psx.run);
        }
    };
};

const psx = new pseudo.CstrMain();
