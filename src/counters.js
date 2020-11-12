/* Base structure taken from FPSE open source emulator, and improved upon (Credits: BERO, LDChen) */

#define count(n) \
    directMemH(mem.hwr.uh, 0x1100 + (n << 4))

#define  mode(n) \
    directMemW(mem.hwr.uw, 0x1104 + (n << 4))

#define   dst(n) \
    directMemH(mem.hwr.uh, 0x1108 + (n << 4))

#define bound(n) \
    bounds[n]

#define RTC_PORT(addr) \
    (addr >>> 4) & 3

pseudo.CstrCounters = function() {
    // PSX root clock
    const PSX_CLOCK      = 33868800;
    const PSX_VSYNC_NTSC = PSX_CLOCK / 60;
    const PSX_VSYNC_PAL  = PSX_CLOCK / 50;
    const PSX_HSYNC      = PSX_CLOCK / 60 / 480;

    const RTC_COUNT  = 0;
    const RTC_MODE   = 4;
    const RTC_TARGET = 8;
    const RTC_BOUND  = 0xffff;

    let bounds = [];
    let vbk, hbk;

    // Exposed class functions/variables
    return {
        reset() {
            for (let i = 0; i < 3; i++) {
                bounds[i] = RTC_BOUND;
            }

            vbk = 0;
            hbk = PSX_HSYNC;
        },

        update(threshold) {
            let temp;

            temp = count(0) + ((mode(0) & 0x100) ? threshold : threshold / 8);

            if (temp >= bound(0) && count(0) < bound(0)) { temp = 0;
                if (mode(0) & 0x50) {
                    bus.interruptSet(IRQ_RTC0);
                }
            }
            count(0) = temp;

            if (!(mode(1) & 0x100)) {
                temp = count(1) + threshold;

                if (temp >= bound(1) && count(1) < bound(1)) { temp = 0;
                    if (mode(1) & 0x50) {
                        psx.error('RTC timer[1].count >= timer[1].bound');
                    }
                }
                count(1) = temp;
            }
            else {
                if ((hbk -= threshold) <= 0) {
                    if (++count(1) == bound(1)) { count(1) = 0;

                        if (mode(1) & 0x50) {
                            bus.interruptSet(IRQ_RTC1);
                        }
                    }
                    hbk = PSX_HSYNC;
                }
            }

            if (!(mode(2) & 1)) {
                temp = count(2) + ((mode(2) & 0x200) ? threshold / 8 : threshold);

                if (temp >= bound(2) && count(2) < bound(2)) { temp = 0;
                    if (mode(2) & 0x50) {
                        bus.interruptSet(IRQ_RTC2);
                    }
                }
                count(2) = temp;
            }

            // Graphics
            vbk += threshold * 1;

            if (vbk >= PSX_VSYNC_NTSC) { vbk = 0;
                bus.interruptSet(IRQ_VBLANK);
                 vs.redraw();
                cpu.setSuspended();
            }
        },

        scopeW(addr, data) {
            const p = RTC_PORT(addr);

            switch(addr & 0xf) {
                case RTC_COUNT:
                    count(p) = data & 0xffff;
                    return;

                case RTC_MODE:
                    mode( p) = data;
                    bound(p) = ((mode(p) & 8) && dst(p)) ? dst(p) : RTC_BOUND;
                    return;

                case RTC_TARGET:
                    dst(  p) = data & 0xffff;
                    bound(p) = ((mode(p) & 8) && dst(p)) ? dst(p) : RTC_BOUND;
                    return;
            }

            psx.error('RTC Write: '+ psx.hex(addr & 0xf));
        }
    };
};

const rootcnt = new pseudo.CstrCounters();
