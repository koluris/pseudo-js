/* Base structure taken from PCSX open source emulator, and improved upon (Credits: linuzappz, Shadow) */

// 32-bit accessor
#define oooo(base, index) \
    base[(index)]

// 16-bit accessor
#define __oo(base, index, offset) \
    base[(index << 1) + offset]

// 08-bit accessor
#define ___o(base, index, offset) \
    base[(index << 2) + offset]

// Cop2c
#define R11R12 oooo(cop2c.sw,  0)    /* Rotation matrix */
#define R11    __oo(cop2c.sh,  0, 0) /* Rotation matrix */
#define R12    __oo(cop2c.sh,  0, 1) /* Rotation matrix */
#define R13    __oo(cop2c.sh,  1, 0) /* Rotation matrix */
#define R21    __oo(cop2c.sh,  1, 1) /* Rotation matrix */
#define R22R23 oooo(cop2c.sw,  2)    /* Rotation matrix */
#define R22    __oo(cop2c.sh,  2, 0) /* Rotation matrix */
#define R23    __oo(cop2c.sh,  2, 1) /* Rotation matrix */
#define R31    __oo(cop2c.sh,  3, 0) /* Rotation matrix */
#define R32    __oo(cop2c.sh,  3, 1) /* Rotation matrix */
#define R33    __oo(cop2c.sh,  4, 0) /* Rotation matrix */
#define TRX    oooo(cop2c.sw,  5)    /* Translation vector (X) */
#define TRY    oooo(cop2c.sw,  6)    /* Translation vector (Y) */
#define TRZ    oooo(cop2c.sw,  7)    /* Translation vector (Z) */
#define L11    __oo(cop2c.sh,  8, 0) /* Lite source direction vector X 3 */
#define L12    __oo(cop2c.sh,  8, 1) /* Lite source direction vector X 3 */
#define L13    __oo(cop2c.sh,  9, 0) /* Lite source direction vector X 3 */
#define L21    __oo(cop2c.sh,  9, 1) /* Lite source direction vector X 3 */
#define L22    __oo(cop2c.sh, 10, 0) /* Lite source direction vector X 3 */
#define L23    __oo(cop2c.sh, 10, 1) /* Lite source direction vector X 3 */
#define L31    __oo(cop2c.sh, 11, 0) /* Lite source direction vector X 3 */
#define L32    __oo(cop2c.sh, 11, 1) /* Lite source direction vector X 3 */
#define L33    __oo(cop2c.sh, 12, 0) /* Lite source direction vector X 3 */
#define RBK    oooo(cop2c.sw, 13)    /* Peripheral color (R) */
#define GBK    oooo(cop2c.sw, 14)    /* Peripheral color (G) */
#define BBK    oooo(cop2c.sw, 15)    /* Peripheral color (B) */
#define LR1    __oo(cop2c.sh, 16, 0) /* Lite source color X 3 */
#define LR2    __oo(cop2c.sh, 16, 1) /* Lite source color X 3 */
#define LR3    __oo(cop2c.sh, 17, 0) /* Lite source color X 3 */
#define LG1    __oo(cop2c.sh, 17, 1) /* Lite source color X 3 */
#define LG2    __oo(cop2c.sh, 18, 0) /* Lite source color X 3 */
#define LG3    __oo(cop2c.sh, 18, 1) /* Lite source color X 3 */
#define LB1    __oo(cop2c.sh, 19, 0) /* Lite source color X 3 */
#define LB2    __oo(cop2c.sh, 19, 1) /* Lite source color X 3 */
#define LB3    __oo(cop2c.sh, 20, 0) /* Lite source color X 3 */
#define RFC    oooo(cop2c.sw, 21)    /* Far color (R) */
#define GFC    oooo(cop2c.sw, 22)    /* Far color (G) */
#define BFC    oooo(cop2c.sw, 23)    /* Far color (B) */
#define OFX    oooo(cop2c.sw, 24)    /* Screen offset (X) */
#define OFY    oooo(cop2c.sw, 25)    /* Screen offset (Y) */
#define H      __oo(cop2c.sh, 26, 0) /* Screen position */
#define DQA    __oo(cop2c.sh, 27, 0) /* Depth parameter A (coefficient) */
#define DQB    oooo(cop2c.sw, 28)    /* Depth parameter B (offset) */
#define ZSF3   __oo(cop2c.sh, 29, 0) /* Z scale factor */
#define ZSF4   __oo(cop2c.sh, 30, 0) /* Z scale factor */
#define FLAG   oooo(cop2c.uw, 31)    /* ! */

