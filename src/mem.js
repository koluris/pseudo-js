/* Base structure and authentic idea PSeudo (Credits: Dennis Koluris) */

pseudo.CstrMem = function() {
    // Exposed class methods/variables
    return {
        ram: union(0x200000),
        rom: union(0x80000),
        hwr: union(0x4000),

        reset() {
            // Reset all, except for BIOS
            mem.ram.ub.fill(0);
            mem.hwr.ub.fill(0);
        },

        writeROM(data) {
            mem.rom.ub.set(new UintBcap(data));
        },

        write: {
            w(addr, data) {
                switch(addr >>> 24) {
                    case 0x00:
                        if (cpu.copr[12] & 0x10000) {
                            return;
                        }
                        directMemW(mem.ram.uw, addr) = data;
                        return;

                    case 0x1f:
                        if ((addr & 0xffff) >= 0x400) {
                            io.write.w(addr & 0xffff, data);
                            return;
                        }
                        directMemW(mem.hwr.uw, addr) = data;
                        return;
                }

                if ((addr) == 0xfffe0130) {
                    return;
                }

                psx.error('Mem W32 ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            }
        },

        read: {
            w(addr) {
                switch(addr >>> 24) {
                    case 0xbf:
                        return directMemW(mem.rom.uw, addr);
                }

                psx.error('Mem R32 ' + psx.hex(addr));
            }
        }
    };
};

const mem = new pseudo.CstrMem();
