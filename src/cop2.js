// 32-bit accessor
#define oooo(base, index)\
  base[(index)]

// 16-bit accessor
#define __oo(base, index, offset)\
  base[(index<<1)+offset]

// 08-bit accessor
#define ___o(base, index, offset)\
  base[(index<<2)+offset]

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

#define VX(n)  __oo(cop2d.sh, (n<<1)+0, 0)
#define VY(n)  __oo(cop2d.sh, (n<<1)+0, 1)
#define VZ(n)  __oo(cop2d.sh, (n<<1)+1, 0)

#define SX(n)  __oo(cop2d.sh, n+12, 0)
#define SY(n)  __oo(cop2d.sh, n+12, 1)
#define SZ(n)  __oo(cop2d.uh, n+17, 0)

// General
#define FIX(a) \
  ((a)>>12)

#define LIM(a, min, max, bit) \
  (((a) < min) ? (FLAG |= (1<<bit), min) : \
  (((a) > max) ? (FLAG |= (1<<bit), max) : ((a))))

#define limB1(a) LIM(a, -32768.0, 32767.0, 24)
#define limB2(a) LIM(a, -32768.0, 32767.0, 23)
#define limB3(a) LIM(a, -32768.0, 32767.0, 22)
#define limD(a)  LIM(a,      0.0, 65535.0, 18)
#define limG1(a) LIM(a,  -1024.0,  1023.0, 14)
#define limG2(a) LIM(a,  -1024.0,  1023.0, 13)
#define limH(a)  LIM(a,      0.0,  4096.0, 12)

#define MAC2IR()\
  IR1 = limB1(MAC1);\
  IR2 = limB2(MAC2);\
  IR3 = limB3(MAC3)

pseudo.CstrCop2 = (function() {
  var cop2c = union(32*4);
  var cop2d = union(32*4);

  return {
    reset() {
      ioZero(cop2c.ub);
      ioZero(cop2d.ub);
    },

    execute(code) {
      switch(code&0x3f) {
        case 0: // BASIC
          switch(rs&7) {
            case 0: // MFC2
              cpu.setbase(rt, cop2.opcodeMFC2(rd));
              return;

            case 2: // CFC2
              cpu.setbase(rt, oooo(cop2c.uw, rd));
              return;

            case 4: // MTC2
              cop2.opcodeMTC2(rd, cpu.readbase(rt));
              return;

            case 6: // CTC2
              cop2.opcodeCTC2(rd, cpu.readbase(rt));
              return;
          }
          psx.error('COP2 Basic '+(rs&7));
          return;

        case 1: // RTPS
          {
            FLAG = 0;

            MAC1 = FIX(R11*VX0+R12*VY0+R13*VZ0)+TRX;
            MAC2 = FIX(R21*VX0+R22*VY0+R23*VZ0)+TRY;
            MAC3 = FIX(R31*VX0+R32*VY0+R33*VZ0)+TRZ;

            MAC2IR();

            SZ0  = SZ1;
            SZ1  = SZ2;
            SZ2  = SZ3;
            SZ3  = limD(MAC3);

            var quotient = H*4096.0/SZ3;

            SXY0 = SXY1;
            SXY1 = SXY2;

            SX2  = limG1(FIX(IR1*quotient)+OFX);
            SY2  = limG2(FIX(IR2*quotient)+OFY);

            MAC0 = FIX(DQA*quotient)+DQB;
            IR0  = limH(MAC0);
          }
          return;

        case 48: // RTPT
          {
            var quotient;

            FLAG = 0;
            SZ0  = SZ3;

            for (var v=0; v<3; v++) {
              var v1 = VX(v);
              var v2 = VY(v);
              var v3 = VZ(v);

              MAC1 = FIX(R11*v1+R12*v2+R13*v3)+TRX;
              MAC2 = FIX(R21*v1+R22*v2+R23*v3)+TRY;
              MAC3 = FIX(R31*v1+R32*v2+R33*v3)+TRZ;

              MAC2IR();

              SZ(v) = limD(MAC3);
              quotient = H*4096.0/SZ(v);
              
              SX(v) = limG1(FIX(IR1*quotient)+OFX);
              SY(v) = limG2(FIX(IR2*quotient)+OFY);
            }
            MAC0 = FIX(DQA*quotient)+DQB;
            IR0  = limH(MAC0);
          }
          return;
      }
      //cpu.consoleWrite(MSG_ERROR, 'COP2 Execute '+(code&0x3f));
    },

    opcodeMFC2(addr) {
      switch(addr) {
        case  1:
        case  3:
        case  5:
        case  8:
        case  9:
        case 10:
        case 11:
          oooo(cop2d.sw, addr) = __oo(cop2d.sh, addr, 0);
          break;

        case  7:
        case 16:
        case 17:
        case 18:
        case 19:
          oooo(cop2d.uw, addr) = __oo(cop2d.uh, addr, 0);
          break;

        case 15:
          psx.error('opcodeMFC2 -> '+addr);
          break;

        case 28:
        case 29:
          oooo(cop2d.uw, addr) = LIM(IR1>>7, 0x1f, 0, 0) | (LIM(IR2>>7, 0x1f, 0, 0)<<5) | (LIM(IR3>>7, 0x1f, 0, 0)<<10);
          break;

        case 30:
          return 0;
      }

      return oooo(cop2d.uw, addr);
    },

    opcodeMTC2(addr, data) {
      switch(addr) {
        case 15:
          SXY0 = SXY1;
          SXY1 = SXY2;
          SXY2 = data;
          SXYP = data;
          return;

        case 28:
          IRGB = data;
          IR1  =(data&0x001f)<<7;
          IR2  =(data&0x03e0)<<2;
          IR3  =(data&0x7c00)>>3;
          return;

        case 30:
          {
            LZCS = data;
            LZCR = 0;
            var sbit = (LZCS&0x80000000) ? LZCS : ~LZCS;

            for ( ; sbit&0x80000000; sbit<<=1) {
              LZCR++;
            }
          }
          return;

        case  7:
        case 29:
        case 31:
          return;
      }

      oooo(cop2d.uw, addr) = data;
    },

    opcodeCTC2(addr, data) {
      switch(addr) {
        case  4:
        case 12:
        case 20:
        case 26:
        case 27:
        case 29:
        case 30:
          data = SIGN_EXT_16(data); // ?
          break;

        /* unused */
        case 31:
          psx.error('opcodeCTC2 -> '+addr+' <- '+hex(data));
          break;
      }

      oooo(cop2c.uw, addr) = data;
    }
  };
})();