// Cop2d
#define VXY0   oooo(cop2d.uw,  0)    /* Vector #0 (X/Y) */
#define VX0    __oo(cop2d.sh,  0, 0) /* Vector #0 (X) */
#define VY0    __oo(cop2d.sh,  0, 1) /* Vector #0 (Y) */
#define VZ0    __oo(cop2d.sh,  1, 0) /* Vector #0 (Z) */
#define VXY1   oooo(cop2d.uw,  2)    /* Vector #1 (X/Y) */
#define VX1    __oo(cop2d.sh,  2, 0) /* Vector #1 (X) */
#define VY1    __oo(cop2d.sh,  2, 1) /* Vector #1 (Y) */
#define VZ1    __oo(cop2d.sh,  3, 0) /* Vector #1 (Z) */
#define VXY2   oooo(cop2d.uw,  4)    /* Vector #2 (X/Y) */
#define VX2    __oo(cop2d.sh,  4, 0) /* Vector #2 (X) */
#define VY2    __oo(cop2d.sh,  4, 1) /* Vector #2 (Y) */
#define VZ2    __oo(cop2d.sh,  5, 0) /* Vector #2 (Z) */
#define RGB    oooo(cop2d.uw,  6)    /* Color data + GTE instruction */
#define R      ___o(cop2d.ub,  6, 0) /* Color (R) */
#define G      ___o(cop2d.ub,  6, 1) /* Color (G) */
#define B      ___o(cop2d.ub,  6, 2) /* Color (B) */
#define CODE   ___o(cop2d.ub,  6, 3) /* GTE instruction */
#define OTZ    __oo(cop2d.uh,  7, 0) /* Z-component value */
#define IR0    __oo(cop2d.sh,  8, 0) /* Intermediate value #0 */
#define IR1    __oo(cop2d.sh,  9, 0) /* Intermediate value #1 */
#define IR2    __oo(cop2d.sh, 10, 0) /* Intermediate value #2 */
#define IR3    __oo(cop2d.sh, 11, 0) /* Intermediate value #3 */
#define SXY0   oooo(cop2d.uw, 12)    /* Calc. result record #0 (X/Y) */
#define SX0    __oo(cop2d.sh, 12, 0) /* Calc. result record #0 (X) */
#define SY0    __oo(cop2d.sh, 12, 1) /* Calc. result record #0 (Y) */
#define SXY1   oooo(cop2d.uw, 13)    /* Calc. result record #1 (X/Y) */
#define SX1    __oo(cop2d.sh, 13, 0) /* Calc. result record #1 (X) */
#define SY1    __oo(cop2d.sh, 13, 1) /* Calc. result record #1 (Y) */
#define SXY2   oooo(cop2d.uw, 14)    /* Calc. result record #2 (X/Y) */
#define SX2    __oo(cop2d.sh, 14, 0) /* Calc. result record #2 (X) */
#define SY2    __oo(cop2d.sh, 14, 1) /* Calc. result record #2 (Y) */
#define SXYP   oooo(cop2d.uw, 15)    /* Calc. result set (X/Y) */
#define SXP    __oo(cop2d.sh, 15, 0) /* Calc. result set (X) */
#define SYP    __oo(cop2d.sh, 15, 1) /* Calc. result set (Y) */
#define SZ0    __oo(cop2d.uh, 16, 0) /* Calc. result record #0 (Z) */
#define SZ1    __oo(cop2d.uh, 17, 0) /* Calc. result record #1 (Z) */
#define SZ2    __oo(cop2d.uh, 18, 0) /* Calc. result record #2 (Z) */
#define SZ3    __oo(cop2d.uh, 19, 0) /* Calc. result record #3 (Z) */
#define RGB0   oooo(cop2d.uw, 20)    /* Calc. result record #0 (R/G/B) */
#define R0     ___o(cop2d.ub, 20, 0) /* Calc. result record #0 (R) */
#define G0     ___o(cop2d.ub, 20, 1) /* Calc. result record #0 (G) */
#define B0     ___o(cop2d.ub, 20, 2) /* Calc. result record #0 (B) */
#define CODE0  ___o(cop2d.ub, 20, 3) /* Calc. result record #0 (?) */
#define RGB1   oooo(cop2d.uw, 21)    /* Calc. result record #1 (R/G/B) */
#define R1     ___o(cop2d.ub, 21, 0) /* Calc. result record #1 (R) */
#define G1     ___o(cop2d.ub, 21, 1) /* Calc. result record #1 (G) */
#define B1     ___o(cop2d.ub, 21, 2) /* Calc. result record #1 (B) */
#define CODE1  ___o(cop2d.ub, 21, 3) /* Calc. result record #1 (?) */
#define RGB2   oooo(cop2d.uw, 22)    /* Calc. result record #2 (R/G/B) */
#define R2     ___o(cop2d.ub, 22, 0) /* Calc. result record #2 (R) */
#define G2     ___o(cop2d.ub, 22, 1) /* Calc. result record #2 (G) */
#define B2     ___o(cop2d.ub, 22, 2) /* Calc. result record #2 (B) */
#define CODE2  ___o(cop2d.ub, 22, 3) /* Calc. result record #2 (?) */
#define RES1   oooo(cop2d.uw, 23)    /* Reserved (access prohibited) */
#define MAC0   oooo(cop2d.sw, 24)    /* Sum of products #0 */
#define MAC1   oooo(cop2d.sw, 25)    /* Sum of products #1 */
#define MAC2   oooo(cop2d.sw, 26)    /* Sum of products #2 */
#define MAC3   oooo(cop2d.sw, 27)    /* Sum of products #3 */
#define IRGB   oooo(cop2d.uw, 28)    /* Color data input */
#define ORGB   oooo(cop2d.uw, 29)    /* Color data output */
#define LZCS   oooo(cop2d.uw, 30)    /* Lead zero/one count source data */
#define LZCR   oooo(cop2d.uw, 31)    /* Lead zero/one count process result */

