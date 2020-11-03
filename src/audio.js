// /* Base structure taken from SOPE open source emulator, and improved upon (Credits: SaD, linuzappz) */

// #define ram  mem.__ram
// #define hwr  mem.__hwr

// #define SHRT_MIN\
//   -32768

// #define SHRT_MAX\
//   32767

// #define USHRT_MAX\
//   65536

// #define SAMPLE_RATE\
//   44100

// #define SBUF_SIZE\
//   512

// #define MAX_CHANNELS\
//   24

// #define MAX_VOLUME\
//   0x3fff

// #define spuAcc(addr)\
//   directMemH(hwr.uh, addr)

// #define spuChannel(addr)\
//   (addr>>>4)&0x1f

// pseudo.CstrAudio = (function() {
//   // Web Audio
//   let ctxAudio, ctxScript;
//   let sbuf, stereo = true;

//   // SPU specific
//   let spuMem;
//   let spuAddr;
//   let spuVoices = [];
//   let spuVolumeL, spuVolumeR;

//   function int16ToFloat32(input) {
//     let output = new F32cap(input.bSize/2);
    
//     for (let i=0; i<input.bSize/2; i++) {
//       const int = input[i];
//       output[i] = int >= 0x8000 ? -(0x10000-int)/0x8000 : int/0x7fff;
//     }
//     return output;
//   }

//   const f = [
//     [0, 0], [60, 0], [115, -52], [98, -55], [122, -60]
//   ];

//   function depackVAG(chn) {
//     let p = chn.saddr;
//     let s_1  = 0;
//     let s_2  = 0;
//     let temp = [];

//     while (1) {
//       const shift  = spuMem.ub[p]&15;
//       const filter = spuMem.ub[p]>>4;

//       for (let i=2; i<16; i++) {
//         let a = ((spuMem.ub[p+i]&0x0f)<<12);
//         let b = ((spuMem.ub[p+i]&0xf0)<< 8);
//         if (a&0x8000) a |= 0xffff0000;
//         if (b&0x8000) b |= 0xffff0000;
//         temp[i*2-4] = a>>shift;
//         temp[i*2-3] = b>>shift;
//       }

//       for (let i=0; i<28; i++) {
//         let res = temp[i] + ((s_1*f[filter][0] + s_2*f[filter][1] + 32)>>6);
//         s_2 = s_1;
//         s_1 = res;
//         res = Math.min(Math.max(res, SHRT_MIN), SHRT_MAX);
//         chn.buffer.sh[chn.size++] = res;

//         // Overflow
//         if (chn.size === USHRT_MAX) {
//           cpu.consoleWrite(MSG_ERROR, 'SPU Channel size overflow > '+USHRT_MAX);
//           return;
//         }
//       }

//       // Fin
//       const operator = spuMem.ub[p+1];

//       if (operator === 3 || operator === 7) { // Termination
//         return;
//       }
//       if (operator === 6) { // Repeat
//         chn.raddr = chn.size;
//       }

//       // Advance Buffer
//       p+=16;
//     }
//   }

//   function decodeStream() {
//     for (let n=0; n<MAX_CHANNELS; n++) {
//       const chn = spuVoices[n];
      
//       // Channel on?
//       if (chn.on === false) {
//         continue;
//       }

//       for (let i=0; i<SBUF_SIZE; i++) {
//         chn.count += chn.freq;
//         if (chn.count >= SAMPLE_RATE) {
//           chn.pos += (chn.count/SAMPLE_RATE) | 0;
//           chn.count %= SAMPLE_RATE;
//         }

//         // Mix Channel Samples
//         if (stereo) {
//           sbuf.temp[i] += chn.buffer.sh[chn.pos] * (chn.volume.l/MAX_VOLUME);
//           sbuf.temp[i+SBUF_SIZE] += -chn.buffer.sh[chn.pos] * (chn.volume.r/MAX_VOLUME);
//         }
//         else {
//           sbuf.temp[i] += chn.buffer.sh[chn.pos] * ((chn.volume.l+chn.volume.r)/2)/MAX_VOLUME;
//         }

