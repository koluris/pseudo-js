/* Base structure and authentic idea PSeudo (Credits: Dennis Koluris) */

#define status \
    directMemW(mem.hwr.uw, 0x1044)

#define control \
    directMemH(mem.hwr.uh, 0x104a)

// Check for pushed button
#define btnCheck(btn) \
    if (pushed) { \
        btnState &= ( (0xffff ^ (1 << btn))); \
    } \
    else { \
        btnState |= (~(0xffff ^ (1 << btn))); \
    }

pseudo.CstrSerial = function() {
    const SIO_STAT_TX_READY = 0x001;
    const SIO_STAT_RX_READY = 0x002;
    const SIO_STAT_TX_EMPTY = 0x004;
    const SIO_STAT_IRQ      = 0x200;

    const SIO_CTRL_DTR         = 0x002;
    const SIO_CTRL_RESET_ERROR = 0x010;
    const SIO_CTRL_RESET       = 0x040;

    const PAD_BTN_SELECT   =  0;
    const PAD_BTN_START    =  3;
    const PAD_BTN_UP       =  4;
    const PAD_BTN_RIGHT    =  5;
    const PAD_BTN_DOWN     =  6;
    const PAD_BTN_LEFT     =  7;
    const PAD_BTN_L2       =  8;
    const PAD_BTN_R2       =  9;
    const PAD_BTN_L1       = 10;
    const PAD_BTN_R1       = 11;
    const PAD_BTN_TRIANGLE = 12;
    const PAD_BTN_CIRCLE   = 13;
    const PAD_BTN_CROSS    = 14;
    const PAD_BTN_SQUARE   = 15;

    let bfr = new UintBcap(5);
    let btnState, index, step;

    return {
        reset() {
            status = SIO_STAT_TX_READY | SIO_STAT_TX_EMPTY;
            index  = 0;
            step   = 0;
            btnState = 0xffff;

            // Default pad buffer
            bfr[0] = 0xff;
            bfr[1] = 0x41;
            bfr[2] = 0x5a;
            bfr[3] = 0xff;
            bfr[4] = 0xff;
        },

        write: {
            h(addr, data) {
                switch(addr) {
                    case 0x104a:
                        control = data & (~(SIO_CTRL_RESET_ERROR));
                        
                        if (control & SIO_CTRL_RESET || !control) {
                            status  = SIO_STAT_TX_READY | SIO_STAT_TX_EMPTY;
                            
                            index = 0;
                            step  = 0;
                        }
                        return;
                }

                directMemH(mem.hwr.uh, addr) = data;
            },

            b(addr, data) {
                switch(addr) {
                    case 0x1040:
                        switch(step) {
                            case 1:
                                if (data & 0x40) {
                                    index = 1;
                                    step  = 2;
                                    
                                    if (data  == 0x42) {
                                        bfr[1] = 0x41;
                                    }
                                    else
                                    if (data  == 0x43) {
                                        bfr[1] = 0x43;
                                    }
                                    else {
                                        psx.error('SIO: Data == ' + psx.hex(data));
                                    }
                                }
                                else {
                                    step = 0;
                                }
                                
                                bus.interruptSet(IRQ_SIO0);
                                return;
                                
                            case 2:
                                if (++index == bfr.bSize - 1) {
                                    step = 0;
                                    return;
                                }
                                
                                bus.interruptSet(IRQ_SIO0);
                                return;
                        }
                        
                        if (data == 1) {
                            status &= (~(SIO_STAT_TX_EMPTY));
                            status |= ( (SIO_STAT_RX_READY));
                            
                            index = 0;
                            step  = 1;
                            
                            if (control & SIO_CTRL_DTR) {
                                if (control & 0x2000) { // Controller 2
                                    bfr[3] = 0xff;
                                    bfr[4] = 0xff;
                                } else { // Controller 1
                                    bfr[3] = btnState & 0xff;
                                    bfr[4] = btnState >>> 8;
                                }
                                bus.interruptSet(IRQ_SIO0);
                            }
                        }
                        return;
                }

                directMemB(mem.hwr.ub, addr) = data;
            }
        },

        read: {
            h(addr) {
                return directMemH(mem.hwr.uh, addr);
            },

            b(addr) {
                switch(addr) {
                    case 0x1040:
                        if (!(status & SIO_STAT_RX_READY)) {
                            return 0;
                        }

                        if (index == bfr.bSize - 1) {
                            status &= (~(SIO_STAT_RX_READY));
                            status |= ( (SIO_STAT_TX_EMPTY));
                            
                            if (step == 2) {
                                step  = 0;
                            }
                        }
                        return bfr[index];
                }

                return directMemB(mem.hwr.ub, addr) = data;
            }
        },

        padListener(code, pushed) {
            if (code == 50) { // Select
                btnCheck(PAD_BTN_SELECT);
            }

            if (code == 49) { // Start
                btnCheck(PAD_BTN_START);
            }

            if (code == 38) { // Up
                btnCheck(PAD_BTN_UP);
            }

            if (code == 39) { // R
                btnCheck(PAD_BTN_RIGHT);
            }

            if (code == 40) { // Down
                btnCheck(PAD_BTN_DOWN);
            }

            if (code == 37) { // Left
                btnCheck(PAD_BTN_LEFT);
            }

            if (code == 90) { // Z
                btnCheck(PAD_BTN_CIRCLE);
            }

            if (code == 88) { // X
                btnCheck(PAD_BTN_CROSS);
            }
        }
    };
};

#undef status
#undef control

const sio = new pseudo.CstrSerial();