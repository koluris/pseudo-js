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
                    case 0x80:
                    case 0xa0:
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
            },

            h(addr, data) {
                switch(addr >>> 24) {
                    case 0x1f:
                        if ((addr & 0xffff) >= 0x400) {
                            io.write.h(addr & 0xffff, data);
                            return;
                        }
                        directMemW(mem.hwr.uh, addr) = data;
                        return;
                }

                psx.error('Mem W16 ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            },

            b(addr, data) {
                switch(addr >>> 24) {
                    case 0x00:
                    case 0x80:
                    case 0xa0:
                        directMemW(mem.ram.ub, addr) = data;
                        return;

                    case 0x1f:
                        if ((addr & 0xffff) >= 0x400) {
                            io.write.b(addr & 0xffff, data);
                            return;
                        }
                        directMemW(mem.hwr.ub, addr) = data;
                        return;
                }

                psx.error('Mem W08 ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            }
        },

        read: {
            w(addr) {
                switch(addr >>> 24) {
                    case 0x00:
                    case 0x80:
                    case 0xa0:
                        return directMemW(mem.ram.uw, addr);

                    case 0xbf:
                        return directMemW(mem.rom.uw, addr);

                    case 0x1f:
                        if ((addr & 0xffff) >= 0x400) {
                            return io.read.w(addr & 0xffff);
                        }
                        return directMemW(mem.hwr.uw, addr);
                }

                psx.error('Mem R32 ' + psx.hex(addr));
            },

            b(addr) {
                switch(addr >>> 24) {
                    case 0x00:
                    case 0x80:
                        return directMemW(mem.ram.ub, addr);

                    case 0xbf:
                        return directMemW(mem.rom.ub, addr);

                    case 0x1f:
                        if ((addr & 0xffff) >= 0x400) {
                            return io.read.b(addr & 0xffff);
                        }
                        return directMemW(mem.hwr.ub, addr);
                }

                psx.error('Mem R08 ' + psx.hex(addr));
            }
        }
    };
};

const mem = new pseudo.CstrMem();