//         // End of Sample
//         if (chn.pos >= chn.size) {
//           if (chn.raddr > 0) { // Repeat?
//             chn.pos = chn.raddr;
//             chn.count = 0;
//             continue;
//           }
//           chn.on = false;
//           break;
//         }
//       }
//     }
//     // Volume Mix
//     for (let i=0; i<SBUF_SIZE; i++) {
//       if (stereo) {
//         sbuf.final[i] = (sbuf.temp[i]/4) * (spuVolumeL/MAX_VOLUME);
//         sbuf.final[i+SBUF_SIZE] = -(sbuf.temp[i+SBUF_SIZE]/4) * (spuVolumeR/MAX_VOLUME);
//       }
//       else {
//         sbuf.final[i] = (sbuf.temp[i]/4) * ((spuVolumeL+spuVolumeR)/2)/MAX_VOLUME;
//       }
//     }

//     // Clear
//     sbuf.temp.fill(0);
//     return sbuf.final;
//   }

//   function voiceOn(data) {
//     for (let n=0; n<MAX_CHANNELS; n++) {
//       if (data&(1<<n)) {
//         spuVoices[n].on    = true;
//         spuVoices[n].count = 0;
//         spuVoices[n].pos   = 0;
//         spuVoices[n].raddr = 0;
//         spuVoices[n].size  = 0;

//         //spuVoices[n].buffer.sh.fill(0);
//         depackVAG(spuVoices[n]);
//       }
//     }
//   }

//   function voiceOff(data) {
//     for (let n=0; n<MAX_CHANNELS; n++) {
//       if (data&(1<<n)) {
//         spuVoices[n].on = false;
//       }
//     }
//   }

//   function setVolume(data) {
//     let ret = data;

//     if (data&0x8000) {
//       if (data&0x1000) {
//         ret ^= 0xffff;
//       }
//       ret = ((ret&0x7f)+1)/2;
//       ret += ret/(2*((data&0x2000) ? -1 : 1));
//       ret *= 128;
//     }
//     else {
//       if (data&0x4000) {
//         ret = 0x3fff-(data&0x3fff);
//       }
//     }
//     return ret&0x3fff;
//   }

//   return {
//     awake: function() {
//       spuMem = union(1024*256*2);

//       sbuf = {
//         temp : new SintWcap(SBUF_SIZE*2),
//         final: new SintHcap(SBUF_SIZE*2),
//       };

//       // Initialize Web Audio
//       ctxAudio  = new AudioContext();
//       ctxScript = ctxAudio.createScriptProcessor(SBUF_SIZE, 0, stereo ? 2 : 1);

//       // Callback
//       ctxScript.onaudioprocess = function(e) {
//         const output = e.outputBuffer;
//         const float  = int16ToFloat32(decodeStream());

//         if (stereo) {
//           output.fetchChannelData(0).set(float.slice(0, SBUF_SIZE));
//           output.fetchChannelData(1).set(float.slice(SBUF_SIZE));
//         }
//         else {
//           output.fetchChannelData(0).set(float.slice(0, SBUF_SIZE));
//         }
//       };
//     },

//     reset: function() {
//       spuMem.uh.fill(0);
//       sbuf.temp.fill(0);
//       sbuf.final.fill(0);

//       // Variables
//       spuAddr = ~0;
//       spuVolumeL = MAX_VOLUME;
//       spuVolumeR = MAX_VOLUME;

//       // Channels
//       for (let n=0; n<MAX_CHANNELS; n++) {
//         spuVoices[n] = {
//           buffer : union(USHRT_MAX*2),
//           count  : 0,
//           freq   : 0,
//           on     : false,
//           pos    : 0,
//           raddr  : 0,
//           saddr  : 0,
//           size   : 0,
//           volume : {
//             l: 0, r: 0
//           }
//         };

//         spuVoices[n].buffer.sh.fill(0);
//       }

//       // Connect
//       ctxScript.disconnect();
//       ctxScript.connect(ctxAudio.destination);
//     },

//     scopeW: function(addr, data) {
//       spuAcc(addr) = data;

//       // Channels
//       if (addr >= 0x1c00 && addr <= 0x1d7e) {
//         const n = spuChannel(addr);

//         switch(addr&0xf) {
//           case 0x0: // Volume L
//             spuVoices[n].volume.l = setVolume(data);
//             return;

