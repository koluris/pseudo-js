#define ram  mem.__ram
#define hwr  mem.__hwr

#define SHRT_MIN\
  -32768

#define SHRT_MAX\
  32767

#define USHRT_MAX\
  65536

#define SAMPLE_RATE\
  44100

#define SBUF_SIZE\
  1024

#define MAX_CHANNELS\
  24

#define MAX_VOLUME\
  0x3fff

#define spuAcc(addr)\
  directMemH(hwr.uh, addr)

#define spuChannel(addr)\
  (addr>>>4)&0x1f

pseudo.CstrAudio = (function() {
  // Web Audio
  var ctxAudio, ctxScript;
  var sbuf, stereo = true;

  // SPU specific
  var spuMem;
  var spuAddr;
  var spuVoices = [];
  var spuVolumeL, spuVolumeR;

  function int16ToFloat32(input) {
    var output = new F32cap(input.bLen/2);
    
    for (var i=0; i<input.bLen/2; i++) {
      var int = input[i];
      output[i] = int >= 0x8000 ? -(0x10000-int)/0x8000 : int/0x7fff;
    }
    return output;
  }

  var f = [
    [0, 0], [60, 0], [115, -52], [98, -55], [122, -60]
  ];

  function depackVAG(chn) {
    var p = chn.saddr;
    var s_1  = 0;
    var s_2  = 0;
    var temp = [];

    while (1) {
      var shift  = spuMem.ub[p]&15;
      var filter = spuMem.ub[p]>>4;

      for (var i=2; i<16; i++) {
        var a = ((spuMem.ub[p+i]&0x0f)<<12);
        var b = ((spuMem.ub[p+i]&0xf0)<< 8);
        if (a&0x8000) a |= 0xffff0000;
        if (b&0x8000) b |= 0xffff0000;
        temp[i*2-4] = a>>shift;
        temp[i*2-3] = b>>shift;
      }

      for (var i=0; i<28; i++) {
        var res = temp[i] + ((s_1*f[filter][0] + s_2*f[filter][1] + 32)>>6);
        s_2 = s_1;
        s_1 = res;
        res = Math.min(Math.max(res, SHRT_MIN), SHRT_MAX);
        chn.buffer.sh[chn.size++] = res;

        // Overflow
        if (chn.size === USHRT_MAX) {
          cpu.consoleWrite(MSG_ERROR, 'SPU Channel size overflow > '+USHRT_MAX);
          return;
        }
      }

      // Fin
      var operator = spuMem.ub[p+1];

      if (operator === 3 || operator === 7) { // Termination
        return;
      }
      if (operator === 6) { // Repeat
        chn.raddr = chn.size;
      }

      // Advance Buffer
      p+=16;
    }
  }

  function decodeStream() {
    for (var n=0; n<MAX_CHANNELS; n++) {
      var chn = spuVoices[n];
      
      // Channel on?
      if (chn.on === false) {
        continue;
      }

      for (var i=0; i<SBUF_SIZE; i++) {
        chn.count += chn.freq;
        if (chn.count >= SAMPLE_RATE) {
          chn.pos += (chn.count/SAMPLE_RATE) | 0;
          chn.count %= SAMPLE_RATE;
        }

        // Mix Channel Samples
        if (stereo) {
          sbuf.temp[i] += chn.buffer.sh[chn.pos] * (chn.volume.l/MAX_VOLUME);
          sbuf.temp[i+SBUF_SIZE] += -chn.buffer.sh[chn.pos] * (chn.volume.r/MAX_VOLUME);
        }
        else {
          sbuf.temp[i] += chn.buffer.sh[chn.pos] * ((chn.volume.l+chn.volume.r)/2)/MAX_VOLUME;
        }

        // End of Sample
        if (chn.pos >= chn.size) {
          if (chn.raddr > 0) { // Repeat?
            chn.pos = chn.raddr;
            chn.count = 0;
            continue;
          }
          chn.on = false;
          break;
        }
      }
    }
    // Volume Mix
    for (var i=0; i<SBUF_SIZE; i++) {
      if (stereo) {
        sbuf.final[i] = (sbuf.temp[i]/4) * (spuVolumeL/MAX_VOLUME);
        sbuf.final[i+SBUF_SIZE] = -(sbuf.temp[i+SBUF_SIZE]/4) * (spuVolumeR/MAX_VOLUME);
      }
      else {
        sbuf.final[i] = (sbuf.temp[i]/4) * ((spuVolumeL+spuVolumeR)/2)/MAX_VOLUME;
      }
    }

    // Clear
    ioZero(sbuf.temp);
    return sbuf.final;
  }

  function voiceOn(data) {
    for (var n=0; n<MAX_CHANNELS; n++) {
      if (data&(1<<n)) {
        spuVoices[n].on    = true;
        spuVoices[n].count = 0;
        spuVoices[n].pos   = 0;
        spuVoices[n].raddr = 0;
        spuVoices[n].size  = 0;

        //ioZero(spuVoices[n].buffer.sh);
        depackVAG(spuVoices[n]);
      }
    }
  }

  function voiceOff(data) {
    for (var n=0; n<MAX_CHANNELS; n++) {
      if (data&(1<<n)) {
        spuVoices[n].on = false;
      }
    }
  }

  function setVolume(data) {
    var ret = data;

    if (data&0x8000) {
      if (data&0x1000) {
        ret ^= 0xffff;
      }
      ret = ((ret&0x7f)+1)/2;
      ret += ret/(2*((data&0x2000) ? -1 : 1));
      ret *= 128;
    }
    else {
      if (data&0x4000) {
        ret = 0x3fff-(data&0x3fff);
      }
    }
    return ret&0x3fff;
  }

  var dataMem = {
    write(addr, size) {
      while (size-- > 0) {
        spuMem.uh[spuAddr>>>1] = directMemH(ram.uh, addr); addr+=2;
        spuAddr+=2;
        spuAddr&=0x3ffff;
      }
    },

    read(addr, size) {
      while (size-- > 0) {
        directMemH(ram.uh, addr) = spuMem.uh[spuAddr>>>1]; addr+=2;
        spuAddr+=2;
        spuAddr&=0x3ffff;
      }
    }
  };

  return {
    awake: function() {
      spuMem = union(1024*256*2);

      sbuf = {
        temp : new SintWcap(SBUF_SIZE*2),
        final: new SintHcap(SBUF_SIZE*2),
      };

      // Initialize Web Audio
      ctxAudio  = new (window.AudioContext || window.webkitAudioContext)();
      ctxScript = ctxAudio.createScriptProcessor(SBUF_SIZE, 0, stereo ? 2 : 1);

      // Callback
      ctxScript.onaudioprocess = function(e) {
        var output = e.outputBuffer;
        var float  = int16ToFloat32(decodeStream());

        if (stereo) {
          output.fetchChannelData(0).set(float.slice(0, SBUF_SIZE));
          output.fetchChannelData(1).set(float.slice(SBUF_SIZE));
        }
        else {
          output.fetchChannelData(0).set(float.slice(0, SBUF_SIZE));
        }
      };

      // Touch Devices
      // window.addEventListener('touchstart', function() {
      //   var buffer = ctxAudio.createBuffer(1, 1, 22050);
      //   var source = ctxAudio.createBufferSource();
      //   source.buffer = buffer;
      //   source.connect(ctxAudio.destination);
      //   source.noteOn(0);
      // }, false);
    },

    reset: function() {
      ioZero(spuMem.uh);
      ioZero(sbuf.temp);
      ioZero(sbuf.final);

      // Variables
      spuAddr = ~0;
      spuVolumeL = MAX_VOLUME;
      spuVolumeR = MAX_VOLUME;

      // Channels
      for (var n=0; n<MAX_CHANNELS; n++) {
        spuVoices[n] = {
          buffer : union(USHRT_MAX*2),
          count  : 0,
          freq   : 0,
          on     : false,
          pos    : 0,
          raddr  : 0,
          saddr  : 0,
          size   : 0,
          volume : {
            l: 0, r: 0
          }
        };

        ioZero(spuVoices[n].buffer.sh);
      }

      // Connect
      ctxScript.disconnect();
      ctxScript.connect(ctxAudio.destination);
    },

    scopeW: function(addr, data) {
      spuAcc(addr) = data;

      // Channels
      if (addr >= 0x1c00 && addr <= 0x1d7e) {
        var n = spuChannel(addr);

        switch(addr&0xf) {
          case 0x0: // Volume L
            spuVoices[n].volume.l = setVolume(data);
            return;

          case 0x2: // Volume R
            spuVoices[n].volume.r = setVolume(data);
            return;

          case 0x4: // Pitch
            spuVoices[n].freq = Math.max((data*SAMPLE_RATE)/4096, 1);
            return;

          case 0x6: // Sound Address
            spuVoices[n].saddr = (data<<3)>>>0;
            return;

          case 0xe: // Return Address
            spuVoices[n].raddr = (data<<3)>>>0;
            return;

          /* unused */
          case 0x8:
          case 0xa:
          case 0xc:
            return;
        }
        psx.error('SPU scopeW < 0x1d80 '+(hex(addr))+' <- '+hex(data));
      }

      // Reverb
      if (addr >= 0x1dc0 && addr <= 0x1dfe) {
        return;
      }

      // HW
      switch(addr) {
        case 0x1da0:
        case 0x1da4: // ???
        case 0x1dae:
        case 0x1db8:
        case 0x1dba:
        case 0x1dbc:
        case 0x1dbe:
          return;

        case 0x1d80: // Volume L
          spuVolumeL = setVolume(data);
          return;

        case 0x1d82: // Volume R
          spuVolumeR = setVolume(data);
          return;

        case 0x1d88: // Sound On 1
          voiceOn(data);
          return;

        case 0x1d8a: // Sound On 2
          voiceOn(data<<16);
          return;

        case 0x1d8c: // Sound Off 1
          voiceOff(data);
          return;

        case 0x1d8e: // Sound Off 2
          voiceOff(data<<16);
          return;

        case 0x1da6: // Transfer Address
          spuAddr = (data<<3)>>>0;
          return;

        case 0x1da8: // Data
          spuMem.uh[spuAddr>>>1] = data;
          spuAddr+=2;
          spuAddr&=0x3ffff;
          return;

        case 0x1daa: // Control
          return;

        case 0x1d84: // Reverb Volume L
        case 0x1d86: // Reverb Volume R
        case 0x1d90: // FM Mode On 1
        case 0x1d92: // FM Mode On 2
        case 0x1d94: // Noise Mode On 1
        case 0x1d96: // Noise Mode On 2
        case 0x1d98: // Reverb Mode On 1
        case 0x1d9a: // Reverb Mode On 2
        case 0x1d9c: // Mute 1
        case 0x1d9e: // Mute 2
        case 0x1da2: // Reverb Address
        case 0x1dac:
        case 0x1db0: // CD Volume L
        case 0x1db2: // CD Volume R
        case 0x1db4:
        case 0x1db6:
          return;
      }
      psx.error('SPU scopeW '+hex(addr)+' <- '+hex(data));
    },

    scopeR: function(addr) {
      // Channels
      if (addr >= 0x1c00 && addr <= 0x1d7e) {
        switch(addr&0xf) {
          case 0x0:
          case 0x2:
          case 0x4:
          case 0x6:
          case 0x8:
          case 0xa:
          case 0xc:
          case 0xe:
            return spuAcc(addr);
        }
        psx.error('SPU scopeR phase '+hex(addr&0xf));
      }

      // HW
      switch(addr) {
        //case 0x1da4:
        case 0x1db0:
        case 0x1db2:
        case 0x1db4:
        case 0x1db6:
        case 0x1d80:
        case 0x1d82:
        case 0x1d90:
        case 0x1d92: // ???
          return spuAcc(addr);

        case 0x1da6: // Transfer Address
          return spuAddr>>>3;

        case 0x1d88: // Sound On 1
        case 0x1d8a: // Sound On 2
        case 0x1d8c: // Sound Off 1
        case 0x1d8e: // Sound Off 2
        case 0x1d94: // Noise Mode On 1
        case 0x1d96: // Noise Mode On 2
        case 0x1d98: // Reverb Mode On 1
        case 0x1d9a: // Reverb Mode On 2
        case 0x1d9c: // Voice Status 0 - 15
        case 0x1daa: // Control
        case 0x1dac: // ?
        case 0x1dae: // Status
        case 0x1db8:
        case 0x1dba:
        case 0x1e00:
        case 0x1e02:
        case 0x1e04:
        case 0x1e06:
        case 0x1e08:
        case 0x1e0a:
        case 0x1e0c:
        case 0x1e0e:
          return spuAcc(addr);
      }
      psx.error('SPU scopeR -> '+(hex(addr)));
      return 0;
    },

    executeDMA: function(addr) {
      var size = (bcr>>16)*(bcr&0xffff)*2;

      switch(chcr) {
        case 0x01000201: // Write DMA Mem
          dataMem.write(madr, size);
          return;

        case 0x01000200:
          dataMem.read(madr, size);
          return;
      }
      psx.error('SPU DMA case '+hex(chcr));
    }
  };
})();

#undef ram
#undef hwr
