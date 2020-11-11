/* Base structure taken from FPSE open source emulator, and improved upon (Credits: BERO, LDChen) */

#define VALUE_OF(a) \
    (SIGN_EXT_32(((a) << 22) >> 22))

#define BLK_MUL_B(a) \
    ((0x00000716 * (a)) >> 10)

#define BLK_MUL_G(a) \
    ((0xfffffea1 * (a)) >> 10)

#define BLK_MUL_R(a) \
    ((0x0000059b * (a)) >> 10)

#define BLK_MUL_F(a) \
    ((0xfffffd25 * (a)) >> 10)

#define TABLE_NORM(a) \
    tableNormalize[(a) + 128 + 256]

#define MAKE_RGB15(iR, iG, iB) \
    ((((iR) >> 3) << 10) | (((iG) >> 3) << 5) | ((iB) >> 3))

#define RGB15_CL(a) \
    directMemH(mem.ram.uh, (photo + (a + 0))) = MAKE_RGB15(TABLE_NORM(data + iR), TABLE_NORM(data + iG), TABLE_NORM(data + iB))

#define RGB24_CL(a) \
    directMemB(mem.ram.ub, (photo + (a + 0))) = TABLE_NORM(data + iB); \
    directMemB(mem.ram.ub, (photo + (a + 1))) = TABLE_NORM(data + iG); \
    directMemB(mem.ram.ub, (photo + (a + 2))) = TABLE_NORM(data + iR); \

#define MB_INDEX(a) \
    (idx + (kh * a))