//           case 0x2: // Volume R
//             spuVoices[n].volume.r = setVolume(data);
//             return;

//           case 0x4: // Pitch
//             spuVoices[n].freq = Math.max((data*SAMPLE_RATE)/4096, 1);
//             return;

//           case 0x6: // Sound Address
//             spuVoices[n].saddr = (data<<3)>>>0;
//             return;

//           case 0xe: // Return Address
//             spuVoices[n].raddr = (data<<3)>>>0;
//             return;

//           /* unused */
//           case 0x8:
//           case 0xa:
//           case 0xc:
//             return;
//         }
//         psx.error('SPU scopeW < 0x1d80 '+(psx.hex(addr))+' <- '+psx.hex(data));
//       }

//       // Reverb
//       if (addr >= 0x1dc0 && addr <= 0x1dfe) {
//         return;
//       }

//       // HW
//       switch(addr) {
//         case 0x1da0:
//         case 0x1da4: // ???
//         case 0x1dae:
//         case 0x1db8:
//         case 0x1dba:
//         case 0x1dbc:
//         case 0x1dbe:
//           return;

//         case 0x1d80: // Volume L
//           spuVolumeL = setVolume(data);
//           return;

//         case 0x1d82: // Volume R
//           spuVolumeR = setVolume(data);
//           return;

//         case 0x1d88: // Sound On 1
//           voiceOn(data);
//           return;

//         case 0x1d8a: // Sound On 2
//           voiceOn(data<<16);
//           return;

//         case 0x1d8c: // Sound Off 1
//           voiceOff(data);
//           return;

//         case 0x1d8e: // Sound Off 2
//           voiceOff(data<<16);
//           return;

//         case 0x1da6: // Transfer Address
//           spuAddr = (data<<3)>>>0;
//           return;

//         case 0x1da8: // Data
//           spuMem.uh[spuAddr>>>1] = data;
//           spuAddr+=2;
//           spuAddr&=0x3ffff;
//           return;

//         case 0x1daa: // Control
//           return;

//         case 0x1d84: // Reverb Volume L
//         case 0x1d86: // Reverb Volume R
//         case 0x1d90: // FM Mode On 1
//         case 0x1d92: // FM Mode On 2
//         case 0x1d94: // Noise Mode On 1
//         case 0x1d96: // Noise Mode On 2
//         case 0x1d98: // Reverb Mode On 1
//         case 0x1d9a: // Reverb Mode On 2
//         case 0x1d9c: // Mute 1
//         case 0x1d9e: // Mute 2
//         case 0x1da2: // Reverb Address
//         case 0x1dac:
//         case 0x1db0: // CD Volume L
//         case 0x1db2: // CD Volume R
//         case 0x1db4:
//         case 0x1db6:
//           return;
//       }
//       psx.error('SPU scopeW '+psx.hex(addr)+' <- '+psx.hex(data));
//     },

//     scopeR: function(addr) {
//       // Channels
//       if (addr >= 0x1c00 && addr <= 0x1d7e) {
//         switch(addr&0xf) {
//           case 0x0:
//           case 0x2:
//           case 0x4:
//           case 0x6:
//           case 0x8:
//           case 0xa:
//           case 0xc:
//           case 0xe:
//             return spuAcc(addr);
//         }
//         psx.error('SPU scopeR phase '+psx.hex(addr&0xf));
//       }

//       // HW
//       switch(addr) {
//         //case 0x1da4:
//         case 0x1db0:
//         case 0x1db2:
//         case 0x1db4:
//         case 0x1db6:
//         case 0x1d80:
//         case 0x1d82:
//         case 0x1d90:
//         case 0x1d92: // ???
//           return spuAcc(addr);

//         case 0x1da6: // Transfer Address
//           return spuAddr>>>3;

