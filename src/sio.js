/* Base structure and authentic idea PSeudo (Credits: Dennis Koluris) */

#define btnCheck(btn) \
    if (pushed) { \
        btnState &=  (0xffff ^ (1 << btn)); \
    } \
    else { \
        btnState |= ~(0xffff ^ (1 << btn)); \
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

    let mode, control, baud, rx_has_data, rx_data;
    let index;
    let btnState;

    function controller(data) {
        switch(index) {
            case 0:
                if (data != 0x01) {
                    return 0xff;
                }
                index++;
                return 0xff;

            case 1:
                if (data != 0x42) {
                    return 0xff;
                }
                index++;
                return 0x41;

            case 2:
                index++;
                return 0x5a;

            case 3:
                index++;
                return (btnState >>> 0) & 0xff;

            case 4:
                index = 0;
                return (btnState >>> 8) & 0xff;
        }

        return 0xff;
    }

    return {
        reset() {
            index = 0;
            rx_has_data = false;
            rx_data = 0;
            mode    = 0;
            control = 0;
            baud    = 0;

            // Default pad buffer
            btnState = 0xffff;
        },

        write: {
            h(addr, data) {
                switch(addr) {
                    case 0x1048:
                        mode = data;
                        return;

                    case 0x104a:
                        control = data;
                        return;

                    case 0x104e:
                        baud = data;
                        return;
                }
                psx.error('SIO write h ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            },

            b(addr, data) {
                switch(addr) {
                    case 0x1040:
                        rx_data = controller(data);
                        rx_has_data = true;
                        bus.interruptSet(IRQ_SIO0);
                        return;
                }
                psx.error('SIO write b ' + psx.hex(addr) + ' <- ' + psx.hex(data));
            }
        },

        read: {
            h(addr) {
                switch(addr) {
                    case 0x1044:
                        return 0b101 | (rx_has_data << 1);

                    case 0x104a:
                        return control;

                    case 0x104e:
                        return baud;
                }
                psx.error('SIO read h ' + psx.hex(addr));
            },

            b(addr) {
                switch(addr) {
                    case 0x1040:
                        if (rx_has_data) {
                            rx_has_data = false;
                            return rx_data;
                        }
                        return 0xff;
                }
                psx.error('SIO read b ' + psx.hex(addr));
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

const sio = new pseudo.CstrSerial();