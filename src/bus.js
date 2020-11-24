/* Base structure and authentic idea PSeudo (Credits: Dennis Koluris) */

pseudo.CstrBus = function() {
    // Interrupts
    const IRQ_ENABLED  = 1;
    const IRQ_DISABLED = 0;

    // Definition and threshold of interrupts
    const interrupts = [{
        code: IRQ_VBLANK,
        dest: 4
    }, {
        code: IRQ_GPU,
        dest: 1
    }, {
        code: IRQ_CD,
        dest: 4
    }, {
        code: IRQ_DMA,
        dest: 8
    }, {
        code: IRQ_RTC0,
        dest: 1
    }, {
        code: IRQ_RTC1,
        dest: 1
    }, {
        code: IRQ_RTC2,
        dest: 1
    }, {
        code: IRQ_SIO0,
        dest: 8
    }, {
        code: IRQ_SIO1,
        dest: 8
    }, {
        code: IRQ_SPU,
        dest: 1
    }, {
        code: IRQ_PIO,
        dest: 1
    }];

    // Exposed class functions/variables
    return {
        reset() {
            for (const item of interrupts) {
                item.queued = IRQ_DISABLED;
            }
        },

        update() { // A method to schedule when IRQs should fire
            for (const item of interrupts) {
                if (item.queued) {
                    if (item.queued++ === item.dest) {
                        data16 |= (1 << item.code);
                        item.queued = IRQ_DISABLED;
                        break;
                    }
                }
            }
        },

        interruptSet(code) {
            if (!interrupts[code].queued) { interrupts[code].queued = IRQ_ENABLED; }
        },
        
        checkDMA(addr, data) {
            const chan = ((addr >>> 4) & 0xf) - 8;
            
            if (dpcr & (8 << (chan * 4))) {
                switch(chan) {
                    case 0:  mdec.executeDMA(addr); break; // MDEC in
                    case 1:  mdec.executeDMA(addr); break; // MDEC out
                    case 2:    vs.executeDMA(addr); break; // Graphics
                    case 3: cdrom.executeDMA(addr); break; // CD-ROM
                    case 4: audio.executeDMA(addr); break; // Audio
                    case 6:   mem.executeDMA(addr); break; // Clear OT

                    default:
                        psx.error('DMA Channel ' + chan);
                        break;
                }
                chcr = data & (~(0x01000000));

                if (dicr & (1 << (16 + chan))) {
                    dicr |= 1 << (24 + chan);
                    bus.interruptSet(IRQ_DMA);
                }
            }
        }
    };
};

const bus = new pseudo.CstrBus();