#define MX11(n) (n < 3 ? __oo(cop2c.sh, ((n << 3) + 0), 0) : 0)
#define MX12(n) (n < 3 ? __oo(cop2c.sh, ((n << 3) + 0), 1) : 0)
#define MX13(n) (n < 3 ? __oo(cop2c.sh, ((n << 3) + 1), 0) : 0)
#define MX21(n) (n < 3 ? __oo(cop2c.sh, ((n << 3) + 1), 1) : 0)
#define MX22(n) (n < 3 ? __oo(cop2c.sh, ((n << 3) + 2), 0) : 0)
#define MX23(n) (n < 3 ? __oo(cop2c.sh, ((n << 3) + 2), 1) : 0)
#define MX31(n) (n < 3 ? __oo(cop2c.sh, ((n << 3) + 3), 0) : 0)
#define MX32(n) (n < 3 ? __oo(cop2c.sh, ((n << 3) + 3), 1) : 0)
#define MX33(n) (n < 3 ? __oo(cop2c.sh, ((n << 3) + 4), 0) : 0)

#define CV1( n) (n < 3 ? oooo(cop2c.sw, ((n << 3) + 5)) : 0)
#define CV2( n) (n < 3 ? oooo(cop2c.sw, ((n << 3) + 6)) : 0)
#define CV3( n) (n < 3 ? oooo(cop2c.sw, ((n << 3) + 7)) : 0)

#define VX(  n) (n < 3 ? __oo(cop2d.sh, ((n << 1) + 0), 0) : __oo(cop2d.sh,  9, 0))
#define VY(  n) (n < 3 ? __oo(cop2d.sh, ((n << 1) + 0), 1) : __oo(cop2d.sh, 10, 0))
#define VZ(  n) (n < 3 ? __oo(cop2d.sh, ((n << 1) + 1), 0) : __oo(cop2d.sh, 11, 0))

#define SX(n) __oo(cop2d.sh, (n + 12), 0)
#define SY(n) __oo(cop2d.sh, (n + 12), 1)
#define SZ(n) __oo(cop2d.uh, (n + 17), 0)

#define LIM(a, min, max, bit) \
    (((a) < min) ? (FLAG |= (bit), min) : \
    (((a) > max) ? (FLAG |= (bit), max) : ((a))))

#define SETF(n) \
    (1 << n)

#define limB1(a, l) LIM((a), !l * -32768, 32767, SETF(24) | SETF(31))
#define limB2(a, l) LIM((a), !l * -32768, 32767, SETF(23) | SETF(31))
#define limB3(a, l) LIM((a), !l * -32768, 32767, SETF(22))
#define limC1(a) LIM((a),       0,    255, SETF(21))
#define limC2(a) LIM((a),       0,    255, SETF(20))
#define limC3(a) LIM((a),       0,    255, SETF(19))
#define limD( a) LIM((a),       0,  65535, SETF(18) | SETF(31))
#define limE( a) LIM((a), -131072, 131071, SETF(17) | SETF(31))
#define limG1(a) LIM((a),   -1024,   1023, SETF(14) | SETF(31))
#define limG2(a) LIM((a),   -1024,   1023, SETF(13) | SETF(31))
#define limH( a) LIM((a),       0,   4096, SETF(12))

