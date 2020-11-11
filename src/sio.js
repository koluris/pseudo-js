/* Base structure and authentic idea PSeudo (Credits: Dennis Koluris) */

#define btnCheck(btn) \
    if (pushed) { \
        btnState &= ( (0xffff ^ (1 << btn))); \
    } \
    else { \
        btnState |= (~(0xffff ^ (1 << btn))); \
    }

pseudo.CstrSerial = function() {
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

    let rx, btnState, index, bfr = [];

    function pollController(data) {
        switch(index) {
            case 0:
                if (data != 0x01) {
                    return 0xff;
                }
                break;

            case 1:
                if (data != 0x42) {
                    return 0xff;
                }
                break;
        }

        rx.data = bfr[index];

        if (++index === 5) {
            index = 0;
        }
    }

    return {
        reset() {
            rx = {
                enabled: false,
                   data: 0
            };

            btnState = 0xffff;
            index    = 0;

            bfr[0] = 0xff;
            bfr[1] = 0x41;
            bfr[2] = 0x5a;
            bfr[3] = 0xff;
            bfr[4] = 0xff;
        },

        write: {
            h(addr, data) {
                directMemH(mem.hwr.uh, addr) = data;
            },

            b(addr, data) {
                switch(addr) {
                    case 0x1040:
                        rx.enabled = true;
                        pollController(data);
                        bus.interruptSet(IRQ_SIO0);
                        return;
                }

                directMemB(mem.hwr.ub, addr) = data;
            }
        },

        read: {
            h(addr) {
                switch(addr) {
                    case 0x1044:
                        return 0b101 | (rx.enabled << 1);
                }

                return directMemH(mem.hwr.uh, addr);
            },

            b(addr) {
                switch(addr) {
                    case 0x1040:
                        if (rx.enabled) {
                            rx.enabled = false;
                            return rx.data;
                        }
                        return 0xff;
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

            bfr[3] = btnState & 0xff;
            bfr[4] = btnState >>> 8;
        }
    };
};

const sio = new pseudo.CstrSerial();