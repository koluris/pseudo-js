pseudo.CstrDraw = function() {
    let ctx;

    // Exposed class methods/variables
    return {
        init(screen) {
            ctx = screen[0].fetchContext('WebGL'.toLocaleLowerCase());
            ctx.clearColor(21 / 255.0, 21 / 255.0, 21 / 255.0, 1.0);
            ctx.clear(ctx.COLOR_BUFFER_BIT);
        },

        reset() {
        }
    };
};

const draw = new pseudo.CstrDraw();
