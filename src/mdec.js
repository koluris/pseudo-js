#define ram  mem.__ram


#define tabInit(iq, addr) \
    for (let i = 0; i < 64; i++) { \
        iq[i] = (directMemB(ram.ub, madr + i) * aanscales[zscan[i]]) >> 12; \
    }

#define VALOF(a) \
    (SIGN_EXT_32(((a) << 22) >> 22))

#define MULR(a) \
    ((SIGN_EXT_32(0x0000059b) * (a)) >> 10)

#define MULG(a) \
    ((SIGN_EXT_32(0xfffffea1) * (a)) >> 10)

#define MULB(a) \
    ((SIGN_EXT_32(0x00000716) * (a)) >> 10)

#define MULF(a) \
    ((SIGN_EXT_32(0xfffffd25) * (a)) >> 10)

#define ROUND(a) \
    rtbl[(a) + 128 + 256]

#define RGB24CL(a) \
    directMemB(ram.ub, (immmm + a + 0)) = ROUND(data + iB); \
    directMemB(ram.ub, (immmm + a + 1)) = ROUND(data + iG); \
    directMemB(ram.ub, (immmm + a + 2)) = ROUND(data + iR); \

#define macroBlock(block, idx, kh, sh) { \
    let index = idx; \
    for (let k = 0; k < 8; k++, index += (sh) ? 8 : 1) { \
        if((block[index + kh * 1] | \
            block[index + kh * 2] | \
            block[index + kh * 3] | \
            block[index + kh * 4] | \
            block[index + kh * 5] | \
            block[index + kh * 6] | \
            block[index + kh * 7]) == 0) { \
                block[index + kh * 0] = \
                block[index + kh * 1] = \
                block[index + kh * 2] = \
                block[index + kh * 3] = \
                block[index + kh * 4] = \
                block[index + kh * 5] = \
                block[index + kh * 6] = \
                block[index + kh * 7] = \
                block[index + kh * 0] >> sh; \
                \
                continue; \
        } \
        let z10 = block[index + kh * 0] + block[index + kh * 4]; \
        let z11 = block[index + kh * 0] - block[index + kh * 4]; \
        let z13 = block[index + kh * 2] + block[index + kh * 6]; \
        let z12 = block[index + kh * 2] - block[index + kh * 6]; \
        z12 = ((z12 * 362) >> 8) - z13; \
        \
        let tmp0 = z10 + z13; \
        let tmp3 = z10 - z13; \
        let tmp1 = z11 + z12; \
        let tmp2 = z11 - z12; \
        \
        z13 = block[index + kh * 3] + block[index + kh * 5]; \
        z10 = block[index + kh * 3] - block[index + kh * 5]; \
        z11 = block[index + kh * 1] + block[index + kh * 7]; \
        z12 = block[index + kh * 1] - block[index + kh * 7]; \
        \
        let z5 = ((z12 - z10) * 473) >> 8; \
        \
        let tmp7 = z11 + z13; \
        let tmp6 = ((z10 * 669) >> 8) + z5 - tmp7; \
        let tmp5 = (((z11 - z13) * 362) >> 8) - tmp6; \
        let tmp4 = ((z12 * 277) >> 8) - z5 + tmp5; \
        \
        block[index + kh * 0] = (tmp0 + tmp7) >> sh; \
        block[index + kh * 7] = (tmp0 - tmp7) >> sh; \
        block[index + kh * 1] = (tmp1 + tmp6) >> sh; \
        block[index + kh * 6] = (tmp1 - tmp6) >> sh; \
        block[index + kh * 2] = (tmp2 + tmp5) >> sh; \
        block[index + kh * 5] = (tmp2 - tmp5) >> sh; \
        block[index + kh * 4] = (tmp3 + tmp4) >> sh; \
        block[index + kh * 3] = (tmp3 - tmp4) >> sh; \
    } \
}

