pseudo.CstrBus = function() {
    return {
        checkDMA(addr, data) {
            const chan = ((addr >>> 4) & 0xf) - 8;
            
            if (dpcr & (8 << (chan * 4))) {
                if (chan === 2) {
                    vs.executeDMA(addr);
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
