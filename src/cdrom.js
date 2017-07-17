#define hwr  mem.__hwr

#define CD_STAT_NO_INTR     0
#define CD_STAT_ACKNOWLEDGE 3

#define CD_REG(r)\
  directMemB(hwr.ub, 0x1800|r)

#define setResultSize(size)\
  res.p  = 0;\
  res.c  = size;\
  res.ok = true

pseudo.CstrCdrom = (function() {
  var ctrl, stat, irq, re2;
  var reads, readed, occupied;

  var param = {
    data: new UintBcap(8),
       p: 0,
       c: 0,
  };

  var res = {
    data: new UintBcap(8),
      tn: new UintBcap(6),
      td: new UintBcap(4),
       p: 0,
       c: 0,
      ok: 0,
  };

  return {
    reset() {
      ctrl = 0;
      stat = 0;
       irq = 0;
       re2 = 0;

      param.data.fill(0);
      param.p = 0;
      param.c = 0;

      res.data.fill(0);
      res.  tn.fill(0);
      res.  td.fill(0);
      res.p  = 0;
      res.c  = 0;
      res.ok = 0;

      reads    = false;
      readed   = false;
      occupied = false;
    },

    scopeW(addr, data) {
      switch(addr) {
        case 0x1800:
          ctrl = data | (ctrl&(~0x03));
    
          if (!data) {
            param.p = 0;
            param.c = 0;
            res.ok  = false;
          }
          return;

        case 0x1801:
          occupied = false;
          
          if (ctrl&0x01) {
            psx.error('ctrl&0x01');
          }

          switch(data) {
            case 25: // CdlTest
              stat = CD_STAT_ACKNOWLEDGE;
            
              switch(param.data[0]) {
                case 0x20:
                  setResultSize(4);
                  res.data.set([0x98, 0x06, 0x10, 0xc3]); // Test 20
                  break;

                default:
                  psx.error('param.data[0] -> '+hex(param.data[0]));
                  break;
              }
              break;
          }

          if (stat !== CD_STAT_NO_INTR && re2 !== 0x18) {
            bus.interruptSet(IRQ_CD);
          }
          return;

        case 0x1802:
          if (ctrl&0x01) {
            switch(data) {
              case 7:
                ctrl &= ~0x03;
                param.p = 0;
                param.c = 0;
                res.ok  = true;
                return;

              default:
                re2 = data;
                return;
            }
          }
          else if (!(ctrl&0x01) && param.p < 8) {
            param.data[param.p++] = data;
            param.c++;
          }
          return;

        case 0x1803:
          if (data === 0x07 && ctrl&0x01) {
            stat = 0;

            if (irq === 0xff) {
              psx.error('irq == 0xff');
            }
            
            if (irq) {
              psx.error('if (irq)');
            }
            
            if (reads && !res.ok) {
              psx.error('reads && !res.ok');
            }
            
            return;
          }

          if (data === 0x80 && !(ctrl&0x01) && readed === false) {
            psx.error('W 0x1803 2nd');
          }
          return;
      }
      psx.error('CD-ROM Write '+hex(addr)+' <- '+hex(data));
    },

    scopeR(addr) {
      switch(addr) {
        case 0x1800:
          if (res.ok) {
            ctrl |= 0x20;
          }
          else {
            ctrl &= ~0x20;
          }
          
          if (occupied) {
            psx.error('R 0x1803 occupied');
          }
          
          ctrl |= 0x18;
          return CD_REG(0) = ctrl;

        case 0x1801:
          if (res.ok) {
            CD_REG(1) = res.data[res.p++];
        
            if (res.p === res.c) {
              res.ok = false;
            }
          }
          else {
            psx.error('R 0x1801 else');
            //CD_REG(1) = 0;
          }
          return CD_REG(1);

        case 0x1803:
          if (stat) {
            if (ctrl&0x01) {
              CD_REG(3) = stat | 0xe0;
            }
            else {
              psx.error('R 0x1803 stat 2');
              //CD_REG(3) = 0xff;
            }
          }
          else {
            CD_REG(3) = 0xff;
          }
          return CD_REG(3);
      }
      psx.error('CD-ROM Read '+hex(addr));
    }
  };
})();

#undef hwr
