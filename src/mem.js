#define scopeMemW(maccess, width, hw, size) \
    switch(addr >>> 24) { \
        case 0x00: \
        case 0x80: \
        case 0xA0: \
            maccess(mem.ram.width, addr) = data; \
            return; \
        \
        case 0x1f: \
            if ((addr & 0xffff) >= 0x400) { \
                io.write.hw(addr & 0xffff, data); \
                return; \
            } \
            \
            maccess(mem.hwr.width, addr) = data; \
            return; \
    } \
    \
    psx.error('Mem W ' + size + ' ' + psx.hex(addr) + ' <- ' + psx.hex(data))

#define scopeMemR(maccess, width, hw, size) \
    switch(addr >>> 24) { \
        case 0x00: \
        case 0x80: \
        case 0xA0: \
            return maccess(mem.ram.width, addr); \
        \
        case 0xbf: \
            return maccess(mem.rom.width, addr); \
        \
        case 0x1f: \
            if ((addr & 0xffff) >= 0x400) { \
                return io.read.hw(addr & 0xffff); \
            } \
            \
            return maccess(mem.hwr.width, addr); \
    } \
    \
    psx.error('Mem R ' + size + ' ' + psx.hex(addr)); \
    return 0

pseudo.CstrMem = function() {
    const PSX_EXE_HEADER_SIZE = 0x800;

    return {
        ram: union(0x200000),
        hwr: union(0x4000),

        writeExecutable(data) {
            const header = new UintWcap(data, 0, PSX_EXE_HEADER_SIZE);
            const offset = header[2 + 4] & (mem.ram.ub.bSize - 1);

            mem.ram.ub.set(new UintBcap(data, PSX_EXE_HEADER_SIZE), offset);

            return header;
        },

        write: {
            w(addr, data) { scopeMemW(directMemW, uw, w, '32'); },
            h(addr, data) { scopeMemW(directMemH, uh, h, '16'); },
            b(addr, data) { scopeMemW(directMemB, ub, b, '08'); },
        },

        read: {
            w(addr) { scopeMemR(directMemW, uw, w, '32'); },
            h(addr) { scopeMemR(directMemH, uh, h, '16'); },
            b(addr) { scopeMemR(directMemB, ub, b, '08'); },
        }
    };
};

const mem = new pseudo.CstrMem();
