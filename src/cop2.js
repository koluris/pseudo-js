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
#define R11R12 oooo(cop2c.sw,  0)
#define R11    __oo(cop2c.sh,  0, 0)
#define R12    __oo(cop2c.sh,  0, 1)
#define R13    __oo(cop2c.sh,  1, 0)
#define R21    __oo(cop2c.sh,  1, 1)
#define R22R23 oooo(cop2c.sw,  2)
#define R22    __oo(cop2c.sh,  2, 0)
#define R23    __oo(cop2c.sh,  2, 1)
#define R31    __oo(cop2c.sh,  3, 0)
#define R32    __oo(cop2c.sh,  3, 1)
#define R33    __oo(cop2c.sh,  4, 0)
#define TRX    oooo(cop2c.sw,  5)
#define TRY    oooo(cop2c.sw,  6)
#define TRZ    oooo(cop2c.sw,  7)
#define L11    __oo(cop2c.sh,  8, 0)
#define L12    __oo(cop2c.sh,  8, 1)
#define L13    __oo(cop2c.sh,  9, 0)
#define L21    __oo(cop2c.sh,  9, 1)
#define L22    __oo(cop2c.sh, 10, 0)
#define L23    __oo(cop2c.sh, 10, 1)
#define L31    __oo(cop2c.sh, 11, 0)
#define L32    __oo(cop2c.sh, 11, 1)
#define L33    __oo(cop2c.sh, 12, 0)
#define RBK    oooo(cop2c.sw, 13)
#define GBK    oooo(cop2c.sw, 14)
#define BBK    oooo(cop2c.sw, 15)
#define LR1    __oo(cop2c.sh, 16, 0)
#define LR2    __oo(cop2c.sh, 16, 1)
#define LR3    __oo(cop2c.sh, 17, 0)
#define LG1    __oo(cop2c.sh, 17, 1)
#define LG2    __oo(cop2c.sh, 18, 0)
#define LG3    __oo(cop2c.sh, 18, 1)
#define LB1    __oo(cop2c.sh, 19, 0)
#define LB2    __oo(cop2c.sh, 19, 1)
#define LB3    __oo(cop2c.sh, 20, 0)
#define RFC    oooo(cop2c.sw, 21)
#define GFC    oooo(cop2c.sw, 22)
#define BFC    oooo(cop2c.sw, 23)
#define OFX    oooo(cop2c.sw, 24)
#define OFY    oooo(cop2c.sw, 25)
#define H      __oo(cop2c.sh, 26, 0)
#define DQA    __oo(cop2c.sh, 27, 0)
#define DQB    oooo(cop2c.sw, 28)
#define ZSF3   __oo(cop2c.sh, 29, 0)
#define ZSF4   __oo(cop2c.sh, 30, 0)
#define FLAG   oooo(cop2c.uw, 31)

