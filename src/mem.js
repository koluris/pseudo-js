/* Base structure and authentic idea PSeudo (Credits: Dennis Koluris) */

#define definitionMemW(maccess, width, hw, size) \
    if ((addr & MEM_MASK) < MEM_BOUNDS_RAM) { \
        if (cpu.writeOK()) { \
            maccess(mem.ram.width, addr) = data; \
        } \
        return; \
    } \
    \
    if ((addr & MEM_MASK) < MEM_BOUNDS_SCR) { \
        maccess(mem.hwr.width, addr) = data; \
        return; \
    } \
    \
    if ((addr & MEM_MASK) < MEM_BOUNDS_HWR) { \
        io.write.hw(addr & 0xffff, data); \
        return; \
    } \
    \
    if ((addr) == 0xfffe0130) { \
        return; \
    } \
    \
    psx.error('Mem W ' + size + ' ' + psx.hex(addr) + ' <- ' + psx.hex(data))

#define definitionMemR(maccess, width, hw, size) \
    if ((addr & MEM_MASK) < MEM_BOUNDS_RAM) { \
        return maccess(mem.ram.width, addr); \
    } \
    \
    if ((addr & MEM_MASK) < MEM_BOUNDS_SCR) { \
        return maccess(mem.hwr.width, addr); \
    } \
    \
    if ((addr & MEM_MASK) < MEM_BOUNDS_HWR) { \
        return io.read.hw(addr & 0xffff); \
    } \
    \
    if ((addr & MEM_MASK) < MEM_BOUNDS_ROM) { \
        return maccess(mem.rom.width, addr); \
    } \
    \
    if ((addr) == 0xfffe0130) { \
        return 0; \
    } \
    \
    psx.error('Mem R ' + size + ' ' + psx.hex(addr)); \
    return 0

pseudo.CstrMem = function() {
    // This mask unifies the RAM mirrors (0, 8, A) into one unique case
    const MEM_MASK = 0x00ffffff;
    
    const MEM_BOUNDS_RAM = 0xf0800000 & MEM_MASK;
    const MEM_BOUNDS_SCR = 0x1f800400 & MEM_MASK;
    const MEM_BOUNDS_HWR = 0x1f804000 & MEM_MASK;
    const MEM_BOUNDS_ROM = 0xbfc80000 & MEM_MASK;

    const PSX_EXE_HEADER_SIZE = 0x800;

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
            const offset = header[2 + 4] & (mem.ram.ub.bSize - 1); // Offset needs boundaries... huh?
            const size   = header[2 + 5];

            mem.ram.ub.set(new UintBcap(data, PSX_EXE_HEADER_SIZE, size), offset);

            return header;
        },

        write: {
            w(addr, data) {
                definitionMemW(directMemW, uw, w, 32);
            },

            h(addr, data) {
                definitionMemW(directMemH, uh, h, 16);
            },

            b(addr, data) {
                definitionMemW(directMemB, ub, b, 08);
            }
        },

        read: {
            w(addr) {
                definitionMemR(directMemW, uw, w, 32);
            },

            h(addr) {
                definitionMemR(directMemH, uh, h, 16);
            },

            b(addr) {
                definitionMemR(directMemB, ub, b, 08);
            }
        },

        executeDMA(addr) {
            if (!bcr || chcr !== 0x11000002) {
                return;
            }
            madr &= 0xffffff;

            while(--bcr) {
                directMemW(mem.ram.uw, madr) = (madr - 4) & 0xffffff;
                madr -= 4;
            }
            directMemW(mem.ram.uw, madr) = 0xffffff;
        }
    };
};

const mem = new pseudo.CstrMem();