pseudo.CstrMdec = (function() {
    const zscan = [
        0x00, 0x01, 0x08, 0x10, 0x09, 0x02, 0x03, 0x0a,
        0x11, 0x18, 0x20, 0x19, 0x12, 0x0b, 0x04, 0x05,
        0x0c, 0x13, 0x1a, 0x21, 0x28, 0x30, 0x29, 0x22,
        0x1b, 0x14, 0x0d, 0x06, 0x07, 0x0e, 0x15, 0x1c,
        0x23, 0x2a, 0x31, 0x38, 0x39, 0x32, 0x2b, 0x24,
        0x1d, 0x16, 0x0f, 0x17, 0x1e, 0x25, 0x2c, 0x33,
        0x3a, 0x3b, 0x34, 0x2d, 0x26, 0x1f, 0x27, 0x2e,
        0x35, 0x3c, 0x3d, 0x36, 0x2f, 0x37, 0x3e, 0x3f,
    ];

    const aanscales = [
        0x4000, 0x58c5, 0x539f, 0x4b42, 0x4000, 0x3249, 0x22a3, 0x11a8,
        0x58c5, 0x7b21, 0x73fc, 0x6862, 0x58c5, 0x45bf, 0x300b, 0x187e,
        0x539f, 0x73fc, 0x6d41, 0x6254, 0x539f, 0x41b3, 0x2d41, 0x1712,
        0x4b42, 0x6862, 0x6254, 0x587e, 0x4b42, 0x3b21, 0x28ba, 0x14c3,
        0x4000, 0x58c5, 0x539f, 0x4b42, 0x4000, 0x3249, 0x22a3, 0x11a8,
        0x3249, 0x45bf, 0x41b3, 0x3b21, 0x3249, 0x2782, 0x1b37, 0x0de0,
        0x22a3, 0x300b, 0x2d41, 0x28ba, 0x22a3, 0x1b37, 0x12bf, 0x098e,
        0x11a8, 0x187e, 0x1712, 0x14c3, 0x11a8, 0x0de0, 0x098e, 0x04df,
    ];

    const iq = {
         y: new SintWcap(64 * 4),
        uv: new SintWcap(64 * 4), 
    };

    let rtbl = new UintBcap(0x300)
    let cmd, status, maddr;

    // Exposed class functions/variables
    return {
        reset() {
            iq. y.fill(0);
            iq.uv.fill(0);

            for (let k = 0; k < 256; k++) {
                rtbl[k + 0x000] = 0;
                rtbl[k + 0x100] = k;
                rtbl[k + 0x200] = 255;
            }

            cmd    = 0;
            status = 0;
            maddr  = 0;
        },

        scopeW(addr, data) {
            switch(addr & 0xf) {
                case 0:
                    cmd = data;
                    return;

                case 4:
                    if (data & 0x80000000) {
                        mdec.reset();
                    }
                    return;
            }

            psx.error('MDEC Write: ' + (addr & 0xf) + ' <- ' + psx.hex(data));
        },

        scopeR(addr) {
            switch(addr & 0xf) {
                case 0:
                    return cmd;

                case 4:
                    return status;
            }

            psx.error('MDEC Read: ' + (addr & 0xf));
            return;
        },

        executeDMA(addr) {
            let size = (bcr >>> 16) * (bcr & 0xffff);

            switch(chcr) {
                case 0x1000200:
                    if (cmd & 0x08000000) { // YUV15
                    }
                    else { // YUV24
                        let blk = new SintWcap(384 * 4);
                        let im  = madr;
        
                        for (; size > 0; size -= 384 / 2, im += 384) {
                            blk.fill(0);
                            let iqtab = iq.uv;
                            let blkindex = 0;

                            for (let i = 0; i < 6; i++) {
                                if (i > 1) {
                                    iqtab = iq.y;
                                }

                                let rl = directMemH(ram.uh, maddr); // *(uh *)&mem.ram.ptr[maddr & (mem.ram.size - 1)];
                                maddr += 2;
                                
                                const q_scale = rl >> 10;
                                blk[blkindex] = iqtab[0] * VALOF(rl);

                                let k = 0;
                                for(;;) {
                                    rl = directMemH(ram.uh, maddr); // *(uh *)&mem.ram.ptr[maddr & (mem.ram.size - 1)];
                                    maddr += 2;
                                    
                                    if (rl == 0xfe00) {
                                        break;
                                    }
                                    
                                    if ((k += (rl >> 10) + 1) > 63) {
                                        break;
                                    }
                                    blk[blkindex + zscan[k]] = (iqtab[k] * q_scale * VALOF(rl)) >> 3;
                                }

                                if ((k + 1) == 0) {
                                    for (let i = 0; i < 64; i++) {
                                        blk[blkindex + i] = blk[blkindex] >> 5;
                                    }
                                    continue;
                                }

                                //console.log(blk[blkindex]);

                                // Macro blocks
                                macroBlock(blk, blkindex, 8, 0);
                                macroBlock(blk, blkindex, 1, 5);
                                
                                blkindex += 64;
                            }

                            //console.log(blk);

                            // YUV24
                            let immmm = im;
                            
                            let indexCb = 0;
                            let indexCr = 64;
                            let indexY  = 64 * 2;
                            
                            for (let h = 0; h < 16; h += 2) {
                                if (h == 8) {
                                    indexY += 64;
                                }
                                
                                for (let w = 0; w < 4; w++) {
                                    //ub *tex = (ub *)&mem.ram.ptr[immmm & (mem.ram.size - 1)];
                                    let data;
                                    
                                    let CB = blk[indexCb];
                                    let CR = blk[indexCr];
                                    
                                    let iB = MULB(CB);
                                    let iG = MULG(CB) + MULF(CR);
                                    let iR = MULR(CR);
                                    
                                    data = blk[indexY + 0]; RGB24CL(0x00 * 3);
                                    data = blk[indexY + 1]; RGB24CL(0x01 * 3);
                                    data = blk[indexY + 8]; RGB24CL(0x10 * 3);
                                    data = blk[indexY + 9]; RGB24CL(0x11 * 3);
                                    
                                    CB = blk[indexCb + 4];
                                    CR = blk[indexCr + 4];
                                    
                                    iB = MULB(CB);
                                    iG = MULG(CB) + MULF(CR);
                                    iR = MULR(CR);
                                    
                                    data = blk[indexY + 64 + 0]; RGB24CL(0x08 * 3);
                                    data = blk[indexY + 64 + 1]; RGB24CL(0x09 * 3);
                                    data = blk[indexY + 64 + 8]; RGB24CL(0x18 * 3);
                                    data = blk[indexY + 64 + 9]; RGB24CL(0x19 * 3);
                                    
                                    indexCb += 1;
                                    indexCr += 1;
                                    indexY  += 2;
                                    immmm   += 2 * 3;
                                }
                                
                                indexCb += 4;
                                indexCr += 4;
                                indexY  += 8;
                                immmm   += 24 * 3;
                            }
                        }
                    }
                    return;

                case 0x1000201:
                    if (cmd === 0x40000001) {
                        tabInit(iq. y, (addr));
                        tabInit(iq.uv, (addr + 64));
                    }

                    if ((cmd & 0xf5ff0000) === 0x30000000) {
                        maddr = madr;
                    }
                    return;

                /* unused */
                case 0x00000000:
                    return;
            }

            psx.error('MDEC DMA: ' + psx.hex(chcr));
        }
    };
})();

#undef ram
