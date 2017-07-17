#define hwr  mem.__hwr

#define CD_STAT_NO_INTR     0
#define CD_STAT_COMPLETE    2
#define CD_STAT_ACKNOWLEDGE 3

#define CD_REG(r)\
  directMemB(hwr.ub, 0x1800|r)

#define setResultSize(size)\
  res.p  = 0;\
  res.c  = size;\
  res.ok = true

#define defaultCtrlAndStat(code)\
  ctrl |= 0x80;\
  stat = CD_STAT_NO_INTR;\
  addIrqQueue(data, code)

#define CD_INT(end)\
  cdint = 1

#define stopRead\
  if (reads) {\
    reads = 0;\
  }\
  statP &= ~0x20

pseudo.CstrCdrom = (function() {
  var ctrl, stat, statP, irq, re2;
  var reads, readed, occupied;
  var cdint;
  var end_time;
  var muted;

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

  function addIrqQueue(code, end) {
    irq = code;
    
    if (stat) {
      end_time = end;
    }
    else {
      CD_INT(end);
    }
  }

  function interrupt() {
    var prevIrq = irq;
    
    if (stat) {
      psx.error('CD interrupt stat');
      return;
    }

    irq = 0xff;
    ctrl &= ~0x80;

    switch(prevIrq) {
      case 1: // CdlNop
        setResultSize(1);
        statP |= 0x2;
        res.data[0] = statP;
        stat = CD_STAT_ACKNOWLEDGE; // More stuff here
        res.data[0] |= 0x2;
        break;

      case 10: // CdlInit
        setResultSize(1);
        statP |= 0x02;
        res.data[0] = statP;
        stat = CD_STAT_ACKNOWLEDGE;
        addIrqQueue(10 + 0x20, 0x1000);
        break;

      case 12: // CdlDemute
        setResultSize(1);
        statP |= 0x02;
        res.data[0] = statP;
        stat = CD_STAT_ACKNOWLEDGE;
        break;

      case 10 + 0x20: // CdlInit
        setResultSize(1);
        res.data[0] = statP;
        stat = CD_STAT_COMPLETE;
        break;

      default:
        psx.error('CD interrupt prevIrq -> '+prevIrq);
        break;
    }

    if (stat !== CD_STAT_NO_INTR && re2 !== 0x18) {
      bus.interruptSet(IRQ_CD);
    }
  }

  return {
    reset() {
      ctrl  = 0;
      stat  = 0;
      statP = 0;
       irq  = 0;
       re2  = 0;

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

      cdint = 0;
      end_time = 0;
      muted = 0;
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
            return;
          }

          switch(data) {
            case  1: // CdlNop
            case 25: // CdlTest
              defaultCtrlAndStat(0x1000);
              break;

            case 10: // CdlInit
              stopRead;
              defaultCtrlAndStat(0x1000);
              break;

            case 12: // CdlDemute
              muted = 0;
              defaultCtrlAndStat(0x1000);
              break;

            default:
              psx.error('0x1801 CMD -> '+data);
              break;
          }

          if (stat !== CD_STAT_NO_INTR) {
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
              irq = 0;
              return;
            }
            
            if (irq) {
              CD_INT(end_time);
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
            CD_REG(3) = 0;
          }
          return CD_REG(3);
      }
      psx.error('CD-ROM Read '+hex(addr));
    },

    update() {
      if (cdint) {
        if (cdint++ === 16) {
          interrupt();
          cdint = 0;
        }
      }
    }
  };
})();

#undef hwr
