#define hwr  mem.__hwr

#define CD_REG(r)\
  directMemB(hwr.ub, 0x1800|r)

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
          ctrl = data | (ctrl&(~3));
    
          if (!data) {
            param.p = 0;
            param.c = 0;
            res.ok  = false;
          }
          return;

        case 0x1802:
          if (ctrl&0x01) {
            switch(data) {
              case 7:
                ctrl &= ~3;
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
            psx.error('R 0x1800 res.ok');
          }
          else {
            ctrl &= ~0x20;
          }
          
          if (occupied) {
            psx.error('R 0x1803 occupied');
          }
          
          ctrl |= 0x18;
          return CD_REG(0) = ctrl;

        case 0x1803:
          if (stat) {
            psx.error('R 0x1803 stat');
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
