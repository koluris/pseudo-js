/* Base structure taken from PCSX open source emulator, and improved upon (Credits: linuzappz, Shadow) */

#define CD_REG(r) \
    directMemB(mem.hwr.ub, 0x1800 | r)

#define defaultCtrlAndStat() \
    ctrl |= 0x80; \
    stat = CD_STAT_NO_INTR; \
    interruptQueue(data)

#define setResultSize(size) \
    res.p  = 0; \
    res.c  = size; \
    res.ok = 1

#define stopRead() \
    if (reads) { \
        reads = 0; \
    }

#define startRead() \
    reads = 1; \
    readed = 0xff; \
    interruptQueue(6)

pseudo.CstrCdrom = function() {
    const CD_STAT_NO_INTR     = 0;
    const CD_STAT_DATA_READY  = 1;
    const CD_STAT_COMPLETE    = 2;
    const CD_STAT_ACKNOWLEDGE = 3;
    const CD_STAT_DISK_ERROR  = 5;

    // HTML elements
    let divBlink, divKb;

    let ctrl, mode, stat, statP, re2, file, channel;
    let occupied, reads, seeked, readed;
    let irq, cdint, cdreadint;
    let kbRead;

    const param = {
        data: new UintBcap(8),
           p: undefined,
           c: undefined
    };

    const res = {
        data: new UintBcap(8),
          tn: new UintBcap(6),
          td: new UintBcap(4),
           p: undefined,
           c: undefined,
          ok: undefined
    };

    const sector = {
        data: new UintBcap(4),
        prev: new UintBcap(4)
    };

    const transfer = {
        data: new UintBcap(UDF_FRAMESIZERAW),
           p: 0
    };

    function resetParam(prm) {
        prm.data.fill(0);
        prm.p = 0;
        prm.c = 0;
    }

    function resetRes(temp) {
        temp.data.fill(0);
        temp.  tn.fill(0);
        temp.  td.fill(0);
        temp.p  = 0;
        temp.c  = 0;
        temp.ok = 0;
    }

    function resetSect(sect) {
        sect.data.fill(0);
        sect.prev.fill(0);
    }

    function trackRead() {
        sector.prev[0] = INT2BCD(sector.data[0]);
        sector.prev[1] = INT2BCD(sector.data[1]);
        sector.prev[2] = INT2BCD(sector.data[2]);

        psx.trackRead(sector.prev);
    }

    function interruptQueue(code) {
        irq = code;

        if (!stat) {
            cdint = 1
        }
    }

    function interrupt() {
        const prevIrq = irq;

        if (stat) {
            cdint = 1
            return;
        }

        irq = 0xff;
        ctrl &= (~(0x80));

        switch(prevIrq) {
            case  1: // CdlNop
                setResultSize(1);
                stat = CD_STAT_ACKNOWLEDGE;
                res.data[0] = statP;
                break;

            case  2: // CdlSetloc
            case 11: // CdlMute
            case 12: // CdlDemute
            case 13: // CdlSetfilter
            case 14: // CdlSetmode
                setResultSize(1);
                stat = CD_STAT_ACKNOWLEDGE;
                statP |= 0x02;
                res.data[0] = statP;
                break;

            case  3: // CdlAudio
                setResultSize(1);
                stat = CD_STAT_ACKNOWLEDGE;
                statP |= 0x02;
                res.data[0] = statP;
                statP |= 0x80;
                break;

            case  6: // CdlReadN
                if (!reads) {
                    return;
                }

                setResultSize(1);
                stat = CD_STAT_ACKNOWLEDGE;
                statP |= 0x02;
                res.data[0] = statP;
                statP |= 0x20;

                if (!seeked) {
                    seeked = 1;
                    statP |= 0x40;
                }
                cdreadint = 1
                break;

            case  7: // CdlIdle
                setResultSize(1);
                stat = CD_STAT_COMPLETE;
                statP |= 0x02;
                res.data[0] = statP;
                break;

            case  8: // CdlStop
                setResultSize(1);
                stat = CD_STAT_COMPLETE;
                statP &= (~(0x2));
                res.data[0] = statP;
                break;

            case  9: // CdlPause
                setResultSize(1);
                stat = CD_STAT_ACKNOWLEDGE;
                ctrl |= 0x80;
                res.data[0] = statP;
                interruptQueue(prevIrq + 0x20);
                break;

            case  9 + 0x20: // CdlPause
                setResultSize(1);
                stat = CD_STAT_COMPLETE;
                statP |= 0x02;
                statP &= (~(0x20));
                res.data[0] = statP;
                break;

            case 10: // CdlInit
                setResultSize(1);
                stat = CD_STAT_ACKNOWLEDGE;
                statP |= 0x02;
                res.data[0] = statP;
                interruptQueue(prevIrq + 0x20);
                break;

            case 10 + 0x20: // CdlInit
                setResultSize(1);
                stat = CD_STAT_COMPLETE;
                res.data[0] = statP;
                break;

            case 15: // CdlGetmode
                setResultSize(6);
                stat = CD_STAT_ACKNOWLEDGE;
                statP |= 0x02;
                res.data[0] = statP;
                res.data[1] = mode;
                res.data[2] = file;
                res.data[3] = channel;
                res.data[4] = 0;
                res.data[5] = 0;
                break;

            case 16: // CdlGetlocL
                setResultSize(8);
                stat = CD_STAT_ACKNOWLEDGE;
                for (let i = 0; i < 8; i++) {
                  res.data[i] = transfer.data[i];
                }
                break;

            case 17: // CdlGetlocP
                setResultSize(8);
                stat = CD_STAT_ACKNOWLEDGE;
                res.data[0] = 1;
                res.data[1] = 1;
                res.data[2] = sector.prev[0];
                res.data[3] = INT2BCD(BCD2INT(sector.prev[1]) - 2);
                res.data[4] = sector.prev[2];
                res.data[5] = sector.prev[0];
                res.data[6] = sector.prev[1];
                res.data[7] = sector.prev[2];
                break;

            case 19: // CdlGetTN
                setResultSize(3);
                stat = CD_STAT_ACKNOWLEDGE;
                statP |= 0x02;
                res.data[0] = statP;
                res.tn[0] = 1;
                res.tn[1] = 1;
                res.data[1] = INT2BCD(res.tn[0]);
                res.data[2] = INT2BCD(res.tn[1]);
                break;

            case 20: // CdlGetTD
                setResultSize(4);
                stat = CD_STAT_ACKNOWLEDGE;
                statP |= 0x02;
                res.data[0] = statP;
                res.td[0] = 0;
                res.td[1] = 2;
                res.td[2] = 0;
                res.data[1] = INT2BCD(res.td[2]);
                res.data[2] = INT2BCD(res.td[1]);
                res.data[3] = INT2BCD(res.td[0]);
                break;

            case 21: // CdlSeekL
                setResultSize(1);
                stat = CD_STAT_ACKNOWLEDGE;
                statP |= 0x02;
                res.data[0] = statP;
                statP |= 0x40;
                interruptQueue(prevIrq + 0x20);
                seeked = 1;
                break;

            case 21 + 0x20: // CdlSeekL
                setResultSize(1);
                stat = CD_STAT_COMPLETE;
                statP |= 0x02;
                statP &= (~(0x40));
                res.data[0] = statP;
                break;

            case 22: // CdlSeekP
                setResultSize(1);
                stat = CD_STAT_ACKNOWLEDGE;
                statP |= 0x2;
                res.data[0] = statP;
                statP |= 0x40;
                interruptQueue(prevIrq + 0x20);
                break;

            case 22 + 0x20: // CdlSeekP
                setResultSize(1);
                stat = CD_STAT_COMPLETE;
                statP |= 0x2;
                statP &= (~(0x40));
                res.data[0] = statP;
                break;

            case 25: // CdlTest
                stat = CD_STAT_ACKNOWLEDGE;
                switch(param.data[0]) {
                    case 0x04:
                    case 0x05:
                        break;

                    case 0x20:
                        setResultSize(4);
                        res.data[0] = 0x98;
                        res.data[1] = 0x06;
                        res.data[2] = 0x10;
                        res.data[3] = 0xc3;
                        break;

                    default:
                        psx.error('CD CdlTest ', psx.hex(param.data[0]));
                        break;
                }
                break;

            case 26: // CdlID
                setResultSize(1);
                stat = CD_STAT_ACKNOWLEDGE;
                statP |= 0x02;
                res.data[0] = statP;
                interruptQueue(prevIrq + 0x20);
                break;
        
            case 26 + 0x20:
                setResultSize(8);
                stat = CD_STAT_COMPLETE;
                res.data[0] = 0x00;
                res.data[1] = psx.discExists() ? 0x00 : 0x80;
                res.data[2] = 0x00;
                res.data[3] = 0x00;
                res.data[4] = 'S'; // Ehm...
                res.data[5] = 'C';
                res.data[6] = 'E';
                res.data[7] = 'A';
                break;

            case 30: // CdlReadToc
                setResultSize(1);
                stat = CD_STAT_ACKNOWLEDGE;
                statP |= 0x02;
                res.data[0] = statP;
                interruptQueue(prevIrq + 0x20);
                break;
        
            case 30 + 0x20:
                setResultSize(1);
                stat = CD_STAT_COMPLETE;
                statP |= 0x02;
                res.data[0] = statP;
                break;

            default:
                psx.error('CD prevIrq -> ' + prevIrq);
                break;
        }

        if (stat !== CD_STAT_NO_INTR && re2 !== 0x18) {
            bus.interruptSet(IRQ_CD);
        }
    }

    function interruptRead() {
        if (!reads) {
            return;
        }

        if (stat) {
            cdreadint = 1
            return;
        }

        occupied = 1;
        setResultSize(1);
        statP |= 0x22;
        statP &= (~(0x40));
        res.data[0] = statP;

        cpu.pause();
        trackRead();
        divBlink.css({ 'background':'#f5cb0f' });
    }

    // Exposed class functions/variables
    return {
        interruptRead2(buf) {
            transfer.data.set(buf);
            stat = CD_STAT_DATA_READY;

            sector.data[2]++;
            if (sector.data[2] === 75) {
                sector.data[2] = 0;

                sector.data[1]++;
                if (sector.data[1] === 60) {
                    sector.data[1] = 0;
                    sector.data[0]++;
                }
            }
            readed = 0;

            if ((transfer.data[4 + 2] & 0x80) && (mode & 0x02)) {
                interruptQueue(9); // CdlPause
            }
            else {
                cdreadint = 1;
                
                kbRead += buf.bSize;
                divBlink.css({ 'background':'transparent' });
                divKb.innerText = Math.round(kbRead / 1024) + ' kb';
            }

            bus.interruptSet(IRQ_CD);
            cpu.resume();
        },

        init(blink, kb) {
            // Get HTML elements
            divBlink = blink;
            divKb    = kb[0];
        },

        reset() {
            resetParam(param);
            resetRes(res);
            resetSect(sector);
            transfer.data.fill(0);
            transfer.p = 0;

            ctrl = stat = statP = re2 = file = channel = 0;
            occupied = readed = reads = seeked = muted = 0;
            irq = cdint = cdreadint = 0;
            mode = 0;
            kbRead = 0;
        },

        update() {
            if (cdint) {
                if (cdint++ >= 8) {
                    cdint = 0;
                    interrupt();
                }
            }

            if (cdreadint) {
                if (cdreadint++ >= 1024) {
                    cdreadint = 0;
                    interruptRead();
                }
            }
        },

        scopeW(addr, data) {
            switch(addr&0xf) {
                case 0:
                    ctrl = data | (ctrl & (~(0x03)));

                    if (!data) {
                        param.p = 0;
                        param.c = 0;
                        res.ok  = 0;
                    }
                    return;

                case 1:
                    occupied = 0;

                    if (ctrl & 0x01) {
                        return;
                    }

                    switch(data) {
                        case  7: // CdlIdle
                        case  8: // CdlStop
                        case  9: // CdlPause
                        case 10: // CdlInit
                            stopRead();

                        case  1: // CdlNop
                        case  3: // CdlAudio
                        case 11: // CdlMute
                        case 12: // CdlDemute
                        case 15: // CdlGetmode
                        case 16: // CdlGetlocL
                        case 17: // CdlGetlocP
                        case 19: // CdlGetTN
                        case 20: // CdlGetTD
                        case 21: // CdlSeekL
                        case 22: // CdlSeekP
                        case 25: // CdlTest
                        case 26: // CdlID
                        case 30: // CdlReadToc
                            defaultCtrlAndStat();
                            break;

                        case 2: // CdlSetLoc
                            stopRead();
                            defaultCtrlAndStat();
                            seeked = 0;
                            for (let i = 0; i < 3; i++) {
                                sector.data[i] = BCD2INT(param.data[i]);
                            }
                            sector.data[3] = 0;
                            break;

                        case  6: // CdlReadN
                        case 27: // CdlReadS
                            stopRead();
                            irq = 0;
                            stat = CD_STAT_NO_INTR;
                            ctrl |= 0x80;
                            startRead();
                            break;

                        case 13: // CdlSetfilter
                            file    = param.data[0];
                            channel = param.data[1];
                            defaultCtrlAndStat();
                            break;

                        case 14: // CdlSetmode
                            mode = param.data[0];
                            defaultCtrlAndStat();
                            break;

                        default:
                            psx.error('CD W 0x1801 data -> ' + data);
                            break;
                    }

                    if (stat !== CD_STAT_NO_INTR) {
                        bus.interruptSet(IRQ_CD);
                    }
                    return;

                case 2:
                    if (ctrl & 0x01) {
                        switch(data) {
                            case 7:
                                ctrl &= (~(0x03));
                                param.p = 0;
                                param.c = 0;
                                res.ok  = 1;
                                break;

                            default:
                                re2 = data;
                                break;
                        }
                    }
                    else if (!(ctrl & 0x01) && param.p < 8) {
                        param.data[param.p++] = data;
                        param.c++;
                    }
                    return;

                case 3:
                    if (data === 0x07 && ((ctrl & 0x01) == true)) {
                        stat = 0;

                        if (irq === 0xff) {
                            irq = 0;
                            return;
                        }

                        if (irq) {
                            cdint = 1
                        }

                        if (reads && !res.ok) {
                            cdreadint = 1
                        }
                        return;
                    }

                    if (data === 0x80 && ((ctrl & 0x01) == false) && !readed) {
                        readed = 1;
                        transfer.p = 0;

                        switch(mode & 0x30) {
                            case 0x00:
                                transfer.p += 12;
                                return;

                            case 0x20:
                                return;

                            default:
                                psx.error('mode&0x30 -> ' + psx.hex(mode & 0x30));
                                return;
                        }
                    }
                    return;
            }
        },

        scopeR(addr) {
            switch(addr & 0xf) {
                case 0:
                    if (res.ok) {
                        ctrl |= 0x20;
                    }
                    else {
                        ctrl &= (~(0x20));
                    }
          
                    if (occupied) {
                        ctrl |= 0x40;
                    }

                    ctrl |= 0x18;

                    return CD_REG(0) = ctrl;

                case 1:
                    CD_REG(1) = 0;

                    if (res.ok) {
                        CD_REG(1) = res.data[res.p++];

                        if (res.p === res.c) {
                            res.ok = 0;
                        }
                    }

                    return CD_REG(1);

                case 2:
                    if (!readed) {
                        psx.error('CD R !readed');
                        return 0;
                    }
                    return transfer.data[transfer.p++];

                case 3:
                    CD_REG(3) = 0;

                    if (stat) {
                        if (ctrl & 0x01) {
                            CD_REG(3) = stat | 0xe0;
                        }
                        else {
                            CD_REG(3) = 0xff;
                        }
                    }

                    return CD_REG(3);
            }
        },

        executeDMA(addr) {
            const size = (bcr & 0xffff) * 4;

            switch(chcr) {
                case 0x11000000:
                case 0x11400100: // ?
                    if (!readed) {
                        return;
                    }

                    for (let i=0; i<size; i++) {
                        directMemB(mem.ram.ub, madr + i) = transfer.data[transfer.p + i];
                    }

                    transfer.p += size;
                    return;

                case 0x00000000: // ?
                    return;

                default:
                    psx.error('CD DMA -> '+psx.hex(chcr));
                    return;
            }
        }
    };
};

const cdrom = new pseudo.CstrCdrom();