// Cop2d
#define VXY0   oooo(cop2d.uw,  0)
#define VX0    __oo(cop2d.sh,  0, 0)
#define VY0    __oo(cop2d.sh,  0, 1)
#define VZ0    __oo(cop2d.sh,  1, 0)
#define VXY1   oooo(cop2d.uw,  2)
#define VX1    __oo(cop2d.sh,  2, 0)
#define VY1    __oo(cop2d.sh,  2, 1)
#define VZ1    __oo(cop2d.sh,  3, 0)
#define VXY2   oooo(cop2d.uw,  4)
#define VX2    __oo(cop2d.sh,  4, 0)
#define VY2    __oo(cop2d.sh,  4, 1)
#define VZ2    __oo(cop2d.sh,  5, 0)
#define RGB    oooo(cop2d.uw,  6)
#define R      ___o(cop2d.ub,  6, 0)
#define G      ___o(cop2d.ub,  6, 1)
#define B      ___o(cop2d.ub,  6, 2)
#define CODE   ___o(cop2d.ub,  6, 3)
#define OTZ    __oo(cop2d.uh,  7, 0)
#define IR0    __oo(cop2d.sh,  8, 0)
#define IR1    __oo(cop2d.sh,  9, 0)
#define IR2    __oo(cop2d.sh, 10, 0)
#define IR3    __oo(cop2d.sh, 11, 0)
#define SXY0   oooo(cop2d.uw, 12)
#define SX0    __oo(cop2d.sh, 12, 0)
#define SY0    __oo(cop2d.sh, 12, 1)
#define SXY1   oooo(cop2d.uw, 13)
#define SX1    __oo(cop2d.sh, 13, 0)
#define SY1    __oo(cop2d.sh, 13, 1)
#define SXY2   oooo(cop2d.uw, 14)
#define SX2    __oo(cop2d.sh, 14, 0)
#define SY2    __oo(cop2d.sh, 14, 1)
#define SXYP   oooo(cop2d.uw, 15)
#define SXP    __oo(cop2d.sh, 15, 0)
#define SYP    __oo(cop2d.sh, 15, 1)
#define SZ0    __oo(cop2d.uh, 16, 0)
#define SZ1    __oo(cop2d.uh, 17, 0)
#define SZ2    __oo(cop2d.uh, 18, 0)
#define SZ3    __oo(cop2d.uh, 19, 0)
#define RGB0   oooo(cop2d.uw, 20)
#define R0     ___o(cop2d.ub, 20, 0)
#define G0     ___o(cop2d.ub, 20, 1)
#define B0     ___o(cop2d.ub, 20, 2)
#define CODE0  ___o(cop2d.ub, 20, 3)
#define RGB1   oooo(cop2d.uw, 21)
#define R1     ___o(cop2d.ub, 21, 0)
#define G1     ___o(cop2d.ub, 21, 1)
#define B1     ___o(cop2d.ub, 21, 2)
#define CODE1  ___o(cop2d.ub, 21, 3)
#define RGB2   oooo(cop2d.uw, 22)
#define R2     ___o(cop2d.ub, 22, 0)
#define G2     ___o(cop2d.ub, 22, 1)
#define B2     ___o(cop2d.ub, 22, 2)
#define CODE2  ___o(cop2d.ub, 22, 3)
#define RES1   oooo(cop2d.uw, 23)
#define MAC0   oooo(cop2d.sw, 24)
#define MAC1   oooo(cop2d.sw, 25)
#define MAC2   oooo(cop2d.sw, 26)
#define MAC3   oooo(cop2d.sw, 27)
#define IRGB   oooo(cop2d.uw, 28)
#define ORGB   oooo(cop2d.uw, 29)
#define LZCS   oooo(cop2d.uw, 30)
#define LZCR   oooo(cop2d.uw, 31)

#define VX(n)  __oo(cop2d.sh, (n<<1)+0, 0)
#define VY(n)  __oo(cop2d.sh, (n<<1)+0, 1)
#define VZ(n)  __oo(cop2d.sh, (n<<1)+1, 0)

#define SX(n)  __oo(cop2d.sh, n+12, 0)
#define SY(n)  __oo(cop2d.sh, n+12, 1)
#define SZ(n)  __oo(cop2d.uh, n+17, 0)

pseudo.CstrCop2 = (function() {
  const cop2c = union(32*4);
  const cop2d = union(32*4);

  return {
    reset() {
      cop2c.ub.fill(0);
      cop2d.ub.fill(0);
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
      }
      //psx.error('COP2 Execute '+hex(code&0x3f));
    },

    opcodeMFC2: function(addr) {
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
          psx.error('opcodeMFC2 -> '+addr);
          break;

        case 30:
          return 0;
      }

      return oooo(cop2d.uw, addr);
    },

    opcodeMTC2: function(addr, data) {
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
            let sbit = (LZCS&0x80000000) ? LZCS : (~(LZCS));

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

    opcodeCTC2: function(addr, data) {
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