pseudo.CstrMdec = function() {
    const MDEC_BLOCK_NUM = 64;

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

    const blk = {
        index: 0, raw: new SintWcap(MDEC_BLOCK_NUM * 6 * 4),
    };

    let tableNormalize = new UintBcap(MDEC_BLOCK_NUM * 6 * 2);
    let iq = new SintWcap(MDEC_BLOCK_NUM * 4);
    let cmd, status, pMadr, rl;

    function processBlock() {
        for (let i = 0; i < 6; i++, blk.index += MDEC_BLOCK_NUM) {
            rl = directMemH(mem.ram.uh, pMadr);
            pMadr += 2;
            blk.raw[blk.index] = iq[0] * VALUE_OF(rl);

            let k = 0;
            const qScale = rl >> 10;

            while(true) {
                rl = directMemH(mem.ram.uh, pMadr);
                pMadr += 2;
                
                if (rl == 0xfe00) {
                    break;
                }
                
                if ((k += (rl >> 10) + 1) > (MDEC_BLOCK_NUM - 1)) {
                    break;
                }
                blk.raw[blk.index + zscan[k]] = (iq[k] * qScale * VALUE_OF(rl)) >> 3;
            }

            if ((k + 1) == 0) {
                for (let i = 0; i < MDEC_BLOCK_NUM; i++) {
                    blk.raw[blk.index + i] = blk.raw[blk.index] >> 5;
                }
                continue;
            }

            macroBlock(8, 0);
            macroBlock(1, 5);
        }
    }

    function macroBlock(kh, sh) {
        let idx = blk.index;
        for (let k = 0; k < 8; k++, idx += sh ? 8 : 1) {
            let z10 = blk.raw[MB_INDEX(0)] + blk.raw[MB_INDEX(4)];
            let z11 = blk.raw[MB_INDEX(0)] - blk.raw[MB_INDEX(4)];
            let z13 = blk.raw[MB_INDEX(2)] + blk.raw[MB_INDEX(6)];
            let z12 = blk.raw[MB_INDEX(2)] - blk.raw[MB_INDEX(6)];
            z12 = ((z12 * 362) >> 8) - z13;
            
            let tmp0 = z10 + z13;
            let tmp3 = z10 - z13;
            let tmp1 = z11 + z12;
            let tmp2 = z11 - z12;
            
            z13 = blk.raw[MB_INDEX(3)] + blk.raw[MB_INDEX(5)];
            z10 = blk.raw[MB_INDEX(3)] - blk.raw[MB_INDEX(5)];
            z11 = blk.raw[MB_INDEX(1)] + blk.raw[MB_INDEX(7)];
            z12 = blk.raw[MB_INDEX(1)] - blk.raw[MB_INDEX(7)];
            let z5 = ((z12 - z10) * 473) >> 8;
            
            let tmp7 = z11 + z13;
            let tmp6 = ((z10 * 669) >> 8) + z5 - tmp7;
            let tmp5 = (((z11 - z13) * 362) >> 8) - tmp6;
            let tmp4 = ((z12 * 277) >> 8) - z5 + tmp5;
            
            blk.raw[MB_INDEX(0)] = (tmp0 + tmp7) >> sh;
            blk.raw[MB_INDEX(7)] = (tmp0 - tmp7) >> sh;
            blk.raw[MB_INDEX(1)] = (tmp1 + tmp6) >> sh;
            blk.raw[MB_INDEX(6)] = (tmp1 - tmp6) >> sh;
            blk.raw[MB_INDEX(2)] = (tmp2 + tmp5) >> sh;
            blk.raw[MB_INDEX(5)] = (tmp2 - tmp5) >> sh;
            blk.raw[MB_INDEX(4)] = (tmp3 + tmp4) >> sh;
            blk.raw[MB_INDEX(3)] = (tmp3 - tmp4) >> sh;
        }
    }

    function uv15(photo) {
        let indexCb = 0;
        let indexCr = MDEC_BLOCK_NUM;
        let indexY  = MDEC_BLOCK_NUM * 2;

        for (let h = 0; h < 16; h += 2, photo += 24, indexY += (h == 8) ? 64 : 0) {
            for (let w = 0; w < 4; w++, photo += 2) {
                for (let i = 0; i <= 4; i += 4) {
                    let cb = blk.raw[indexCb + i];
                    let cr = blk.raw[indexCr + i];
                    
                    let iB = BLK_MUL_B(cb);
                    let iG = BLK_MUL_G(cb) + BLK_MUL_F(cr);
                    let iR = BLK_MUL_R(cr);
                    
                    const idxY = indexY + (i * 16); let data;
                    data = blk.raw[idxY + 0]; RGB15_CL((0x00 + (i * 2)));
                    data = blk.raw[idxY + 1]; RGB15_CL((0x01 + (i * 2)));
                    data = blk.raw[idxY + 8]; RGB15_CL((0x10 + (i * 2)));
                    data = blk.raw[idxY + 9]; RGB15_CL((0x11 + (i * 2)));
                }

                indexCb += 1;
                indexCr += 1;
                indexY  += 2;
            }

            indexCb += 4;
            indexCr += 4;
            indexY  += 8;
        }
    }

    function uv24(photo) {
        let indexCb = 0;
        let indexCr = MDEC_BLOCK_NUM;
        let indexY  = MDEC_BLOCK_NUM * 2;
        
        for (let h = 0; h < 16; h += 2, photo += 24 * 3, indexY += (h == 8) ? 64 : 0) {
            for (let w = 0; w < 4; w++, photo += 2 * 3) {
                for (let i = 0; i <= 4; i += 4) {
                    let cb = blk.raw[indexCb + i];
                    let cr = blk.raw[indexCr + i];
                    
                    let iB = BLK_MUL_B(cb);
                    let iG = BLK_MUL_G(cb) + BLK_MUL_F(cr);
                    let iR = BLK_MUL_R(cr);
                    
                    const idxY = indexY + (i * 16); let data;
                    data = blk.raw[idxY + 0]; RGB24_CL((0x00 + (i * 2)) * 3);
                    data = blk.raw[idxY + 1]; RGB24_CL((0x01 + (i * 2)) * 3);
                    data = blk.raw[idxY + 8]; RGB24_CL((0x10 + (i * 2)) * 3);
                    data = blk.raw[idxY + 9]; RGB24_CL((0x11 + (i * 2)) * 3);
                }
                
                indexCb += 1;
                indexCr += 1;
                indexY  += 2;
            }
            
            indexCb += 4;
            indexCr += 4;
            indexY  += 8;
        }
    }

    // Exposed class functions/variables
    return {
        reset() {
            // Round Table
            for (let i = 0; i < 256; i++) {
                tableNormalize[i + 0x000] = 0;
                tableNormalize[i + 0x100] = i;
                tableNormalize[i + 0x200] = 255;
            }

            iq.fill(0);
            cmd    = 0;
            status = 0;
            pMadr  = 0;
        },

        scopeW(addr, data) {
            switch(addr & 0xf) {
                case 0: // Data
                    cmd = data;
                    return;

                case 4: // Status
                    if (data & 0x80000000) { // Reset
                        mdec.reset();
                    }
                    return;
            }

            psx.error('MDEC Write: ' + (addr & 0xf) + ' <- ' + psx.hex(data));
        },

        scopeR(addr) {
            switch(addr & 0xf) {
                case 0: // Data
                    return cmd;

                case 4: // Status
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
                        let photo = madr;
        
                        for (; size > 0; size -= (MDEC_BLOCK_NUM * 4) / 2, photo += (MDEC_BLOCK_NUM * 4) * 2) {
                            // Reset Block
                            blk.raw.fill(0);
                            blk.index = 0;

                            // Generate
                            processBlock();
                            uv15(photo);
                        }
                    }
                    else { // YUV24
                        let photo = madr;
        
                        for (; size > 0; size -= (MDEC_BLOCK_NUM * 6) / 2, photo += (MDEC_BLOCK_NUM * 6) * 2) {
                            // Reset Block
                            blk.raw.fill(0);
                            blk.index = 0;

                            // Generate
                            processBlock();
                            uv24(photo);
                        }
                    }
                    return;

                case 0x1000201:
                    if (cmd === 0x40000001) {
                        for (let i = 0; i < MDEC_BLOCK_NUM; i++) {
                            iq[i] = (directMemB(mem.ram.ub, madr + i) * aanscales[zscan[i]]) >> 12;
                        }
                    }

                    if ((cmd & 0xf5ff0000) === 0x30000000) { // Pointer
                        pMadr = madr;
                    }
                    return;

                /* unused */
                case 0x00000000:
                    return;
            }

            psx.error('MDEC DMA: ' + psx.hex(chcr));
        }
    };
};

const mdec = new pseudo.CstrMdec();
