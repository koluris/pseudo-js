/* Base structure taken from FPSE open source emulator, and improved upon (Credits: BERO, LDChen) */

pseudo.CstrCounters = function() {
    // PSX root clock
    const PSX_CLOCK      = 33868800;
    const PSX_VSYNC_NTSC = PSX_CLOCK / 60;
    const PSX_VSYNC_PAL  = PSX_CLOCK / 50;
    const PSX_HSYNC      = PSX_CLOCK / 60 / 480;

    let vbk;

    // Exposed class functions/variables
    return {
        reset() {
            vbk = 0;
        },

        update(threshold) {
            // Graphics
            vbk += threshold * 2;

            if (vbk >= PSX_VSYNC_NTSC) { vbk = 0;
                bus.interruptSet(IRQ_VBLANK);
                 vs.redraw();
                cpu.setSuspended();
            }
        }
    };
};

const rootcnt = new pseudo.CstrCounters();