//         case 0x1d88: // Sound On 1
//         case 0x1d8a: // Sound On 2
//         case 0x1d8c: // Sound Off 1
//         case 0x1d8e: // Sound Off 2
//         case 0x1d94: // Noise Mode On 1
//         case 0x1d96: // Noise Mode On 2
//         case 0x1d98: // Reverb Mode On 1
//         case 0x1d9a: // Reverb Mode On 2
//         case 0x1d9c: // Voice Status 0 - 15
//         case 0x1daa: // Control
//         case 0x1dac: // ?
//         case 0x1dae: // Status
//         case 0x1db8:
//         case 0x1dba:
//         case 0x1e00:
//         case 0x1e02:
//         case 0x1e04:
//         case 0x1e06:
//         case 0x1e08:
//         case 0x1e0a:
//         case 0x1e0c:
//         case 0x1e0e:
//           return spuAcc(addr);
//       }
//       psx.error('SPU scopeR -> '+(psx.hex(addr)));
//       return 0;
//     }
//   };
// })();

// #undef ram
// #undef hwr

#define SPU_CHANNEL(addr) \
    (addr >> 4) & 0x1f

pseudo.CstrAudio = (function() {
    // Web Audio
    let ctxAudio, ctxScript;

    return {
        scopeW: function(addr, data) {
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
                                spuVoices[ch].freq = MIN(data, 0x3fff) << 4;
                                return;
                                
                            case 0x6: // Sound Address
                                spuVoices[ch].saddr = data << 3;
                                return;
                                
                            case 0xe: // Return Address
                                spuVoices[ch].raddr = data << 3;
                                spuVoices[ch].repeat = true;
                                return;
                                
                            /* unused */
                            case 0x8:
                            case 0xa:
                            case 0xc:
                                directMemH(hwr.uh, addr) = data;
                                return;
                        }
                    }

                    psx.error('/// PSeudo SPU Write Channel: ' + psx.hex(addr & 0xf) + ' <- ' + psx.hex(data));
                    return;

                case (addr == 0x1d88): // Sound On 1
                    voiceOn(data);
                    return;
                    
                case (addr == 0x1d8a): // Sound On 2
                    voiceOn(data << 16);
                    return;
                    
                case (addr == 0x1da6): // Transfer Address
                    spuAddr = data << 3;
                    return;
                    
                case (addr == 0x1da8): // Data
                    spuMem[spuAddr >>> 1] = data;
                    spuAddr += 2;
                    spuAddr &= 0x7ffff;
                    return;

                /* unused */
                case (addr == 0x1d80): // Volume L
                case (addr == 0x1d82): // Volume R
                case (addr == 0x1d84): // Reverb Volume L
                case (addr == 0x1d86): // Reverb Volume R
                case (addr == 0x1d8c): // Sound Off 1
                case (addr == 0x1d8e): // Sound Off 2
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
                    directMemH(hwr.uh, addr) = data;
                    return;
            }

            psx.error('/// PSeudo SPU Write: ' + psx.hex(addr) + ' <- ' + psx.hex(data));
        },

        scopeR: function(addr) {
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
                                    return spuVoices[ch].raddr >>> 3;
                                }
                                return 0;
                                
                            /* unused */
                            case 0x0:
                            case 0x2:
                            case 0x4:
                            case 0x6:
                            case 0x8:
                            case 0xa:
                                return directMemH(hwr.uh, addr);
                        }
                    }

                    psx.error('/// PSeudo SPU Read Channel: ' + psx.hex(addr & 0xf));
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
                case (addr >= 0x1e00 && addr <= 0x1e0e): // ?
                    return directMemH(hwr.uh, addr);
            }

            psx.error('/// PSeudo SPU Read: ' + psx.hex(addr));
            return 0;
        },

        executeDMA: function(addr) {
            const size = (bcr >>> 16) * (bcr & 0xffff) * 2;

            switch(chcr) {
                case 0x01000201:
                    for (let i = 0; i < size; i++, addr += 2) {
                        spuMem.uh[spuAddr >>> 1] = directMemH(ram.uh, addr);
                        spuAddr += 2;
                        spuAddr &= 0x7ffff;
                    }
                    return;

                case 0x01000200:
                    for (let i = 0; i < size; i++, addr += 2) {
                        directMemH(ram.uh, addr) = spuMem.uh[spuAddr >>> 1];
                        spuAddr += 2;
                        spuAddr &= 0x7ffff;
                    }
                    return;
            }

            psx.error('/// PSeudo SPU DMA: ' + psx.hex(chcr));
        }
    };
})();
