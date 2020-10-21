pseudo.CstrBus = (function() {
    // Interrupts
    const IRQ_ENABLED  = 1;
    const IRQ_DISABLED = 0;

    // DMA channel
    const DMA_MDEC_IN  = 0;
    const DMA_MDEC_OUT = 1;
    const DMA_GPU      = 2;
    const DMA_CD       = 3;
    const DMA_SPU      = 4;
    const DMA_PARALLEL = 5;
    const DMA_CLEAR_OT = 6;

    // Definition and threshold of interrupts
    const interrupts = [{
        code: IRQ_VBLANK,
        dest: 8
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

        interruptsUpdate() { // A method to schedule when IRQs should fire
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
            interrupts[code].queued = IRQ_ENABLED;
        },
        
        checkDMA(addr, data) {
            const chan = ((addr >>> 4) & 0xf) - 8;

            if (dpcr & (8 << (chan * 4))) {
                chcr = data;

                switch(chan) {
                    case 0: // MDEC in
                    case 1: // MDEC out
                        break;

                    case 2: vs   .executeDMA(addr); break; // Graphics
                    case 3: cdrom.executeDMA(addr); break; // CD-ROM
                    case 4: audio.executeDMA(addr); break; // Audio
                    case 6: mem  .executeDMA(addr); break; // Clear OT

                    default:
                        psx.error('DMA Channel '+chan);
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
})();
