pseudo.CstrHardware = function() {
    return {
        write: {
            w(addr, data) {
                switch(addr) {
                    case 0x10a8: // GPU DMA chcr
                        chcr = data;
                        vs.executeDMA(addr);
                        chcr = data & (~(0x01000000));
                        return;

                    case 0x1810: // GPU Data
                        vs.writeData(data);
                        return;
                }

                directMemW(mem.hwr.uw, addr) = data;
                return;
            }
        },

        read: {
            w(addr) {
                switch(addr) {
                    case 0x1814: // GPU Status
                        return 0x14802000;
                }

                return directMemW(mem.hwr.uw, addr);
            }
        }
    };
};

const io = new pseudo.CstrHardware();
