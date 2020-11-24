/* Base structure and authentic idea PSeudo (Credits: Dennis Koluris) */

#define scopeMemW(maccess, width, hw, size, align) \
    if (addr % align !== 0) { \
        psx.error('Mem W align error at ' + size + ' bits'); \
    } \
    \
    switch(addr >>> 24) { \
        case 0x00: \
        case 0x80: \
        case 0xA0: \
            if (cpu.copr[12] & 0x10000) { \
                return; \
            } \
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
    if ((addr) == 0xfffe0130) { \
        return; \
    } \
    \
    psx.error('Mem W ' + size + ' ' + psx.hex(addr) + ' <- ' + psx.hex(data))

#define scopeMemR(maccess, width, hw, size, align) \
    if (addr % align !== 0) { \
        psx.error('Mem R align error at ' + size + ' bits'); \
    } \
    \
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
    if ((addr) == 0xfffe0130) { \
        return 0; \
    } \
    \
    psx.error('Mem R ' + size + ' ' + psx.hex(addr)); \
    return 0

pseudo.CstrMem = function() {
    const PSX_EXE_HEADER_SIZE = 0x800;

    // Exposed class functions/variables
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

        writeExecutable(data) {
            const header = new UintWcap(data, 0, PSX_EXE_HEADER_SIZE);
            const offset = header[2 + 4] & (mem.ram.ub.bSize - 1); // Relative RAM address
            const size   = header[2 + 5];

            mem.ram.ub.set(new UintBcap(data, PSX_EXE_HEADER_SIZE, size), offset);

            return header;
        },

        write: {
            w(addr, data) { scopeMemW(directMemW, uw, w, '32', 4); },
            h(addr, data) { scopeMemW(directMemH, uh, h, '16', 2); },
            b(addr, data) { scopeMemW(directMemB, ub, b, '08', 1); },
        },

        read: {
            w(addr) { scopeMemR(directMemW, uw, w, '32', 4); },
            h(addr) { scopeMemR(directMemH, uh, h, '16', 2); },
            b(addr) { scopeMemR(directMemB, ub, b, '08', 1); },
        },

        executeDMA(addr) {
            if (!bcr || chcr !== 0x11000002) {
                return;
            }
            let p = madr;

            for (let i = bcr - 1; i >= 0; i--, p -= 4) {
                mem.write.w(p, (i == 0) ? 0xffffff : (p - 4) & 0xffffff);
            }
        }
    };
};

const mem = new pseudo.CstrMem();
