/* Base structure taken from SOPE open source emulator, and improved upon (Credits: SaD, linuzappz) */

#define SHRT_MIN \
    -32768

#define SHRT_MAX \
    32767

#define audioSet(a, b) \
    rest = (spuMem.ub[ch.paddr] & a) << b; \
    if (rest & 0x8000) rest |= 0xffff0000; \
    rest = (rest >> shift) + ((ch.s[0] * f[predict][0] + ch.s[1] * f[predict][1] + 32) >> 6); \
    ch.s[1] = ch.s[0]; \
    ch.s[0] = Math.min(Math.max(rest, SHRT_MIN), SHRT_MAX); \
    ch.bfr[i++] = ch.s[0]

#define SPU_CHANNEL(addr) \
    (addr >>> 4) & 0x1f

pseudo.CstrAudio = function() {
    const SPU_SAMPLE_RATE = 44100;
    const SPU_SAMPLE_SIZE = 1024;
    const SPU_MAX_CHAN    = 24 + 1;

    const f = [
        [0, 0], [60, 0], [115, -52], [98, -55], [122, -60]
    ];

    // Web Audio
    let ctxAudio, ctxScript;
    
    // SPU specific
    let spuMem;
    let spuAddr;
    let spuVoices = [];
    let sbuf;

    function int16ToFloat32(input) {
        let output = new F32cap(input.bSize / 2);
        
        for (let i = 0; i < input.bSize / 2; i++) {
            const int = input[i];
            output[i] = int >= 0x8000 ? -(0x10000 - int) / 0x8000 : int / 0x7fff;
        }
        return output;
    }

    function setVolume(data) {
        return ((data & 0x7fff) ^ 0x4000) - 0x4000;
    }

    function voiceOn(data) {
        for (let i = 0; i < SPU_MAX_CHAN; i++) {
            if (data & (1 << i) && spuVoices[i].saddr) {
                spuVoices[i].isNew  = true;
                spuVoices[i].repeat = false;
            }
        }
    }

    function voiceOff(data) {
        for (let i = 0; i < SPU_MAX_CHAN; i++) {
            if (data & (1 << i)) {
                spuVoices[i].active = false;
            }
        }
    }

    function decodeStream() {
        sbuf.fill(0);

        for (let n = 0; n < SPU_MAX_CHAN; n++) {
            const ch = spuVoices[n];

            if (ch.isNew) {
                ch.s.fill(0);
                ch.paddr  = ch.saddr;
                ch.isNew  = false;
                ch.active = true;
                ch.spos   = 0x10000;
                ch.bpos   = 28;
                ch.sample = 0;
            }
            
            if (ch.active == false) {
                continue;
            }

            decodeChannel(ch);
        }

        return sbuf;
    }

    function decodeChannel(ch) {
        for (let ns = 0; ns < SPU_SAMPLE_SIZE; ns++) {
            for (; ch.spos >= 0x10000; ch.spos -= 0x10000) {
                if (ch.bpos == 28) {
                    if (ch.paddr == -1) {
                        ch.active = false;
                        return;
                    }

                    ch.bpos = 0;
                    const shift   = spuMem.ub[ch.paddr] & 0xf;
                    const predict = spuMem.ub[ch.paddr++] >> 4;
                    const op      = spuMem.ub[ch.paddr++];
                    
                    for (let i = 0, rest; i < 28; ch.paddr++) {
                        audioSet(0x0f, 0xc);
                        audioSet(0xf0, 0x8);
                    }
                    
                    if ((op & 4) && (!ch.repeat)) {
                        ch.raddr = ch.paddr - 16;
                    }
                    
                    if ((op & 1)) {
                        ch.paddr = (op != 3 || ch.raddr == 0) ? -1 : ch.raddr;
                    }
                }

                ch.sample = ch.bfr[ch.bpos++] >> 2;
            }

            sbuf[ns] += (ch.sample * ch.volumeL) >> 14;
            sbuf[ns + SPU_SAMPLE_SIZE] += (ch.sample * ch.volumeR) >> 14;
            
            ch.spos += ch.freq;
        }
    }

    // Exposed class functions/variables
    return {
        init() {
            spuMem = union(256 * 1024 * 2);
              sbuf = new UintHcap(SPU_SAMPLE_SIZE * 2);

            // Channels
            for (let n = 0; n < SPU_MAX_CHAN; n++) {
                spuVoices[n] = {
                    bfr: new SintWcap(28),
                      s: new SintWcap(2)
                };
            }

            // Initialize Web Audio
            ctxAudio  = new AudioContext({ sampleRate: SPU_SAMPLE_RATE });
            ctxScript = ctxAudio.createScriptProcessor(SPU_SAMPLE_SIZE, 0, 2);

            // Callback
            ctxScript.onaudioprocess = function(e) {
                const output = e.outputBuffer;
                const float  = int16ToFloat32(decodeStream());

                output.fetchChannelData(0).set(float.slice(0, SPU_SAMPLE_SIZE));
                output.fetchChannelData(1).set(float.slice(SPU_SAMPLE_SIZE));
            };
        },

        reset() {
            spuMem.uh.fill(0);
            spuAddr = 0xffffffff;

            // Channels
            for (let n = 0; n < SPU_MAX_CHAN; n++) {
                const ch = spuVoices[n];
                ch.isNew   = false;
                ch.active  = false;
                ch.repeat  = false;
                ch.freq    = 0;
                ch.volumeL = 0;
                ch.volumeR = 0;
                ch.saddr   = 0;
                ch.raddr   = 0;
            }

            // Connect
            ctxScript.disconnect();
            ctxScript.connect(ctxAudio.destination);
        },

        scopeW(addr, data) {
            switch(true) {
                case (addr >= 0x1c00 && addr <= 0x1d7e): // Channels
                    {
                        const ch = SPU_CHANNEL(addr);

                        switch(addr & 0xf) {
                            case 0x0: // Volume L
                                spuVoices[ch].volumeL = setVolume(data);
                                return;
                                
                            case 0x2: // Volume R
                                spuVoices[ch].volumeR = setVolume(data);
                                return;
                                
                            case 0x4: // Pitch
                                spuVoices[ch].freq = Math.min(data, 0x3fff) << 4;
                                return;
                                
                            case 0x6: // Sound Address
                                spuVoices[ch].saddr  = data << 3;
                                return;
                                
                            case 0xe: // Return Address
                                spuVoices[ch].raddr  = data << 3;
                                spuVoices[ch].repeat = true;
                                return;
                                
                            /* unused */
                            case 0x8:
                            case 0xa:
                            case 0xc:
                                directMemH(mem.hwr.uh, addr) = data;
                                return;
                        }
                    }

                    psx.error('SPU Write Channel: ' + psx.hex(addr & 0xf) + ' <- ' + psx.hex(data));
                    return;

                case (addr == 0x1d88): // Sound On 1
                    voiceOn(data);
                    return;
                    
                case (addr == 0x1d8a): // Sound On 2
                    voiceOn(data << 16);
                    return;

                case (addr == 0x1d8c): // Sound Off 1
                    voiceOff(data);
                    return;

                case (addr == 0x1d8e): // Sound Off 2
                    voiceOff(data << 16);
                    return;

                case (addr == 0x1da6): // Transfer Address
                    spuAddr = data << 3;
                    return;
                    
                case (addr == 0x1da8): // Data
                    spuMem.uh[spuAddr >>> 1] = data;
                    spuAddr += 2;
                    spuAddr &= 0x7ffff;
                    return;

                /* unused */
                case (addr == 0x1d80): // Volume L
                case (addr == 0x1d82): // Volume R
                case (addr == 0x1d84): // Reverb Volume L
                case (addr == 0x1d86): // Reverb Volume R
                // case (addr == 0x1d8c): // Sound Off 1
                // case (addr == 0x1d8e): // Sound Off 2
                case (addr == 0x1d90): // FM Mode On 1
                case (addr == 0x1d92): // FM Mode On 2
                case (addr == 0x1d94): // Noise Mode On 1
                case (addr == 0x1d96): // Noise Mode On 2
                case (addr == 0x1d98): // Reverb Mode On 1
                case (addr == 0x1d9a): // Reverb Mode On 2
                case (addr == 0x1d9c): // Mute 1
                case (addr == 0x1d9e): // Mute 2
                case (addr == 0x1da0): // ?
                case (addr == 0x1daa): // Control
                case (addr == 0x1da2): // Reverb Address
                case (addr == 0x1da4): // ?
                case (addr == 0x1dac): // ?
                case (addr == 0x1dae): // ?
                case (addr == 0x1db0): // CD Volume L
                case (addr == 0x1db2): // CD Volume R
                case (addr == 0x1db4): // ?
                case (addr == 0x1db6): // ?
                case (addr == 0x1db8): // ?
                case (addr == 0x1dba): // ?
                case (addr == 0x1dbc): // ?
                case (addr == 0x1dbe): // ?
                case (addr >= 0x1dc0 && addr <= 0x1dfe): // Reverb
                    directMemH(mem.hwr.uh, addr) = data;
                    return;
            }

            psx.error('SPU Write: ' + psx.hex(addr) + ' <- ' + psx.hex(data));
        },

        scopeR(addr) {
            switch(true) {
                case (addr >= 0x1c00 && addr <= 0x1d7e): // Channels
                    {
                        const ch = SPU_CHANNEL(addr);

                        switch(addr & 0xf) {
                            case 0xc: // Hack
                                if (spuVoices[ch].isNew) {
                                    return 1;
                                }
                                return 0;
                                
                            case 0xe: // Madman
                                if (spuVoices[ch].raddr) {
                                    return spuVoices[ch].raddr >> 3;
                                }
                                return 0;
                                
                            /* unused */
                            case 0x0:
                            case 0x2:
                            case 0x4:
                            case 0x6:
                            case 0x8:
                            case 0xa:
                                return directMemH(mem.hwr.uh, addr);
                        }
                    }

                    psx.error('SPU Read Channel: ' + psx.hex(addr & 0xf));
                    return 0;

                case (addr == 0x1da6): // Transfer Address
                    return spuAddr >>> 3;
                    
                /* unused */
                case (addr == 0x1d80): // Volume L ?
                case (addr == 0x1d82): // Volume R ?
                case (addr == 0x1d88): // Sound On 1
                case (addr == 0x1d8a): // Sound On 2
                case (addr == 0x1d8c): // Sound Off 1
                case (addr == 0x1d8e): // Sound Off 2
                case (addr == 0x1d90): // ?
                case (addr == 0x1d92): // ?
                case (addr == 0x1d94): // Noise Mode On 1
                case (addr == 0x1d96): // Noise Mode On 2
                case (addr == 0x1d98): // Reverb Mode On 1
                case (addr == 0x1d9a): // Reverb Mode On 2
                case (addr == 0x1d9c): // Voice Status 0 - 15
                case (addr == 0x1daa): // Control
                case (addr == 0x1dac): // ?
                case (addr == 0x1dae): // Status
                case (addr == 0x1db0): // ?
                case (addr == 0x1db2): // ?
                case (addr == 0x1db4): // ?
                case (addr == 0x1db6): // ?
                case (addr == 0x1db8): // ?
                case (addr == 0x1dba): // ?
                case (addr >= 0x1e00 && addr <= 0x1e3e): // ?
                    return directMemH(mem.hwr.uh, addr);
            }

            psx.error('SPU Read: ' + psx.hex(addr));
            return 0;
        },

        executeDMA(addr) {
            const size = (bcr >>> 16) * (bcr & 0xffff) * 2;

            switch(chcr) {
                case 0x01000201:
                    for (let i = 0; i < size; i++, madr += 2) {
                        spuMem.uh[spuAddr >>> 1] = directMemH(mem.ram.uh, madr);
                        spuAddr += 2;
                        spuAddr &= 0x7ffff;
                    }
                    return;

                case 0x01000200:
                    for (let i = 0; i < size; i++, madr += 2) {
                        directMemH(mem.ram.uh, madr) = spuMem.uh[spuAddr >>> 1];
                        spuAddr += 2;
                        spuAddr &= 0x7ffff;
                    }
                    return;
            }

            psx.error('SPU DMA: ' + psx.hex(chcr));
        }
    };
};

const audio = new pseudo.CstrAudio();