#define GTE_SF(op) ((op >> 19) & 1)
#define GTE_MX(op) ((op >> 17) & 3)
#define GTE_V( op) ((op >> 15) & 3)
#define GTE_CV(op) ((op >> 13) & 3)
#define GTE_LM(op) ((op >> 10) & 1)

#define MAC2IR(n) \
    IR1 = limB1(MAC1, n); \
    IR2 = limB2(MAC2, n); \
    IR3 = limB3(MAC3, n)

#define MAC2RGB4() \
    RGB0  = RGB1; \
    RGB1  = RGB2; \
    CODE2 = CODE; \
    \
    R2 = limC1(MAC1 >> 4); \
    G2 = limC2(MAC2 >> 4); \
    B2 = limC3(MAC3 >> 4)

pseudo.CstrCop2 = function() {
    const cop2c = union(32 * 4);
    const cop2d = union(32 * 4);

    function divide(n, d) {
        if (n >= 0 && n < d * 2) {
            return Math.floor(((SIGN_EXT_32(n) << 16) + d / 2) / d);
        }
        return 0xffffffff;
    }

    // Exposed class functions/variables
    return {
        reset() {
            cop2c.ub.fill(0);
            cop2d.ub.fill(0);
        },

        execute(code) {
            switch(code & 0x3f) {
                case 0: // BASIC
                    switch(rs & 7) {
                        case 0: // MFC2
                            cpu.base[rt] = cop2.opcodeMFC2(rd);
                            return;

                        case 2: // CFC2
                            cpu.base[rt] = oooo(cop2c.uw, rd)
                            return;

                        case 4: // MTC2
                            cop2.opcodeMTC2(rd, cpu.base[rt]);
                            return;

                        case 6: // CTC2
                            cop2.opcodeCTC2(rd, cpu.base[rt]);
                            return;
                    }

                    psx.error('COP2 Basic ' + (rs & 7));
                    return;

                /* pdx-068, ff9, va */
                case 1: // RTPS
                    {
                        FLAG = 0;

                        MAC1 = ((TRX << 12) + (R11 * VX0) + (R12 * VY0) + (R13 * VZ0)) >> 12;
                        MAC2 = ((TRY << 12) + (R21 * VX0) + (R22 * VY0) + (R23 * VZ0)) >> 12;
                        MAC3 = ((TRZ << 12) + (R31 * VX0) + (R32 * VY0) + (R33 * VZ0)) >> 12;

                        MAC2IR(0);

                        SZ0 = SZ1;
                        SZ1 = SZ2;
                        SZ2 = SZ3;
                        SZ3 = limD(MAC3);

                        const quotient = limE(divide(H, SZ3));

                        SXY0 = SXY1;
                        SXY1 = SXY2;
                        SX2  = limG1((OFX + (IR1 * quotient)) >> 16);
                        SY2  = limG2((OFY + (IR2 * quotient)) >> 16);

                        MAC0 = DQB + (DQA * quotient);
                        IR0  = limH(MAC0 >> 12);
                    }
                    return;

                /* pdx-068, ff9, va */
                case 48: // RTPT
                    {
                        let quotient;

                        FLAG = 0;
                        SZ0  = SZ3;

                        for (let v = 0; v < 3; v++) {
                            const v1 = VX(v);
                            const v2 = VY(v);
                            const v3 = VZ(v);

                            MAC1 = ((TRX << 12) + (R11 * v1) + (R12 * v2) + (R13 * v3)) >> 12;
                            MAC2 = ((TRY << 12) + (R21 * v1) + (R22 * v2) + (R23 * v3)) >> 12;
                            MAC3 = ((TRZ << 12) + (R31 * v1) + (R32 * v2) + (R33 * v3)) >> 12;

                            MAC2IR(0);

                            SZ(v) = limD(MAC3);
                            quotient = limE(divide(H, SZ(v)));

                            SX(v) = limG1((OFX + (IR1 * quotient)) >> 16);
                            SY(v) = limG2((OFY + (IR2 * quotient)) >> 16);
                        }

                        MAC0 = DQB + (DQA * quotient);
                        IR0 = limH(MAC0 >> 12);
                    }
                    return;

                /* pdx-068, anelic */
                case 6: // NCLIP
                    {
                        FLAG = 0;

                        MAC0 = SX0 * (SY1 - SY2) + SX1 * (SY2 - SY0) + SX2 * (SY0 - SY1);
                    }
                    return;

                case 12: // OP
                    {
                        const op = code & 0x1ffffff;
                        const sh = GTE_SF(op) * 12;
                        const lm = GTE_LM(op);

                        FLAG = 0;

                        MAC1 = ((R22 * IR3) - (R33 * IR2)) >> sh;
                        MAC2 = ((R33 * IR1) - (R11 * IR3)) >> sh;
                        MAC3 = ((R11 * IR2) - (R22 * IR1)) >> sh;

                        MAC2IR(lm);
                    }
                    return;

                case 16: // DPCS
                    {
                        const op = code & 0x1ffffff;
                        const sh = GTE_SF(op) * 12;

                        FLAG = 0;

                        MAC1 = ((R << 16) + (IR0 * limB1((RFC - (R << 4)) << (12 - sh), 0))) >> 12;
                        MAC2 = ((G << 16) + (IR0 * limB2((GFC - (G << 4)) << (12 - sh), 0))) >> 12;
                        MAC3 = ((B << 16) + (IR0 * limB3((BFC - (B << 4)) << (12 - sh), 0))) >> 12;

                        MAC2IR(0);

                        MAC2RGB4();
                    }
                    return;

                case 42: // DPCT
                    {
                        FLAG = 0;

                        for (let v = 0; v < 3; v++) {
                            MAC1 = ((R0 << 16) + (IR0 * (limB1(RFC - (R0 << 4), 0)))) >> 12;
                            MAC2 = ((G0 << 16) + (IR0 * (limB1(GFC - (G0 << 4), 0)))) >> 12;
                            MAC3 = ((B0 << 16) + (IR0 * (limB1(BFC - (B0 << 4), 0)))) >> 12;

                            MAC2RGB4();
                        }

                        MAC2IR(0);
                    }
                    return;

                case 17: // INTPL
                    {
                        const op = code & 0x1ffffff;
                        const sh = GTE_SF(op) * 12;
                        const lm = GTE_LM(op);

                        FLAG = 0;

                        MAC1 = ((IR1 << 12) + (IR0 * limB1((RFC - IR1), 0))) >> sh;
                        MAC2 = ((IR2 << 12) + (IR0 * limB2((GFC - IR2), 0))) >> sh;
                        MAC3 = ((IR3 << 12) + (IR0 * limB3((BFC - IR3), 0))) >> sh;

                        MAC2IR(lm);

                        MAC2RGB4();
                    }
                    return;

                /* anelic */
                case 18: // MVMVA
                    {
                        const op = code & 0x1ffffff;
                        const sh = GTE_SF(op) * 12;
                        const cv = GTE_CV(op);
                        const mx = GTE_MX(op);
                        const lm = GTE_LM(op);
                        const v  = GTE_V(op);
                        const v1 = VX(v);
                        const v2 = VY(v);
                        const v3 = VZ(v);

                        FLAG = 0;

                        MAC1 = ((CV1(cv) << 12) + (MX11(mx) * v1) + (MX12(mx) * v2) + (MX13(mx) * v3)) >> sh;
                        MAC2 = ((CV2(cv) << 12) + (MX21(mx) * v1) + (MX22(mx) * v2) + (MX23(mx) * v3)) >> sh;
                        MAC3 = ((CV3(cv) << 12) + (MX31(mx) * v1) + (MX32(mx) * v2) + (MX33(mx) * v3)) >> sh;

                        MAC2IR(lm);
                    }
                    return;

                case 19: // NCDS
                    {
                        FLAG = 0;

                        MAC1 = ((L11 * VX0) + (L12 * VY0) + (L13 * VZ0)) >> 12;
                        MAC2 = ((L21 * VX0) + (L22 * VY0) + (L23 * VZ0)) >> 12;
                        MAC3 = ((L31 * VX0) + (L32 * VY0) + (L33 * VZ0)) >> 12;

                        MAC2IR(1);

                        MAC1 = ((RBK << 12) + (LR1 * IR1) + (LR2 * IR2) + (LR3 * IR3)) >> 12;
                        MAC2 = ((GBK << 12) + (LG1 * IR1) + (LG2 * IR2) + (LG3 * IR3)) >> 12;
                        MAC3 = ((BBK << 12) + (LB1 * IR1) + (LB2 * IR2) + (LB3 * IR3)) >> 12;

                        MAC2IR(1);

                        MAC1 = (((R << 4) * IR1) + (IR0 * limB1(RFC - ((R * IR1) >> 8), 0))) >> 12;
                        MAC2 = (((G << 4) * IR2) + (IR0 * limB2(GFC - ((G * IR2) >> 8), 0))) >> 12;
                        MAC3 = (((B << 4) * IR3) + (IR0 * limB3(BFC - ((B * IR3) >> 8), 0))) >> 12;

                        MAC2IR(1);

                        MAC2RGB4();
                    }
                    return;

                /* t-rex */
                case 22: // NCDT
                    {
                        FLAG = 0;

                        for (let v = 0; v < 3; v++) {
                            const v1 = VX(v);
                            const v2 = VY(v);
                            const v3 = VZ(v);

                            MAC1 = ((L11 * v1) + (L12 * v2) + (L13 * v3)) >> 12;
                            MAC2 = ((L21 * v1) + (L22 * v2) + (L23 * v3)) >> 12;
                            MAC3 = ((L31 * v1) + (L32 * v2) + (L33 * v3)) >> 12;

                            MAC2IR(1);

                            MAC1 = ((RBK << 12) + (LR1 * IR1) + (LR2 * IR2) + (LR3 * IR3)) >> 12;
                            MAC2 = ((GBK << 12) + (LG1 * IR1) + (LG2 * IR2) + (LG3 * IR3)) >> 12;
                            MAC3 = ((BBK << 12) + (LB1 * IR1) + (LB2 * IR2) + (LB3 * IR3)) >> 12;

                            MAC2IR(1);

                            MAC1 = (((R << 4) * IR1) + (IR0 * limB1(RFC - ((R * IR1) >> 8), 0))) >> 12;
                            MAC2 = (((G << 4) * IR2) + (IR0 * limB2(GFC - ((G * IR2) >> 8), 0))) >> 12;
                            MAC3 = (((B << 4) * IR3) + (IR0 * limB3(BFC - ((B * IR3) >> 8), 0))) >> 12;

                            MAC2RGB4();
                        }

                        MAC2IR(1);
                    }
                    return;

                case 20: // CDP
                    {
                        FLAG = 0;
                        
                        MAC1 = ((RBK << 12) + (LR1 * IR1) + (LR2 * IR2) + (LR3 * IR3)) >> 12;
                        MAC2 = ((GBK << 12) + (LG1 * IR1) + (LG2 * IR2) + (LG3 * IR3)) >> 12;
                        MAC3 = ((BBK << 12) + (LB1 * IR1) + (LB2 * IR2) + (LB3 * IR3)) >> 12;
                        
                        MAC2IR(1);
                        
                        MAC1 = (((R << 4) * IR1) + (IR0 * limB1(RFC - ((R * IR1) >> 8), 0))) >> 12;
                        MAC2 = (((G << 4) * IR2) + (IR0 * limB2(GFC - ((G * IR2) >> 8), 0))) >> 12;
                        MAC3 = (((B << 4) * IR3) + (IR0 * limB3(BFC - ((B * IR3) >> 8), 0))) >> 12;
                        
                        MAC2IR(1);
                        
                        MAC2RGB4();
                    }
                    return;

                /* mario-3d */
                case 27: // NCCS
                    {
                        FLAG = 0;

                        MAC1 = ((L11 * VX0) + (L12 * VY0) + (L13 * VZ0)) >> 12;
                        MAC2 = ((L21 * VX0) + (L22 * VY0) + (L23 * VZ0)) >> 12;
                        MAC3 = ((L31 * VX0) + (L32 * VY0) + (L33 * VZ0)) >> 12;

                        MAC2IR(1);

                        MAC1 = ((RBK << 12) + (LR1 * IR1) + (LR2 * IR2) + (LR3 * IR3)) >> 12;
                        MAC2 = ((GBK << 12) + (LG1 * IR1) + (LG2 * IR2) + (LG3 * IR3)) >> 12;
                        MAC3 = ((BBK << 12) + (LB1 * IR1) + (LB2 * IR2) + (LB3 * IR3)) >> 12;

                        MAC2IR(1);

                        MAC1 = (R * IR1) >> 8;
                        MAC2 = (G * IR2) >> 8;
                        MAC3 = (B * IR3) >> 8;

                        MAC2IR(1);

                        MAC2RGB4();
                    }
                    return;

                /* deadline */
                case 63: // NCCT
                    {
                        FLAG = 0;

                        for (let v = 0; v < 3; v++) {
                            const v1 = VX(v);
                            const v2 = VY(v);
                            const v3 = VZ(v);

                            MAC1 = ((L11 * v1) + (L12 * v2) + (L13 * v3)) >> 12;
                            MAC2 = ((L21 * v1) + (L22 * v2) + (L23 * v3)) >> 12;
                            MAC3 = ((L31 * v1) + (L32 * v2) + (L33 * v3)) >> 12;

                            MAC2IR(1);

                            MAC1 = ((RBK << 12) + (LR1 * IR1) + (LR2 * IR2) + (LR3 * IR3)) >> 12;
                            MAC2 = ((GBK << 12) + (LG1 * IR1) + (LG2 * IR2) + (LG3 * IR3)) >> 12;
                            MAC3 = ((BBK << 12) + (LB1 * IR1) + (LB2 * IR2) + (LB3 * IR3)) >> 12;

                            MAC2IR(1);

                            MAC1 = (R * IR1) >> 8;
                            MAC2 = (G * IR2) >> 8;
                            MAC3 = (B * IR3) >> 8;

                            MAC2RGB4();
                        }

                        MAC2IR(1);
                    }
                    return;

                case 28: // CC
                    {
                        FLAG = 0;
                        
                        MAC1 = ((RBK << 12) + (LR1 * IR1) + (LR2 * IR2) + (LR3 * IR3)) >> 12;
                        MAC2 = ((GBK << 12) + (LG1 * IR1) + (LG2 * IR2) + (LG3 * IR3)) >> 12;
                        MAC3 = ((BBK << 12) + (LB1 * IR1) + (LB2 * IR2) + (LB3 * IR3)) >> 12;
                        
                        MAC2IR(1);
                        
                        MAC1 = (R * IR1) >> 8;
                        MAC2 = (G * IR2) >> 8;
                        MAC3 = (B * IR3) >> 8;
                        
                        MAC2IR(1);
                        
                        MAC2RGB4();
                    }
                    return;

                case 30: // NCS
                    {
                        FLAG = 0;

                        MAC1 = ((L11 * VX0) + (L12 * VY0) + (L13 * VZ0)) >> 12;
                        MAC2 = ((L21 * VX0) + (L22 * VY0) + (L23 * VZ0)) >> 12;
                        MAC3 = ((L31 * VX0) + (L32 * VY0) + (L33 * VZ0)) >> 12;

                        MAC2IR(1);

                        MAC1 = ((RBK << 12) + (LR1 * IR1) + (LR2 * IR2) + (LR3 * IR3)) >> 12;
                        MAC2 = ((GBK << 12) + (LG1 * IR1) + (LG2 * IR2) + (LG3 * IR3)) >> 12;
                        MAC3 = ((BBK << 12) + (LB1 * IR1) + (LB2 * IR2) + (LB3 * IR3)) >> 12;

                        MAC2IR(1);

                        MAC2RGB4();
                    }
                    return;

                case 32: // NCT
                    {
                        FLAG = 0;

                        for (let v = 0; v < 3; v++) {
                            const v1 = VX(v);
                            const v2 = VY(v);
                            const v3 = VZ(v);

                            MAC1 = ((L11 * v1) + (L12 * v2) + (L13 * v3)) >> 12;
                            MAC2 = ((L21 * v1) + (L22 * v2) + (L23 * v3)) >> 12;
                            MAC3 = ((L31 * v1) + (L32 * v2) + (L33 * v3)) >> 12;

                            MAC2IR(1);

                            MAC1 = ((RBK << 12) + (LR1 * IR1) + (LR2 * IR2) + (LR3 * IR3)) >> 12;
                            MAC2 = ((GBK << 12) + (LG1 * IR1) + (LG2 * IR2) + (LG3 * IR3)) >> 12;
                            MAC3 = ((BBK << 12) + (LB1 * IR1) + (LB2 * IR2) + (LB3 * IR3)) >> 12;

                            MAC2RGB4();
                        }

                        MAC2IR(1);
                    }
                    return;

                case 40: // SQR
                    {
                        const op = code & 0x1ffffff;
                        const sh = GTE_SF(op) * 12;
                        const lm = GTE_LM(op);

                        FLAG = 0;

                        MAC1 = (IR1 * IR1) >> sh;
                        MAC2 = (IR2 * IR2) >> sh;
                        MAC3 = (IR3 * IR3) >> sh;

                        MAC2IR(lm);
                    }
                    return;

                case 41: // DCPL
                    {
                        const op = code & 0x1ffffff;
                        const lm = GTE_LM(op);

                        const RIR1 = (R * IR1) >> 8;
                        const GIR2 = (G * IR2) >> 8;
                        const BIR3 = (B * IR3) >> 8;

                        FLAG = 0;

                        MAC1 = RIR1 + ((IR0 * limB1(RFC - RIR1, 0)) >> 12);
                        MAC2 = GIR2 + ((IR0 * limB1(GFC - GIR2, 0)) >> 12);
                        MAC3 = BIR3 + ((IR0 * limB1(BFC - BIR3, 0)) >> 12);

                        MAC2IR(lm);

                        MAC2RGB4();
                    }
                    return;

                /* pdx-068, trancetro */
                case 45: // AVSZ3
                    {
                        FLAG = 0;
                        
                        MAC0 = (ZSF3 * SZ1) + (ZSF3 * SZ2) + (ZSF3 * SZ3);
                        OTZ  = limD(MAC0 >> 12);
                    }
                    return;

                case 46: // AVSZ4
                    {
                        FLAG = 0;
                        
                        MAC0 = ZSF4 * (SZ0 + SZ1 + SZ2 + SZ3);
                        OTZ = limD(MAC0 >> 12);
                    }
                    return;

                /* t-rex */
                case 61: // GPF
                    {
                        const op = code & 0x1ffffff;
                        const sh = GTE_SF(op) * 12;

                        FLAG = 0;

                        MAC1 = (IR0 * IR1) >> sh;
                        MAC2 = (IR0 * IR2) >> sh;
                        MAC3 = (IR0 * IR3) >> sh;

                        MAC2IR(0);

                        MAC2RGB4();
                    }
                    return;

                case 62: // GPL
                    {
                        const op = code & 0x1ffffff;
                        const sh = GTE_SF(op) * 12;

                        FLAG = 0;

                        MAC1 = ((MAC1 << sh) + (IR0 * IR1)) >> sh;
                        MAC2 = ((MAC2 << sh) + (IR0 * IR2)) >> sh;
                        MAC3 = ((MAC3 << sh) + (IR0 * IR3)) >> sh;

                        MAC2IR(0);

                        MAC2RGB4();
                    }
                    return;
            }

            console.info('COP2 Execute ' + (code & 0x3f));
        },

        opcodeMFC2(addr) { // Cop2d read
            switch(addr) {
                case  1: // V0(z)
                case  3: // V1(z)
                case  5: // V2(z)
                case  8: // IR0
                case  9: // IR1
                case 10: // IR2
                case 11: // IR3
                    oooo(cop2d.sw, addr) = __oo(cop2d.sh, addr, 0);
                    break;

                case  7: // OTZ
                case 16: // SZ0
                case 17: // SZ1
                case 18: // SZ2
                case 19: // SZ3
                    oooo(cop2d.uw, addr) = __oo(cop2d.uh, addr, 0);
                    break;

                case 15: // SXY3
                    psx.error('opcodeMFC2 -> ' + addr);
                    break;

                case 28: // IRGB
                case 29: // ORGB
                    oooo(cop2d.uw, addr) = LIM(IR1 >> 7, 0, 0x1f, 0) | (LIM(IR2 >> 7, 0, 0x1f, 0) << 5) | (LIM(IR3 >> 7, 0, 0x1f, 0) << 10);
                    break;
            }

            return oooo(cop2d.uw, addr);
        },

        opcodeMTC2(addr, data) { // Cop2d write
            switch(addr) {
                case 15: // SXY3
                    SXY0 = SXY1;
                    SXY1 = SXY2;
                    SXY2 = data;
                    SXYP = data;
                    return;

                case 28: // IRGB
                    IRGB = (data);
                    IR1  = (data & 0x1f) << 7;
                    IR2  = (data & 0x3e0) << 2;
                    IR3  = (data & 0x7c00) >> 3;
                    return;

                case 30: // LZCS
                    {
                        LZCS = data;
                        LZCR = 0;
                        let sbit = (LZCS & 0x80000000) ? LZCS : (~(LZCS));

                        for ( ; sbit & 0x80000000; sbit <<= 1) {
                            LZCR++;
                        }
                    }
                    return;

                case 29: // ORGB
                case 31: // LZCR
                    return;
            }

            oooo(cop2d.uw, addr) = data;
        },

        opcodeCTC2(addr, data) { // Cop2c write
            switch(addr) {
                case  4: // RT33
                case 12: // L33
                case 20: // LR33
                case 26: // H
                case 27: // DQA
                case 29: // ZSF3
                case 30: // ZSF4
                    data = SIGN_EXT_16(data); // ?
                    break;

                /* unused */
                case 31: // FLAG
                    psx.error('opcodeCTC2 -> ' + addr + ' <- ' + psx.hex(data));
                    break;
            }

            oooo(cop2c.uw, addr) = data;
        }
    };
};

const cop2 = new pseudo.CstrCop2();
