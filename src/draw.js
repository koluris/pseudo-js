/* Base structure and authentic idea PSeudo (Credits: Dennis Koluris) */

pseudo.CstrDraw = function() {
    let ctx;

    // Exposed class methods/variables
    return {
        init(screen) {
            ctx = screen[0].fetchContext('WebGL'.toLowerCase());
            ctx.clearColor(21 / 255.0, 21 / 255.0, 21 / 255.0, 1.0);
        },

        reset() {
            ctx.clear(ctx.COLOR_BUFFER_BIT);
        }
    };
};

const draw = new pseudo.CstrDraw();
