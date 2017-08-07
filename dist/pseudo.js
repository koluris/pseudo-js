



// Preprocessor






// A kind of helper for various data manipulation
function union(size) {
  var bfr = new ArrayBuffer(size);

  return {
    uw: new Uint32Array(bfr),
    uh: new Uint16Array(bfr),
    ub: new Uint8Array (bfr),

    sw: new Int32Array(bfr),
    sh: new Int16Array(bfr),
    sb: new Int8Array (bfr),
  };
}

// Declare our namespace
'use strict';
var pseudo = window.pseudo || {};











































// Assume NTSC for now






// This is uttermost experimental, it's the Achilles' heel

































































// Console output



// Format to Hexadecimal



// Arithmetic operations













































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
    var output = new Float32Array(input.byteLength/2);
    
    for (var i=0; i<input.byteLength/2; i++) {
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
        res = Math.min(Math.max(res, -32768), 32767);
        chn.buffer.sh[chn.size++] = res;

        // Overflow
        if (chn.size === 65536) {
          pseudo.CstrMips.consoleWrite('error', 'SPU Channel size overflow > '+65536);
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
    for (var n=0; n<24; n++) {
      var chn = spuVoices[n];
      
      // Channel on?
      if (chn.on === false) {
        continue;
      }

      for (var i=0; i<1024; i++) {
        chn.count += chn.freq;
        if (chn.count >= 44100) {
          chn.pos += (chn.count/44100) | 0;
          chn.count %= 44100;
        }

        // Mix Channel Samples
        if (stereo) {
          sbuf.temp[i] += chn.buffer.sh[chn.pos] * (chn.volume.l/0x3fff);
          sbuf.temp[i+1024] += -chn.buffer.sh[chn.pos] * (chn.volume.r/0x3fff);
        }
        else {
          sbuf.temp[i] += chn.buffer.sh[chn.pos] * ((chn.volume.l+chn.volume.r)/2)/0x3fff;
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
    for (var i=0; i<1024; i++) {
      if (stereo) {
        sbuf.final[i] = (sbuf.temp[i]/4) * (spuVolumeL/0x3fff);
        sbuf.final[i+1024] = -(sbuf.temp[i+1024]/4) * (spuVolumeR/0x3fff);
      }
      else {
        sbuf.final[i] = (sbuf.temp[i]/4) * ((spuVolumeL+spuVolumeR)/2)/0x3fff;
      }
    }

    // Clear
    sbuf.temp.fill(0);
    return sbuf.final;
  }

  function voiceOn(data) {
    for (var n=0; n<24; n++) {
      if (data&(1<<n)) {
        spuVoices[n].on    = true;
        spuVoices[n].count = 0;
        spuVoices[n].pos   = 0;
        spuVoices[n].raddr = 0;
        spuVoices[n].size  = 0;

        //spuVoices[n].buffer.sh.fill(0);
        depackVAG(spuVoices[n]);
      }
    }
  }

  function voiceOff(data) {
    for (var n=0; n<24; n++) {
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
        spuMem.uh[spuAddr>>>1] = pseudo.CstrMem.__ram.uh[(( addr)&(pseudo.CstrMem.__ram.uh.byteLength-1))>>>1]; addr+=2;
        spuAddr+=2;
        spuAddr&=0x3ffff;
      }
    },

    read(addr, size) {
      while (size-- > 0) {
        pseudo.CstrMem.__ram.uh[(( addr)&(pseudo.CstrMem.__ram.uh.byteLength-1))>>>1] = spuMem.uh[spuAddr>>>1]; addr+=2;
        spuAddr+=2;
        spuAddr&=0x3ffff;
      }
    }
  };

  return {
    awake: function() {
      spuMem = union(1024*256*2);

      sbuf = {
        temp : new Int32Array(1024*2),
        final: new Int16Array(1024*2),
      };

      // Initialize Web Audio
      ctxAudio  = new (window.AudioContext || window.webkitAudioContext)();
      ctxScript = ctxAudio.createScriptProcessor(1024, 0, stereo ? 2 : 1);

      // Callback
      ctxScript.onaudioprocess = function(e) {
        var output = e.outputBuffer;
        var float  = int16ToFloat32(decodeStream());

        if (stereo) {
          output.getChannelData(0).set(float.slice(0, 1024));
          output.getChannelData(1).set(float.slice(1024));
        }
        else {
          output.getChannelData(0).set(float.slice(0, 1024));
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
      spuMem.uh.fill(0);
      sbuf.temp.fill(0);
      sbuf.final.fill(0);

      // Variables
      spuAddr = ~0;
      spuVolumeL = 0x3fff;
      spuVolumeR = 0x3fff;

      // Channels
      for (var n=0; n<24; n++) {
        spuVoices[n] = {
          buffer : union(65536*2),
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

        spuVoices[n].buffer.sh.fill(0);
      }

      // Connect
      ctxScript.disconnect();
      ctxScript.connect(ctxAudio.destination);
    },

    scopeW: function(addr, data) {
      pseudo.CstrMem.__hwr.uh[((addr)&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] = data;

      // Channels
      if (addr >= 0x1c00 && addr <= 0x1d7e) {
        var n = (addr>>>4)&0x1f;

        switch(addr&0xf) {
          case 0x0: // Volume L
            spuVoices[n].volume.l = setVolume(data);
            return;

          case 0x2: // Volume R
            spuVoices[n].volume.r = setVolume(data);
            return;

          case 0x4: // Pitch
            spuVoices[n].freq = Math.max((data*44100)/4096, 1);
            return;

          case 0x6: // Sound Address
            spuVoices[n].saddr = (data<<3)>>>0;
            return;

          case 0xe: // Return Address
            spuVoices[n].raddr = (data<<3)>>>0;
            return;

          
          case 0x8:
          case 0xa:
          case 0xc:
            return;
        }
        pseudo.CstrMain.error('SPU scopeW < 0x1d80 '+(('0x'+(addr>>>0).toString(16)))+' <- '+('0x'+(data>>>0).toString(16)));
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
      pseudo.CstrMain.error('SPU scopeW '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
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
            return pseudo.CstrMem.__hwr.uh[((addr)&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1];
        }
        pseudo.CstrMain.error('SPU scopeR phase '+('0x'+(addr&0xf>>>0).toString(16)));
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
          return pseudo.CstrMem.__hwr.uh[((addr)&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1];

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
          return pseudo.CstrMem.__hwr.uh[((addr)&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1];
      }
      pseudo.CstrMain.error('SPU scopeR -> '+(('0x'+(addr>>>0).toString(16))));
      return 0;
    },

    executeDMA: function(addr) {
      var size = (pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|4)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]>>16)*(pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|4)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&0xffff)*2;

      switch(pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|8)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]) {
        case 0x01000201: // Write DMA Mem
          dataMem.write(pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2], size);
          return;

        case 0x01000200:
          dataMem.read(pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2], size);
          return;
      }
      pseudo.CstrMain.error('SPU DMA case '+('0x'+(pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|8)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]>>>0).toString(16)));
    }
  };
})();








pseudo.CstrBus = (function() {
  var interrupts = [{
    code: 0,
    target: 1
  }, {
    code: 1,
    target: 1
  }, {
    code: 2,
    target: 4
  }, {
    code: 3,
    target: 1
  }, {
    code: 4,
    target: 1
  }, {
    code: 5,
    target: 1
  }, {
    code: 6,
    target: 1
  }, {
    code: 7,
    target: 8
  }, {
    code: 8,
    target: 8
  }, {
    code: 9,
    target: 1
  }, {
    code: 10,
    target: 1
  }];

  // Exposed class functions/variables
  return {
    reset() {
      for (var item of interrupts) {
        item.queued = 0;
      }
    },

    interruptsUpdate() { // A method to schedule when IRQs should fire
      for (var item of interrupts) {
        if (item.queued) {
          if (item.queued++ === item.target) {
            pseudo.CstrMem.__hwr.uh[((0x1070)&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] |= (1<<item.code);
            item.queued = 0;
            break;
          }
        }
      }
    },

    interruptSet(n) {
      interrupts[n].queued = 1;
    },

    checkDMA(addr, data) {
      var chan = ((addr>>>4)&0xf) - 8;

      if (pseudo.CstrMem.__hwr.uw[((0x10f0)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&(8<<(chan*4))) { // GPU does not execute sometimes
        pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|8)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2] = data;

        switch(chan) {
          case 0: // MDEC in
          case 1: // MDEC out
            break;

          case 2: pseudo.CstrGraphics   .executeDMA(addr); break; // Graphics
          case 3: pseudo.CstrCdrom.executeDMA(addr); break; // CD-ROM
          case 4: pseudo.CstrAudio.executeDMA(addr); break; // Audio
          case 6: pseudo.CstrMem  .executeDMA(addr); break; // Clear OT

          default:
            pseudo.CstrMain.error('DMA Channel '+chan);
            break;
        }
        pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|8)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2] = data & ~0x01000000;

        if (pseudo.CstrMem.__hwr.uw[((0x10f4)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&(1<<(16+chan))) {
          pseudo.CstrMem.__hwr.uw[((0x10f4)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2] |= 1<<(24+chan);
          pseudo.CstrBus.interruptSet(3);
        }
      }
    }
  };
})();
































































pseudo.CstrCdrom = (function() {
  // HTML elements
  var divBlink, divKb;

  var ctrl, mode, stat, statP, re2;
  var occupied, reads, seeked, readed;
  var irq, cdint, cdreadint;
  var kbRead;

  var param = {
    data: new Uint8Array(8),
    p: undefined,
    c: undefined
  };

  var res = {
    data: new Uint8Array(8),
    tn: new Uint8Array(6),
    td: new Uint8Array(4),
    p: undefined,
    c: undefined,
    ok: undefined
  };

  var sector = {
    data: new Uint8Array(4),
    prev: new Uint8Array(4)
  };

  var transfer = {
    data: new Uint8Array(2352),
    p: 0
  };

  function resetParam(prm) {
    prm.data.fill(0);
    prm.p = 0;
    prm.c = 0;
  }

  function resetRes(rrs) {
    rrs.data.fill(0);
    rrs.tn.fill(0);
    rrs.td.fill(0);
    rrs.p = 0;
    rrs.c = 0;
    rrs.ok = 0;
  }

  function resetSect(sect) {
    sect.data.fill(0);
    sect.prev.fill(0);
  }

  function trackRead() {
    sector.prev[0] = (parseInt((sector.data[0])/10) * 16 + (sector.data[0])%10);
    sector.prev[1] = (parseInt((sector.data[1])/10) * 16 + (sector.data[1])%10);
    sector.prev[2] = (parseInt((sector.data[2])/10) * 16 + (sector.data[2])%10);

    pseudo.CstrMain.trackRead(sector.prev);
  }

  function addIrqQueue(code) {
    irq = code;

    if (stat) {
    }
    else {
      cdint = 1;
    }
  }

  function interrupt() {
    var prevIrq = irq;

    if (stat) {
      cdint = 1;
      return;
    }

    irq = 0xff;
    ctrl &= ~0x80;

    switch(prevIrq) {
      case 1: // CdlNop
        res.p = 0; res.c = 1; res.ok = 1;
        statP |= 0x2;
        res.data[0] = statP;
        stat = 3; //More stuff here...
        res.data[0] |= 0x2;
        break;

      case 2: // CdlSetLoc
      case 11: // CdlMute
      case 12: // CdlDemute
      case 13: // CdlSetFilter
      case 14: // CdlSetMode
      case 15: // CdlGetParam ???
        res.p = 0; res.c = 1; res.ok = 1;
        statP |= 0x02;
        res.data[0] = statP;
        stat = 3;
        break;

      case 3: // CdlStart
        res.p = 0; res.c = 1; res.ok = 1;
        statP |= 0x02;
        res.data[0] = statP;
        stat = 3;
        statP |= 0x80;
        break;

      case 7: // CdlIdle
        res.p = 0; res.c = 1; res.ok = 1;
        statP |= 0x2;
        res.data[0] = statP;
        stat = 2;
        break;

      case 9: // CdlPause
        res.p = 0; res.c = 1; res.ok = 1;
        res.data[0] = statP;
        stat = 3;
        addIrqQueue(9 + 0x20);
        ctrl |= 0x80;
        break;

      case 9 + 0x20: // CdlPause
        res.p = 0; res.c = 1; res.ok = 1;
        statP &= ~0x20;
        statP |= 0x02;
        res.data[0] = statP;
        stat = 2;
        break;

      case 10: // CdlInit
        res.p = 0; res.c = 1; res.ok = 1;
        statP |= 0x02;
        res.data[0] = statP;
        stat = 3;
        addIrqQueue(10 + 0x20);
        break;

      case 10 + 0x20: // CdlInit
        res.p = 0; res.c = 1; res.ok = 1;
        res.data[0] = statP;
        stat = 2;
        break;

      case 16: // CdlGetLocL
        {
          res.p = 0; res.c = 8; res.ok = 1;
          for (var i=0; i<8; i++) {
            res.data[i] = transfer.data[i];
          }
          stat = 3;
        }
        break;

      case 17: // CdlGetLocP
        res.p = 0; res.c = 8; res.ok = 1;
        res.data[0] = 1;
        res.data[1] = 1;

        res.data[2] = (parseInt((sector.prev[0])/16) * 10 + (sector.prev[0])%16);
        res.data[3] = (parseInt((sector.prev[1])/16) * 10 + (sector.prev[1])%16)-2;
        res.data[4] = sector.prev[2];

        if (((res.data[3])<<24>>24) < 0) {
            res.data[3] += 60;
            res.data[2] -= 1;
        }

        res.data[2] = (parseInt((res.data[2])/10) * 16 + (res.data[2])%10);
        res.data[3] = (parseInt((res.data[3])/10) * 16 + (res.data[3])%10);

        res.data[5] = sector.prev[0];
        res.data[6] = sector.prev[1];
        res.data[7] = sector.prev[2];
        
        stat = 3;
        break;

      case 19: // CdlGetTN
        res.p = 0; res.c = 3; res.ok = 1;
        statP |= 0x02;
        res.data[0] = statP;
        //pseudo.CstrMain.fetchTN(res.tn);
        res.tn[0] = 1;
        res.tn[1] = 1;
        stat = 3;
        res.data[1] = (parseInt((res.tn[0])/10) * 16 + (res.tn[0])%10);
        res.data[2] = (parseInt((res.tn[1])/10) * 16 + (res.tn[1])%10);
        break;

      case 20: // CdlGetTD
        res.p = 0; res.c = 4; res.ok = 1;
        statP |= 0x02;
        //iso.fetchTD(res.td);
        res.td[0] = 0;
        res.td[1] = 2;
        res.td[2] = 0;
        stat = 3;
        res.data[0] = statP;
        res.data[1] = (parseInt((res.td[2])/10) * 16 + (res.td[2])%10);
        res.data[2] = (parseInt((res.td[1])/10) * 16 + (res.td[1])%10);
        res.data[3] = (parseInt((res.td[0])/10) * 16 + (res.td[0])%10);
        break;

      case 21: // CdlSeekL
        res.p = 0; res.c = 1; res.ok = 1;
        statP |= 0x02;
        res.data[0] = statP;
        statP |= 0x40;
        stat = 3;
        seeked = 1;
        addIrqQueue(21 + 0x20);
        break;

      case 21 + 0x20: // CdlSeekL
        res.p = 0; res.c = 1; res.ok = 1;
        statP |= 0x02;
        statP &= ~0x40;
        res.data[0] = statP;
        stat = 2;
        break;

      case 22: // CdlSeekP
        res.p = 0; res.c = 1; res.ok = 1;
        statP |= 0x2;
        res.data[0] = statP;
        statP |= 0x40;
        stat = 3;
        addIrqQueue(22 + 0x20);
        break;

      case 22 + 0x20: // CdlSeekP
        res.p = 0; res.c = 1; res.ok = 1;
        statP |= 0x2;
        statP &= ~0x40;
        res.data[0] = statP;
        stat = 2;
        break;

      case 25: // CdlTest
        stat = 3;

        switch(param.data[0]) {
          case 0x20:
            {
              res.p = 0; res.c = 4; res.ok = 1;

              var test20 = [0x98, 0x06, 0x10, 0xc3];
              res.data.set(test20);
            }
            break;

          case 0x04:
          case 0x05:
            break;

          default:
            pseudo.CstrMain.error("CdlTest param.data[0] -> "+('0x'+(param.data[0]>>>0).toString(16)));
            break;
        }
        break;

      case 26: // CdlId
        res.p = 0; res.c = 1; res.ok = 1;
        statP |= 0x02;
        res.data[0] = statP;
        stat = 3;
        addIrqQueue(26 + 0x20);
        break;

      case 26 + 0x20: // CdlId
        res.p = 0; res.c = 8; res.ok = 1;
        res.data[0] = 0x00; //More stuff here...
        res.data[1] = 0x00; // |= 0x80 for BIOS shell
        res.data[2] = 0x00;
        res.data[3] = 0x00;
        stat = 2;
        break;

      case 30: // CdlReadToc
        res.p = 0; res.c = 1; res.ok = 1;
        statP |= 0x02;
        res.data[0] = statP;
        stat = 3;
        addIrqQueue(30 + 0x20);
        break;

      case 30 + 0x20: // CdlReadToc
        res.p = 0; res.c = 1; res.ok = 1;
        statP |= 0x02;
        res.data[0] = statP;
        stat = 2;
        break;

      case 250:
        if (!reads) {
          pseudo.CstrMain.error('READ_ACK !reads');
        }
        res.p = 0; res.c = 1; res.ok = 1;
        statP |= 0x02;
        res.data[0] = statP;

        if (!seeked) {
          seeked = 1;
          statP |= 0x40;
        }
        statP |= 0x20;
        stat = 3;
        cdreadint = 1;
        break;

      default:
        pseudo.CstrMain.error('CD prevIrq -> '+prevIrq);
        break;
    }
    if (stat !== 0 && re2 !== 0x18) {
      pseudo.CstrBus.interruptSet(2);
    }
  }

  function interruptRead() {
    if (!reads) {
      return;
    }

    if (stat) {
      cdreadint = 1;
      return;
    }
    occupied = 1;
    res.p = 0; res.c = 1; res.ok = 1;
    statP |= 0x22;
    statP &= ~0x40;
    res.data[0] = statP;

    pseudo.CstrMips.pause();
    trackRead();
    divBlink.css({ 'background':'#f5cb0f' });
  }

  return {
    interruptRead2(buf) {
      kbRead += buf.byteLength;
      transfer.data.set(buf);
      stat = 1;

      if (++sector.data[2] >= 75) {
        sector.data[2] = 0;
        
        if (++sector.data[1] >= 60) {
          sector.data[1] = 0;
          sector.data[0]++;
        }
      }
      readed = 0;

      if ((transfer.data[4+2]&0x80) && (mode&0x02)) {
        addIrqQueue(9); // CdlPause
      }
      else {
        cdreadint = 1;
      }
      pseudo.CstrBus.interruptSet(2);

      pseudo.CstrMips.resume();
      divBlink.css({ 'background':'transparent' });
      divKb.innerText = Math.round(kbRead/1024)+' kb';
    },

    awake(blink, kb) {
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

      ctrl = stat = statP = re2 = 0;
      occupied = readed = reads = seeked = muted = 0;
      irq = cdint = cdreadint = 0;
      mode = 0;
      kbRead = 0;
    },

    update() {
      if (cdint) {
        if (cdint++ >= 16) {
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
          ctrl = data | (ctrl & ~0x03);

          if (!data) {
            param.p = 0;
            param.c = 0;
            res.ok  = 0;
          }
          break;

        case 1:
          occupied = 0;
  
          if (ctrl&0x01) {
            return;
          }
      
          switch(data) {
            case 1: // CdlNop
            case 3: // CdlStart
            case 13: // CdlSetFilter
            case 15: // CdlGetParam ???
            case 16: // CdlGetLocL
            case 17: // CdlGetLocP
            case 19: // CdlGetTN
            case 20: // CdlGetTD
            case 21: // CdlSeekL
            case 22: // CdlSeekP
            case 25: // CdlTest
            case 26: // CdlId
            case 30: // CdlReadToc
              ctrl |= 0x80; stat = 0; addIrqQueue(data);
              break;

            case 2: // CdlSetLoc
              {
                if (reads) { reads = 0; } statP &= ~0x20;
                seeked = 0;

                for (var i=0; i<3; i++) {
                  sector.data[i] = (parseInt((param.data[i])/16) * 10 + (param.data[i])%16);
                }
                sector.data[3] = 0;
                ctrl |= 0x80; stat = 0; addIrqQueue(data);
              }
              break;

            case 6: // CdlReadN
            case 27: // CdlReadS
              irq = 0;
              if (reads) { reads = 0; } statP &= ~0x20;
              ctrl |= 0x80;
              stat = 0;
              reads = 1; readed = 0xff; addIrqQueue(250);
              break;

            case 7: // CdlInit
            case 9: // CdlPause
            case 10: // CdlInit
              if (reads) { reads = 0; } statP &= ~0x20;
              ctrl |= 0x80; stat = 0; addIrqQueue(data);
              break;

            case 11: // CdlMute
              muted = 1;
              ctrl |= 0x80; stat = 0; addIrqQueue(data);
              break;

            case 12: // CdlDemute
              muted = 0;
              ctrl |= 0x80; stat = 0; addIrqQueue(data);
              break;

            case 14: // CdlSetMode
              mode = param.data[0];
              ctrl |= 0x80; stat = 0; addIrqQueue(data);
              break;

            default:
              pseudo.CstrMain.error('CD W 0x1801 data -> '+data);
              break;
          }

          if (stat !== 0) {
            pseudo.CstrBus.interruptSet(2);
          }
          break;

        case 2:
          if (ctrl&0x01) {
            switch(data) {
              case 7:
                param.p = 0;
                param.c = 0;
                res.ok  = 1;
                ctrl &= ~0x03;
                break;

              case 0:
              case 1:
              case 24:
              case 31:
                re2 = data;
                break;
                
              default:
                pseudo.CstrMain.error('CD W 0x1802 case 1 -> '+data);
                break;
            }
          }
          else if (!(ctrl&0x01) && param.p < 8) {
            param.data[param.p++] = data;
            param.c++;
          }
          break;

        case 3:
          if (data === 0x07 && ctrl&0x01) {
            stat = 0;

            if (irq === 0xff) {
              irq = 0;
              return;
            }

            if (irq) {
              cdint = 1;
            }

            if (reads && !res.ok) {
              cdreadint = 1;
            }
            return;
          }
          
          if (data === 0x80 && !(ctrl&0x01) && readed === 0) {
            readed = 1;
            transfer.p = 0;

            switch(mode&0x30) {
              case 0x00:
                transfer.p += 12;
                break;

              case 0x20:
                break;

              default:
                pseudo.CstrMain.error('mode&0x30 -> '+('0x'+(mode&0x30>>>0).toString(16)));
                break;
            }
          }
          break;
      }
    },

    scopeR(addr) {
      switch(addr&0xf) {
        case 0:
          if (res.ok) {
            ctrl |= 0x20;
          }
          else {
            ctrl &= ~0x20;
          }
          
          if (occupied) {
            ctrl |= 0x40;
          }
          ctrl |= 0x18;
          return pseudo.CstrMem.__hwr.ub[((0x1800|0)&(pseudo.CstrMem.__hwr.ub.byteLength-1))>>>0] = ctrl;

        case 1:
          if (res.ok) {
            pseudo.CstrMem.__hwr.ub[((0x1800|1)&(pseudo.CstrMem.__hwr.ub.byteLength-1))>>>0] = res.data[res.p++];

            if (res.p === res.c) {
              res.ok = 0;
            }
          }
          else {
            pseudo.CstrMem.__hwr.ub[((0x1800|1)&(pseudo.CstrMem.__hwr.ub.byteLength-1))>>>0] = 0;
          }
          return pseudo.CstrMem.__hwr.ub[((0x1800|1)&(pseudo.CstrMem.__hwr.ub.byteLength-1))>>>0];

        case 2:
          if (!readed) {
            pseudo.CstrMain.error('CD R !readed');
            return 0;
          }
          return transfer.data[transfer.p++];

        case 3:
          if (stat) {
            if (ctrl&0x01) {
              pseudo.CstrMem.__hwr.ub[((0x1800|3)&(pseudo.CstrMem.__hwr.ub.byteLength-1))>>>0] = stat | 0xe0;
            }
            else {
              pseudo.CstrMem.__hwr.ub[((0x1800|3)&(pseudo.CstrMem.__hwr.ub.byteLength-1))>>>0] = 0xff;
            }
          }
          else {
            pseudo.CstrMem.__hwr.ub[((0x1800|3)&(pseudo.CstrMem.__hwr.ub.byteLength-1))>>>0] = 0;
          }
          return pseudo.CstrMem.__hwr.ub[((0x1800|3)&(pseudo.CstrMem.__hwr.ub.byteLength-1))>>>0];
      }
    },

    executeDMA(addr) {
      var size = (pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|4)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&0xffff) * 4;

      switch(pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|8)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]) {
        case 0x11000000:
        case 0x11400100:
          if (!readed) {
            break;
          }
          
          for (var i=0; i<size; i++) {
            pseudo.CstrMem.__ram.ub[(( i + pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2])&(pseudo.CstrMem.__ram.ub.byteLength-1))>>>0] = transfer.data[i + transfer.p];
          }
          transfer.p += size;
          break;

        case 0: // ???
          break;

        default:
          pseudo.CstrMain.error('CD DMA -> '+('0x'+(pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|8)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]>>>0).toString(16)));
          break;
      }
    }
  };
})();





// 32-bit accessor



// 16-bit accessor



// 08-bit accessor



// Cop2c


// Cop2d










// General




















pseudo.CstrCop2 = (function() {
  var cop2c = union(32*4);
  var cop2d = union(32*4);

  return {
    reset() {
      cop2c.ub.fill(0);
      cop2d.ub.fill(0);
    },

    execute(code) {
      switch(code&0x3f) {
        case 0: // BASIC
          switch(((code>>>21)&0x1f)&7) {
            case 0: // MFC2
              pseudo.CstrMips.setbase(((code>>>16)&0x1f), pseudo.CstrCop2.opcodeMFC2(((code>>>11)&0x1f)));
              return;

            case 2: // CFC2
              pseudo.CstrMips.setbase(((code>>>16)&0x1f), cop2c.uw[( ((code>>>11)&0x1f))]);
              return;

            case 4: // MTC2
              pseudo.CstrCop2.opcodeMTC2(((code>>>11)&0x1f), pseudo.CstrMips.readbase(((code>>>16)&0x1f)));
              return;

            case 6: // CTC2
              pseudo.CstrCop2.opcodeCTC2(((code>>>11)&0x1f), pseudo.CstrMips.readbase(((code>>>16)&0x1f)));
              return;
          }
          pseudo.CstrMain.error('COP2 Basic '+(((code>>>21)&0x1f)&7));
          return;

        case 1: // RTPS
          {
            cop2c.uw[(31)] = 0;

            cop2d.sw[(25)] = ((cop2c.sh[(0<<1)+0]*cop2d.sh[(0<<1)+0]+cop2c.sh[(0<<1)+1]*cop2d.sh[(0<<1)+1]+cop2c.sh[(1<<1)+0]*cop2d.sh[(1<<1)+0])>>12)+cop2c.sw[(5)];
            cop2d.sw[(26)] = ((cop2c.sh[(1<<1)+1]*cop2d.sh[(0<<1)+0]+cop2c.sh[(2<<1)+0]*cop2d.sh[(0<<1)+1]+cop2c.sh[(2<<1)+1]*cop2d.sh[(1<<1)+0])>>12)+cop2c.sw[(6)];
            cop2d.sw[(27)] = ((cop2c.sh[(3<<1)+0]*cop2d.sh[(0<<1)+0]+cop2c.sh[(3<<1)+1]*cop2d.sh[(0<<1)+1]+cop2c.sh[(4<<1)+0]*cop2d.sh[(1<<1)+0])>>12)+cop2c.sw[(7)];

            cop2d.sh[(9<<1)+0] = (((cop2d.sw[(25)]) < -32768.0) ? (cop2c.uw[(31)] |= (1<<24), -32768.0) : (((cop2d.sw[(25)]) > 32767.0) ? (cop2c.uw[(31)] |= (1<<24), 32767.0) : ((cop2d.sw[(25)])))); cop2d.sh[(10<<1)+0] = (((cop2d.sw[(26)]) < -32768.0) ? (cop2c.uw[(31)] |= (1<<23), -32768.0) : (((cop2d.sw[(26)]) > 32767.0) ? (cop2c.uw[(31)] |= (1<<23), 32767.0) : ((cop2d.sw[(26)])))); cop2d.sh[(11<<1)+0] = (((cop2d.sw[(27)]) < -32768.0) ? (cop2c.uw[(31)] |= (1<<22), -32768.0) : (((cop2d.sw[(27)]) > 32767.0) ? (cop2c.uw[(31)] |= (1<<22), 32767.0) : ((cop2d.sw[(27)]))));

            cop2d.uh[(16<<1)+0]  = cop2d.uh[(17<<1)+0];
            cop2d.uh[(17<<1)+0]  = cop2d.uh[(18<<1)+0];
            cop2d.uh[(18<<1)+0]  = cop2d.uh[(19<<1)+0];
            cop2d.uh[(19<<1)+0]  = (((cop2d.sw[(27)]) < 0.0) ? (cop2c.uw[(31)] |= (1<<18), 0.0) : (((cop2d.sw[(27)]) > 65535.0) ? (cop2c.uw[(31)] |= (1<<18), 65535.0) : ((cop2d.sw[(27)]))));

            var quotient = cop2c.sh[(26<<1)+0]*4096.0/cop2d.uh[(19<<1)+0];

            cop2d.uw[(12)] = cop2d.uw[(13)];
            cop2d.uw[(13)] = cop2d.uw[(14)];

            cop2d.sh[(14<<1)+0]  = (((((cop2d.sh[(9<<1)+0]*quotient)>>12)+cop2c.sw[(24)]) < -1024.0) ? (cop2c.uw[(31)] |= (1<<14), -1024.0) : (((((cop2d.sh[(9<<1)+0]*quotient)>>12)+cop2c.sw[(24)]) > 1023.0) ? (cop2c.uw[(31)] |= (1<<14), 1023.0) : ((((cop2d.sh[(9<<1)+0]*quotient)>>12)+cop2c.sw[(24)]))));
            cop2d.sh[(14<<1)+1]  = (((((cop2d.sh[(10<<1)+0]*quotient)>>12)+cop2c.sw[(25)]) < -1024.0) ? (cop2c.uw[(31)] |= (1<<13), -1024.0) : (((((cop2d.sh[(10<<1)+0]*quotient)>>12)+cop2c.sw[(25)]) > 1023.0) ? (cop2c.uw[(31)] |= (1<<13), 1023.0) : ((((cop2d.sh[(10<<1)+0]*quotient)>>12)+cop2c.sw[(25)]))));

            cop2d.sw[(24)] = ((cop2c.sh[(27<<1)+0]*quotient)>>12)+cop2c.sw[(28)];
            cop2d.sh[(8<<1)+0]  = (((cop2d.sw[(24)]) < 0.0) ? (cop2c.uw[(31)] |= (1<<12), 0.0) : (((cop2d.sw[(24)]) > 4096.0) ? (cop2c.uw[(31)] |= (1<<12), 4096.0) : ((cop2d.sw[(24)]))));
          }
          return;

        case 48: // RTPT
          {
            var quotient;

            cop2c.uw[(31)] = 0;
            cop2d.uh[(16<<1)+0]  = cop2d.uh[(19<<1)+0];

            for (var v=0; v<3; v++) {
              var v1 = cop2d.sh[((v<<1)+0<<1)+0];
              var v2 = cop2d.sh[((v<<1)+0<<1)+1];
              var v3 = cop2d.sh[((v<<1)+1<<1)+0];

              cop2d.sw[(25)] = ((cop2c.sh[(0<<1)+0]*v1+cop2c.sh[(0<<1)+1]*v2+cop2c.sh[(1<<1)+0]*v3)>>12)+cop2c.sw[(5)];
              cop2d.sw[(26)] = ((cop2c.sh[(1<<1)+1]*v1+cop2c.sh[(2<<1)+0]*v2+cop2c.sh[(2<<1)+1]*v3)>>12)+cop2c.sw[(6)];
              cop2d.sw[(27)] = ((cop2c.sh[(3<<1)+0]*v1+cop2c.sh[(3<<1)+1]*v2+cop2c.sh[(4<<1)+0]*v3)>>12)+cop2c.sw[(7)];

              cop2d.sh[(9<<1)+0] = (((cop2d.sw[(25)]) < -32768.0) ? (cop2c.uw[(31)] |= (1<<24), -32768.0) : (((cop2d.sw[(25)]) > 32767.0) ? (cop2c.uw[(31)] |= (1<<24), 32767.0) : ((cop2d.sw[(25)])))); cop2d.sh[(10<<1)+0] = (((cop2d.sw[(26)]) < -32768.0) ? (cop2c.uw[(31)] |= (1<<23), -32768.0) : (((cop2d.sw[(26)]) > 32767.0) ? (cop2c.uw[(31)] |= (1<<23), 32767.0) : ((cop2d.sw[(26)])))); cop2d.sh[(11<<1)+0] = (((cop2d.sw[(27)]) < -32768.0) ? (cop2c.uw[(31)] |= (1<<22), -32768.0) : (((cop2d.sw[(27)]) > 32767.0) ? (cop2c.uw[(31)] |= (1<<22), 32767.0) : ((cop2d.sw[(27)]))));

              cop2d.uh[(v+17<<1)+0] = (((cop2d.sw[(27)]) < 0.0) ? (cop2c.uw[(31)] |= (1<<18), 0.0) : (((cop2d.sw[(27)]) > 65535.0) ? (cop2c.uw[(31)] |= (1<<18), 65535.0) : ((cop2d.sw[(27)]))));
              quotient = cop2c.sh[(26<<1)+0]*4096.0/cop2d.uh[(v+17<<1)+0];
              
              cop2d.sh[(v+12<<1)+0] = (((((cop2d.sh[(9<<1)+0]*quotient)>>12)+cop2c.sw[(24)]) < -1024.0) ? (cop2c.uw[(31)] |= (1<<14), -1024.0) : (((((cop2d.sh[(9<<1)+0]*quotient)>>12)+cop2c.sw[(24)]) > 1023.0) ? (cop2c.uw[(31)] |= (1<<14), 1023.0) : ((((cop2d.sh[(9<<1)+0]*quotient)>>12)+cop2c.sw[(24)]))));
              cop2d.sh[(v+12<<1)+1] = (((((cop2d.sh[(10<<1)+0]*quotient)>>12)+cop2c.sw[(25)]) < -1024.0) ? (cop2c.uw[(31)] |= (1<<13), -1024.0) : (((((cop2d.sh[(10<<1)+0]*quotient)>>12)+cop2c.sw[(25)]) > 1023.0) ? (cop2c.uw[(31)] |= (1<<13), 1023.0) : ((((cop2d.sh[(10<<1)+0]*quotient)>>12)+cop2c.sw[(25)]))));
            }
            cop2d.sw[(24)] = ((cop2c.sh[(27<<1)+0]*quotient)>>12)+cop2c.sw[(28)];
            cop2d.sh[(8<<1)+0]  = (((cop2d.sw[(24)]) < 0.0) ? (cop2c.uw[(31)] |= (1<<12), 0.0) : (((cop2d.sw[(24)]) > 4096.0) ? (cop2c.uw[(31)] |= (1<<12), 4096.0) : ((cop2d.sw[(24)]))));
          }
          return;
      }
      //pseudo.CstrMips.consoleWrite('error', 'COP2 Execute '+(code&0x3f));
    },

    opcodeMFC2(addr) {
      switch(addr) {
        case  1:
        case  3:
        case  5:
        case  8:
        case  9:
        case 10:
        case 11:
          cop2d.sw[( addr)] = cop2d.sh[( addr<<1)+ 0];
          break;

        case  7:
        case 16:
        case 17:
        case 18:
        case 19:
          cop2d.uw[( addr)] = cop2d.uh[( addr<<1)+ 0];
          break;

        case 15:
          pseudo.CstrMain.error('opcodeMFC2 -> '+addr);
          break;

        case 28:
        case 29:
          cop2d.uw[( addr)] = (((cop2d.sh[(9<<1)+0]>>7) <  0x1f) ? (cop2c.uw[(31)] |= (1<< 0),  0x1f) : (((cop2d.sh[(9<<1)+0]>>7) >  0) ? (cop2c.uw[(31)] |= (1<< 0),  0) : ((cop2d.sh[(9<<1)+0]>>7)))) | ((((cop2d.sh[(10<<1)+0]>>7) <  0x1f) ? (cop2c.uw[(31)] |= (1<< 0),  0x1f) : (((cop2d.sh[(10<<1)+0]>>7) >  0) ? (cop2c.uw[(31)] |= (1<< 0),  0) : ((cop2d.sh[(10<<1)+0]>>7))))<<5) | ((((cop2d.sh[(11<<1)+0]>>7) <  0x1f) ? (cop2c.uw[(31)] |= (1<< 0),  0x1f) : (((cop2d.sh[(11<<1)+0]>>7) >  0) ? (cop2c.uw[(31)] |= (1<< 0),  0) : ((cop2d.sh[(11<<1)+0]>>7))))<<10);
          break;

        case 30:
          return 0;
      }

      return cop2d.uw[( addr)];
    },

    opcodeMTC2(addr, data) {
      switch(addr) {
        case 15:
          cop2d.uw[(12)] = cop2d.uw[(13)];
          cop2d.uw[(13)] = cop2d.uw[(14)];
          cop2d.uw[(14)] = data;
          cop2d.uw[(15)] = data;
          return;

        case 28:
          cop2d.uw[(28)] = data;
          cop2d.sh[(9<<1)+0]  =(data&0x001f)<<7;
          cop2d.sh[(10<<1)+0]  =(data&0x03e0)<<2;
          cop2d.sh[(11<<1)+0]  =(data&0x7c00)>>3;
          return;

        case 30:
          {
            cop2d.uw[(30)] = data;
            cop2d.uw[(31)] = 0;
            var sbit = (cop2d.uw[(30)]&0x80000000) ? cop2d.uw[(30)] : ~cop2d.uw[(30)];

            for ( ; sbit&0x80000000; sbit<<=1) {
              cop2d.uw[(31)]++;
            }
          }
          return;

        case  7:
        case 29:
        case 31:
          return;
      }

      cop2d.uw[( addr)] = data;
    },

    opcodeCTC2(addr, data) {
      switch(addr) {
        case  4:
        case 12:
        case 20:
        case 26:
        case 27:
        case 29:
        case 30:
          data = ((data)<<16>>16); // ?
          break;

        
        case 31:
          pseudo.CstrMain.error('opcodeCTC2 -> '+addr+' <- '+('0x'+(data>>>0).toString(16)));
          break;
      }

      cop2c.uw[( addr)] = data;
    }
  };
})();













pseudo.CstrCounters = (function() {
  var timer = [];
  var vbk, hsc;

  return {
    reset() {
      for (var i=0; i<3; i++) {
        timer[i] = {
          __bound : 0xffff
        };
      }

      vbk = 0;
      hsc = 0;
    },

    update() {
      pseudo.CstrMem.__hwr.uh[((0x1100+(0<<4))&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] += pseudo.CstrMem.__hwr.uw[((0x1104+(0<<4))&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&0x100 ? 64 : 64/8;

      if (pseudo.CstrMem.__hwr.uh[((0x1100+(0<<4))&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] >= timer[0].__bound) {
        pseudo.CstrMem.__hwr.uh[((0x1100+(0<<4))&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] = 0;
        if (pseudo.CstrMem.__hwr.uw[((0x1104+(0<<4))&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&0x50) {
          //pseudo.CstrBus.interruptSet(4);
          pseudo.CstrMain.error('IRQ_RTC0');
        }
      }

      if (!(pseudo.CstrMem.__hwr.uw[((0x1104+(1<<4))&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&0x100)) {
        pseudo.CstrMem.__hwr.uh[((0x1100+(1<<4))&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] += 64;

        if (pseudo.CstrMem.__hwr.uh[((0x1100+(1<<4))&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] >= timer[1].__bound) {
          pseudo.CstrMem.__hwr.uh[((0x1100+(1<<4))&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] = 0;
          if (pseudo.CstrMem.__hwr.uw[((0x1104+(1<<4))&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&0x50) {
            //pseudo.CstrBus.interruptSet(5);
            pseudo.CstrMain.error('IRQ_RTC1');
          }
        }
      }
      else if ((hsc += 64) >= (33868800/15734)) { hsc = 0;
        if (++pseudo.CstrMem.__hwr.uh[((0x1100+(1<<4))&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] >= timer[1].__bound) {
          pseudo.CstrMem.__hwr.uh[((0x1100+(1<<4))&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] = 0;
          if (pseudo.CstrMem.__hwr.uw[((0x1104+(1<<4))&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&0x50) {
            pseudo.CstrBus.interruptSet(5);
          }
        }
      }

      if (!(pseudo.CstrMem.__hwr.uw[((0x1104+(2<<4))&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&1)) {
        pseudo.CstrMem.__hwr.uh[((0x1100+(2<<4))&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] += pseudo.CstrMem.__hwr.uw[((0x1104+(2<<4))&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&0x200 ? 64/8 : 64;

        if (pseudo.CstrMem.__hwr.uh[((0x1100+(2<<4))&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] >= timer[2].__bound) {
          pseudo.CstrMem.__hwr.uh[((0x1100+(2<<4))&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] = 0;
          if (pseudo.CstrMem.__hwr.uw[((0x1104+(2<<4))&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&0x50) {
            pseudo.CstrBus.interruptSet(6);
          }
        }
      }

      if ((vbk += 64) >= (33868800/60)) { vbk = 0;
        pseudo.CstrBus.interruptSet(0);
         pseudo.CstrGraphics.redraw();
        pseudo.CstrMips.setbp();
      }
    },

    scopeW(addr, data) {
      var p = (addr>>>4)&3;

      switch(addr&0xf) {
        case 0:
          pseudo.CstrMem.__hwr.uh[((0x1100+(p<<4))&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] = data&0xffff;
          return;

        case 4:
           pseudo.CstrMem.__hwr.uw[((0x1104+(p<<4))&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2] = data;
          timer[p].__bound = pseudo.CstrMem.__hwr.uw[((0x1104+(p<<4))&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&8 ? pseudo.CstrMem.__hwr.uh[((0x1108+(p<<4))&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] : 0xffff;
          return;

        case 8:
            pseudo.CstrMem.__hwr.uh[((0x1108+(p<<4))&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] = data&0xffff;
          timer[p].__bound = pseudo.CstrMem.__hwr.uw[((0x1104+(p<<4))&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&8 ? pseudo.CstrMem.__hwr.uh[((0x1108+(p<<4))&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] : 0xffff;
          return;
      }

      pseudo.CstrMain.error('RTC Write '+('0x'+(addr&0xf>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
    },

    scopeR(addr) {
      var p = (addr>>>4)&3;

      switch(addr&0xf) {
        case 0:
          return pseudo.CstrMem.__hwr.uh[((0x1100+(p<<4))&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1];

        case 4:
          return pseudo.CstrMem.__hwr.uw[((0x1104+(p<<4))&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2];

        case 8:
          return pseudo.CstrMem.__hwr.uh[((0x1108+(p<<4))&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1];
      }

      pseudo.CstrMain.error('RTC Read '+('0x'+(addr&0xf>>>0).toString(16)));
      return 0;
    }
  };
})();




pseudo.CstrHardware = (function() {
  // Exposed class functions/variables
  return {
    write: {
      w(addr, data) {
        if (addr >= 0x1080 && addr <= 0x10e8) { // DMA
          if (addr&8) {
            pseudo.CstrBus.checkDMA(addr, data);
            return;
          }
          pseudo.CstrMem.__hwr.uw[(( addr)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2] = data;
          return;
        }

        if (addr >= 0x1104 && addr <= 0x1124) { // Rootcounters
          pseudo.CstrCounters.scopeW(addr, data);
          return;
        }

        if (addr >= 0x1810 && addr <= 0x1814) { // Graphics
          pseudo.CstrGraphics.scopeW(addr, data);
          return;
        }

        if (addr >= 0x1820 && addr <= 0x1824) { // Motion Decoder
          pseudo.CstrMem.__hwr.uw[(( addr)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2] = data;
          return;
        }

        switch(addr) {
          case 0x1070:
            pseudo.CstrMem.__hwr.uw[((0x1070)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2] &= data&pseudo.CstrMem.__hwr.uw[((0x1074)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2];
            return;

          case 0x10f4: // Thanks Calb, Galtor :)
            pseudo.CstrMem.__hwr.uw[((0x10f4)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2] = (pseudo.CstrMem.__hwr.uw[((0x10f4)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&(~((data&0xff000000)|0xffffff)))|(data&0xffffff);
            return;

          
          case 0x1000:
          case 0x1004:
          case 0x1008:
          case 0x100c:
          case 0x1010:
          case 0x1014: // SPU
          case 0x1018: // DV5
          case 0x101c:
          case 0x1020: // COM
          case 0x1060: // RAM Size
          case 0x1074:
          case 0x10f0:

          case 0x1d80:
          case 0x1d84:
          case 0x1d8c: // SPU in 32 bits?
            pseudo.CstrMem.__hwr.uw[(( addr)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2] = data;
            return;
        }
        pseudo.CstrMain.error('Hardware Write w '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      h(addr, data) {
        if (addr >= 0x1048 && addr <= 0x104e) { // Controls
          pseudo.CstrSerial.write.h(addr, data);
          return;
        }

        if (addr >= 0x1100 && addr <= 0x1128) { // Rootcounters
          pseudo.CstrCounters.scopeW(addr, data);
          return;
        }
        
        if (addr >= 0x1c00 && addr <= 0x1dfe) { // Audio
          pseudo.CstrAudio.scopeW(addr, data);
          return;
        }

        switch(addr) {
          case 0x1070:
            pseudo.CstrMem.__hwr.uh[((0x1070)&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] &= data&pseudo.CstrMem.__hwr.uh[((0x1074)&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1];
            return;
          
          
          case 0x1014:
          case 0x1074:
            pseudo.CstrMem.__hwr.uh[(( addr)&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] = data;
            return;
        }
        pseudo.CstrMain.error('Hardware Write h '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      b(addr, data) {
        if (addr >= 0x1800 && addr <= 0x1803) { // CD-ROM
          pseudo.CstrCdrom.scopeW(addr, data);
          return;
        }

        switch(addr) {
          case 0x1040:
            pseudo.CstrSerial.write.b(addr, data);
            return;

          
          case 0x10f6:
          case 0x2041: // DIP Switch?
            pseudo.CstrMem.__hwr.ub[(( addr)&(pseudo.CstrMem.__hwr.ub.byteLength-1))>>>0] = data;
            return;
        }
        pseudo.CstrMain.error('Hardware Write b '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      }
    },

    read: {
      w(addr) {
        if (addr >= 0x1080 && addr <= 0x10e8) { // DMA
          return pseudo.CstrMem.__hwr.uw[(( addr)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2];
        }

        if (addr >= 0x1100 && addr <= 0x1110) { // Rootcounters
          return pseudo.CstrCounters.scopeR(addr);
        }

        if (addr >= 0x1810 && addr <= 0x1814) { // Graphics
          return pseudo.CstrGraphics.scopeR(addr);
        }

        if (addr >= 0x1820 && addr <= 0x1824) { // Motion Decoder
          return pseudo.CstrMem.__hwr.uw[(( addr)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2];
        }

        switch(addr) {
          
          case 0x1014:
          case 0x1060:
          case 0x1070:
          case 0x1074:
          case 0x10f0:
          case 0x10f4:
            return pseudo.CstrMem.__hwr.uw[(( addr)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2];
        }
        pseudo.CstrMain.error('Hardware Read w '+('0x'+(addr>>>0).toString(16)));
      },

      h(addr) {
        if (addr >= 0x1044 && addr <= 0x104e) { // Controls
          return pseudo.CstrSerial.read.h(addr);
        }

        if (addr >= 0x1100 && addr <= 0x1128) { // Rootcounters
          return pseudo.CstrCounters.scopeR(addr);
        }

        if (addr >= 0x1c00 && addr <= 0x1e0e) { // Audio
          return pseudo.CstrAudio.scopeR(addr);
        }

        switch(addr) {
          
          case 0x1014:
          case 0x1070:
          case 0x1074:
          case 0x1130:
            return pseudo.CstrMem.__hwr.uh[(( addr)&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1];
        }
        pseudo.CstrMain.error('Hardware Read h '+('0x'+(addr>>>0).toString(16)));
      },

      b(addr) {
        if (addr >= 0x1800 && addr <= 0x1803) { // CD-ROM
          return pseudo.CstrCdrom.scopeR(addr);
        }

        switch(addr) {
          case 0x1040: // Controls
            return pseudo.CstrSerial.read.b(addr);

          
          case 0x10f6:
            return pseudo.CstrMem.__hwr.ub[(( addr)&(pseudo.CstrMem.__hwr.ub.byteLength-1))>>>0];
        }
        pseudo.CstrMain.error('Hardware Read b '+('0x'+(addr>>>0).toString(16)));
      }
    }
  };
})();









pseudo.CstrMem = (function() {
  // Exposed class functions/variables
  return {
    __ram: union(0x200000),
    __rom: union(0x80000),
    __hwr: union(0x4000),

    reset() {
      // Reset all, except for BIOS?
      pseudo.CstrMem.__ram.ub.fill(0);
      pseudo.CstrMem.__hwr.ub.fill(0);
    },

    write: {
      w(addr, data) {
        switch(addr>>>20) {
          case 0x000: // Base RAM
          case 0x001: // Base RAM

          case 0x800: // Mirror
          case 0x801: // Mirror
          case 0x802: // Mirror
          case 0x803: // Mirror
          case 0x807: // Mirror

          case 0xa00: // Mirror
          case 0xa01: // Mirror
            if (pseudo.CstrMips.writeOK()) {
              pseudo.CstrMem.__ram.uw[(( addr)&(pseudo.CstrMem.__ram.uw.byteLength-1))>>>2] = data;
            }
            return;

          case 0x1f8: // Scratchpad + Hardware
            addr&=0xffff;
            if (addr <= 0x3ff) {
              pseudo.CstrMem.__hwr.uw[(( addr)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2] = data;
              return;
            }
            pseudo.CstrHardware.write.w(addr, data);
            return;
        }

        if (addr === 0xfffe0130) { // Mem Access
          return;
        }
        pseudo.CstrMain.error('Mem Write w '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      h(addr, data) {
        switch(addr>>>20) {
          case 0x000: // Base RAM
          case 0x001: // Base RAM

          case 0x800: // Mirror
          case 0x801: // Mirror
          case 0x802: // Mirror
          case 0x807: // Mirror

          case 0xa00: // Mirror
          case 0xa01: // Mirror
            if (pseudo.CstrMips.writeOK()) {
              pseudo.CstrMem.__ram.uh[(( addr)&(pseudo.CstrMem.__ram.uh.byteLength-1))>>>1] = data;
            }
            return;

          case 0x1f8: // Scratchpad + Hardware
            addr&=0xffff;
            if (addr <= 0x3ff) {
              pseudo.CstrMem.__hwr.uh[(( addr)&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1] = data;
              return;
            }
            pseudo.CstrHardware.write.h(addr, data);
            return;
        }
        pseudo.CstrMain.error('Mem Write h '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      b(addr, data) {
        switch(addr>>>20) {
          case 0x000: // Base RAM
          case 0x001: // Base RAM

          case 0x800: // Mirror
          case 0x801: // Mirror
          case 0x802: // Mirror
          case 0x807: // Mirror

          case 0xa00: // Mirror
          case 0xa01: // Mirror
            if (pseudo.CstrMips.writeOK()) {
              pseudo.CstrMem.__ram.ub[(( addr)&(pseudo.CstrMem.__ram.ub.byteLength-1))>>>0] = data;
            }
            return;

          case 0x1f8: // Scratchpad + Hardware
            addr&=0xffff;
            if (addr <= 0x3ff) {
              pseudo.CstrMem.__hwr.ub[(( addr)&(pseudo.CstrMem.__hwr.ub.byteLength-1))>>>0] = data;
              return;
            }
            pseudo.CstrHardware.write.b(addr, data);
            return;
        }
        pseudo.CstrMain.error('Mem Write b '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      }
    },

    read: {
      w(addr) {
        switch(addr>>>20) {
          case 0x000: // Base RAM
          case 0x001: // Base RAM

          case 0x800: // Mirror
          case 0x801: // Mirror
          case 0x802: // Mirror
          case 0x803: // Mirror
          case 0x807: // Mirror

          case 0xa00: // Mirror
          case 0xa01: // Mirror
            return pseudo.CstrMem.__ram.uw[(( addr)&(pseudo.CstrMem.__ram.uw.byteLength-1))>>>2];

          case 0xbfc: // BIOS
            return pseudo.CstrMem.__rom.uw[(( addr)&(pseudo.CstrMem.__rom.uw.byteLength-1))>>>2];

          case 0x1f8: // Scratchpad + Hardware
            addr&=0xffff;
            if (addr <= 0x3ff) {
              return pseudo.CstrMem.__hwr.uw[(( addr)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2];
            }
            return pseudo.CstrHardware.read.w(addr);
        }
        pseudo.CstrMain.error('Mem Read w '+('0x'+(addr>>>0).toString(16)));
        return 0;
      },

      h(addr) {
        switch(addr>>>20) {
          case 0x000: // Base RAM
          case 0x001: // Base RAM

          case 0x800: // Mirror
          case 0x801: // Mirror
          case 0x802: // Mirror
          case 0x807: // Mirror

          case 0xa01: // Mirror
            return pseudo.CstrMem.__ram.uh[(( addr)&(pseudo.CstrMem.__ram.uh.byteLength-1))>>>1];

          case 0xbfc: // BIOS
            return pseudo.CstrMem.__rom.uh[(( addr)&(pseudo.CstrMem.__rom.uh.byteLength-1))>>>1];

          case 0x1f8: // Scratchpad + Hardware
            addr&=0xffff;
            if (addr <= 0x3ff) {
              return pseudo.CstrMem.__hwr.uh[(( addr)&(pseudo.CstrMem.__hwr.uh.byteLength-1))>>>1];
            }
            return pseudo.CstrHardware.read.h(addr);
        }
        pseudo.CstrMain.error('Mem Read h '+('0x'+(addr>>>0).toString(16)));
        return 0;
      },

      b(addr) {
        switch(addr>>>20) {
          case 0x000: // Base RAM
          case 0x001: // Base RAM

          case 0x800: // Mirror
          case 0x801: // Mirror
          case 0x802: // Mirror
          case 0x807: // Mirror

          case 0xa00: // Mirror
          case 0xa01: // Mirror
            return pseudo.CstrMem.__ram.ub[(( addr)&(pseudo.CstrMem.__ram.ub.byteLength-1))>>>0];

          case 0xbfc: // BIOS
            return pseudo.CstrMem.__rom.ub[(( addr)&(pseudo.CstrMem.__rom.ub.byteLength-1))>>>0];

          case 0x1f8: // Scratchpad + Hardware
            addr&=0xffff;
            if (addr <= 0x3ff) {
              return pseudo.CstrMem.__hwr.ub[(( addr)&(pseudo.CstrMem.__hwr.ub.byteLength-1))>>>0];
            }
            return pseudo.CstrHardware.read.b(addr);

          case 0x1f0: // PIO? What do u want?
            return 0;
        }
        pseudo.CstrMain.error('Mem Read b '+('0x'+(addr>>>0).toString(16)));
        return 0;
      }
    },

    executeDMA(addr) {
      if (!pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|4)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2] || pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|8)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2] !== 0x11000002) {
        return;
      }
      pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&=0xffffff;

      while (--pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|4)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]) {
        pseudo.CstrMem.__ram.uw[(( pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2])&(pseudo.CstrMem.__ram.uw.byteLength-1))>>>2] = (pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]-4)&0xffffff;
        pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]-=4;
      }
      pseudo.CstrMem.__ram.uw[(( pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2])&(pseudo.CstrMem.__ram.uw.byteLength-1))>>>2] = 0xffffff;
    }
  };
})();











// Inline functions for speedup







































pseudo.CstrMips = (function() {
  var divOutput;
  var bp, opcodeCount, requestAF, ptr, temp;

  // Base + Coprocessor
  var    r = new Uint32Array(32 + 3); // + r[32], r[33], r[34]
  var copr = new Uint32Array(16);

  // Cache for expensive calculation
  var power32 = Math.pow(2, 32); // Btw, pure multiplication is faster

  var mask = [
    [0x00ffffff, 0x0000ffff, 0x000000ff, 0x00000000],
    [0x00000000, 0xff000000, 0xffff0000, 0xffffff00],
    [0xffffff00, 0xffff0000, 0xff000000, 0x00000000],
    [0x00000000, 0x000000ff, 0x0000ffff, 0x00ffffff],
  ];

  var shift = [
    [0x18, 0x10, 0x08, 0x00],
    [0x00, 0x08, 0x10, 0x18],
    [0x18, 0x10, 0x08, 0x00],
    [0x00, 0x08, 0x10, 0x18],
  ];

  // Base CPU stepper
  function step(inslot) {
    var code = ptr[(( r[32])&(ptr.byteLength-1))>>>2]; r[32] += 4;
    opcodeCount++;
    r[0] = 0; // As weird as this seems, it is needed

    switch(((code>>>26)&0x3f)) {
      case 0: // SPECIAL
        switch(code&0x3f) {
          case 0: // SLL
            r[((code>>>11)&0x1f)] = r[((code>>>16)&0x1f)] << ((code>>>6)&0x1f);
            return;

          case 2: // SRL
            r[((code>>>11)&0x1f)] = r[((code>>>16)&0x1f)] >>> ((code>>>6)&0x1f);
            return;

          case 3: // SRA
            r[((code>>>11)&0x1f)] = ((r[((code>>>16)&0x1f)])<<0>>0) >> ((code>>>6)&0x1f);
            return;

          case 4: // SLLV
            r[((code>>>11)&0x1f)] = r[((code>>>16)&0x1f)] << (r[((code>>>21)&0x1f)]&0x1f);
            return;

          case 6: // SRLV
            r[((code>>>11)&0x1f)] = r[((code>>>16)&0x1f)] >>> (r[((code>>>21)&0x1f)]&0x1f);
            return;

          case 7: // SRAV
            r[((code>>>11)&0x1f)] = ((r[((code>>>16)&0x1f)])<<0>>0) >> (r[((code>>>21)&0x1f)]&0x1f);
            return;

          case 8: // JR
            branch(r[((code>>>21)&0x1f)]);
            ptr = r[32]>>>20 === 0xbfc ? pseudo.CstrMem.__rom.uw : pseudo.CstrMem.__ram.uw;
            if (r[32] === 0xb0) { if (r[9] === 59 || r[9] === 61) { var char = String.fromCharCode(r[4]&0xff).replace(/\n/, '<br/>'); divOutput.append(char.toUpperCase()); } };
            return;

          case 9: // JALR
            r[((code>>>11)&0x1f)] = r[32]+4;
            branch(r[((code>>>21)&0x1f)]);
            ptr = r[32]>>>20 === 0xbfc ? pseudo.CstrMem.__rom.uw : pseudo.CstrMem.__ram.uw;
            return;

          case 12: // SYSCALL
            r[32]-=4;
            copr[12] = (copr[12]&0xffffffc0)|((copr[12]<<2)&0x3f); copr[13] = 0x20; copr[14] = r[32]; r[32] = 0x80; ptr = r[32]>>>20 === 0xbfc ? pseudo.CstrMem.__rom.uw : pseudo.CstrMem.__ram.uw;
            return;

          case 13: // BREAK
            return;

          case 16: // MFHI
            r[((code>>>11)&0x1f)] = r[34];
            return;

          case 17: // MTHI
            r[34] = r[((code>>>21)&0x1f)];
            return;

          case 18: // MFLO
            r[((code>>>11)&0x1f)] = r[33];
            return;

          case 19: // MTLO
            r[33] = r[((code>>>21)&0x1f)];
            return;

          case 24: // MULT
            temp = ((r[((code>>>21)&0x1f)])<<0>>0) *  ((r[((code>>>16)&0x1f)])<<0>>0); r[33] = temp&0xffffffff; r[34] = Math.floor(temp/power32);
            return;

          case 25: // MULTU
            temp = r[((code>>>21)&0x1f)] *  r[((code>>>16)&0x1f)]; r[33] = temp&0xffffffff; r[34] = Math.floor(temp/power32);
            return;

          case 26: // DIV
            if ( ((r[((code>>>16)&0x1f)])<<0>>0)) { r[33] = ((r[((code>>>21)&0x1f)])<<0>>0) /  ((r[((code>>>16)&0x1f)])<<0>>0); r[34] = ((r[((code>>>21)&0x1f)])<<0>>0) %  ((r[((code>>>16)&0x1f)])<<0>>0); };
            return;

          case 27: // DIVU
            if ( r[((code>>>16)&0x1f)]) { r[33] = r[((code>>>21)&0x1f)] /  r[((code>>>16)&0x1f)]; r[34] = r[((code>>>21)&0x1f)] %  r[((code>>>16)&0x1f)]; };
            return;

          case 32: // ADD
          case 33: // ADDU
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] + r[((code>>>16)&0x1f)];
            return;

          case 34: // SUB
          case 35: // SUBU
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] - r[((code>>>16)&0x1f)];
            return;

          case 36: // AND
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] & r[((code>>>16)&0x1f)];
            return;

          case 37: // OR
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] | r[((code>>>16)&0x1f)];
            return;

          case 38: // XOR
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] ^ r[((code>>>16)&0x1f)];
            return;

          case 39: // NOR
            r[((code>>>11)&0x1f)] = ~(r[((code>>>21)&0x1f)] | r[((code>>>16)&0x1f)]);
            return;

          case 42: // SLT
            r[((code>>>11)&0x1f)] = ((r[((code>>>21)&0x1f)])<<0>>0) < ((r[((code>>>16)&0x1f)])<<0>>0);
            return;

          case 43: // SLTU
            r[((code>>>11)&0x1f)] = r[((code>>>21)&0x1f)] < r[((code>>>16)&0x1f)];
            return;
        }
        pseudo.CstrMain.error('Special CPU instruction '+(code&0x3f));
        return;

      case 1: // REGIMM
        switch(((code>>>16)&0x1f)) {
          case 0: // BLTZ
            if (((r[((code>>>21)&0x1f)])<<0>>0) < 0) {
              branch((r[32]+((((code)<<16>>16))<<2)));
            }
            return;

          case 1: // BGEZ
            if (((r[((code>>>21)&0x1f)])<<0>>0) >= 0) {
              branch((r[32]+((((code)<<16>>16))<<2)));
            }
            return;

          case 17: // BGEZAL
            r[31] = r[32]+4;
            if (((r[((code>>>21)&0x1f)])<<0>>0) >= 0) {
              branch((r[32]+((((code)<<16>>16))<<2)));
            }
            return;
        }
        pseudo.CstrMain.error('Bcond CPU instruction '+((code>>>16)&0x1f));
        return;

      case 2: // J
        branch(((r[32]&0xf0000000)|(code&0x3ffffff)<<2));
        return;

      case 3: // JAL
        r[31] = r[32]+4;
        branch(((r[32]&0xf0000000)|(code&0x3ffffff)<<2));
        return;

      case 4: // BEQ
        if (r[((code>>>21)&0x1f)] === r[((code>>>16)&0x1f)]) {
          branch((r[32]+((((code)<<16>>16))<<2)));
        }
        return;

      case 5: // BNE
        if (r[((code>>>21)&0x1f)] !== r[((code>>>16)&0x1f)]) {
          branch((r[32]+((((code)<<16>>16))<<2)));
        }
        return;

      case 6: // BLEZ
        if (((r[((code>>>21)&0x1f)])<<0>>0) <= 0) {
          branch((r[32]+((((code)<<16>>16))<<2)));
        }
        return;

      case 7: // BGTZ
        if (((r[((code>>>21)&0x1f)])<<0>>0) > 0) {
          branch((r[32]+((((code)<<16>>16))<<2)));
        }
        return;

      case 8: // ADDI
      case 9: // ADDIU
        r[((code>>>16)&0x1f)] = r[((code>>>21)&0x1f)] + (((code)<<16>>16));
        return;

      case 10: // SLTI
        r[((code>>>16)&0x1f)] = ((r[((code>>>21)&0x1f)])<<0>>0) < (((code)<<16>>16));
        return;

      case 11: // SLTIU
        r[((code>>>16)&0x1f)] = r[((code>>>21)&0x1f)] < (code&0xffff);
        return;

      case 12: // ANDI
        r[((code>>>16)&0x1f)] = r[((code>>>21)&0x1f)] & (code&0xffff);
        return;

      case 13: // ORI
        r[((code>>>16)&0x1f)] = r[((code>>>21)&0x1f)] | (code&0xffff);
        return;

      case 14: // XORI
        r[((code>>>16)&0x1f)] = r[((code>>>21)&0x1f)] ^ (code&0xffff);
        return;

      case 15: // LUI
        r[((code>>>16)&0x1f)] = code<<16;
        return;

      case 16: // COP0
        switch(((code>>>21)&0x1f)) {
          case 0: // MFC0
            r[((code>>>16)&0x1f)] = copr[((code>>>11)&0x1f)];
            return;

          case 4: // MTC0
            copr[((code>>>11)&0x1f)] = r[((code>>>16)&0x1f)];
            return;

          case 16: // RFE
            copr[12] = (copr[12]&0xfffffff0) | ((copr[12]>>>2)&0xf);
            return;
        }
        pseudo.CstrMain.error('Coprocessor 0 instruction '+((code>>>21)&0x1f));
        return;

      case 18: // COP2
        pseudo.CstrCop2.execute(code);
        return;

      case 32: // LB
        r[((code>>>16)&0x1f)] = ((pseudo.CstrMem.read.b((r[((code>>>21)&0x1f)]+(((code)<<16>>16)))))<<24>>24);
        return;

      case 33: // LH
        r[((code>>>16)&0x1f)] = ((pseudo.CstrMem.read.h((r[((code>>>21)&0x1f)]+(((code)<<16>>16)))))<<16>>16);
        return;

      case 34: // LWL
        temp = (r[((code>>>21)&0x1f)]+(((code)<<16>>16))); r[((code>>>16)&0x1f)] = (r[((code>>>16)&0x1f)]&mask[ 0][(r[((code>>>21)&0x1f)]+(((code)<<16>>16)))&3])|(pseudo.CstrMem.read.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16)))&~3) << shift[ 0][(r[((code>>>21)&0x1f)]+(((code)<<16>>16)))&3]);
        return;

      case 35: // LW
        r[((code>>>16)&0x1f)] = pseudo.CstrMem.read.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16))));
        return;

      case 36: // LBU
        r[((code>>>16)&0x1f)] = pseudo.CstrMem.read.b((r[((code>>>21)&0x1f)]+(((code)<<16>>16))));
        return;

      case 37: // LHU
        r[((code>>>16)&0x1f)] = pseudo.CstrMem.read.h((r[((code>>>21)&0x1f)]+(((code)<<16>>16))));
        return;

      case 38: // LWR
        temp = (r[((code>>>21)&0x1f)]+(((code)<<16>>16))); r[((code>>>16)&0x1f)] = (r[((code>>>16)&0x1f)]&mask[ 1][(r[((code>>>21)&0x1f)]+(((code)<<16>>16)))&3])|(pseudo.CstrMem.read.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16)))&~3) >> shift[ 1][(r[((code>>>21)&0x1f)]+(((code)<<16>>16)))&3]);
        return;

      case 40: // SB
        pseudo.CstrMem.write.b((r[((code>>>21)&0x1f)]+(((code)<<16>>16))), r[((code>>>16)&0x1f)]);
        return;

      case 41: // SH
        pseudo.CstrMem.write.h((r[((code>>>21)&0x1f)]+(((code)<<16>>16))), r[((code>>>16)&0x1f)]);
        return;

      case 42: // SWL
        temp = (r[((code>>>21)&0x1f)]+(((code)<<16>>16))); pseudo.CstrMem.write.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16)))&~3, (r[((code>>>16)&0x1f)] >> shift[ 2][(r[((code>>>21)&0x1f)]+(((code)<<16>>16)))&3])|(pseudo.CstrMem.read.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16)))&~3)&mask[ 2][(r[((code>>>21)&0x1f)]+(((code)<<16>>16)))&3]));
        return;

      case 43: // SW
        pseudo.CstrMem.write.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16))), r[((code>>>16)&0x1f)]);
        return;

      case 46: // SWR
        temp = (r[((code>>>21)&0x1f)]+(((code)<<16>>16))); pseudo.CstrMem.write.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16)))&~3, (r[((code>>>16)&0x1f)] << shift[ 3][(r[((code>>>21)&0x1f)]+(((code)<<16>>16)))&3])|(pseudo.CstrMem.read.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16)))&~3)&mask[ 3][(r[((code>>>21)&0x1f)]+(((code)<<16>>16)))&3]));
        return;

      case 50: // LWC2
        pseudo.CstrCop2.opcodeMTC2(((code>>>16)&0x1f), pseudo.CstrMem.read.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16)))));
        return;

      case 58: // SWC2
        pseudo.CstrMem.write.w((r[((code>>>21)&0x1f)]+(((code)<<16>>16))), pseudo.CstrCop2.opcodeMFC2(((code>>>16)&0x1f)));
        return;
    }
    pseudo.CstrMain.error('Basic CPU instruction '+((code>>>26)&0x3f));
  }

  function branch(addr) {
    // Execute instruction in slot
    step(true);
    r[32] = addr;

    if (opcodeCount >= 64) {
      // Rootcounters, interrupts
      pseudo.CstrCounters.update();
        pseudo.CstrCdrom.update();
      pseudo.CstrBus.interruptsUpdate();

      // Exceptions
      if (pseudo.CstrMem.__hwr.uw[((0x1070)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&pseudo.CstrMem.__hwr.uw[((0x1074)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]) {
        if ((copr[12]&0x401) === 0x401) {
          copr[12] = (copr[12]&0xffffffc0)|((copr[12]<<2)&0x3f); copr[13] = 0x400; copr[14] = r[32]; r[32] = 0x80; ptr = r[32]>>>20 === 0xbfc ? pseudo.CstrMem.__rom.uw : pseudo.CstrMem.__ram.uw;
        }
      }
      opcodeCount %= 64;
    }
  }

  // Exposed class functions/variables
  return {
    awake(output) {
      divOutput = output;
    },

    reset() {
      // Break emulation loop
      pseudo.CstrMips.pause();

      // Reset processors
      r.fill(0);
      copr.fill(0);

      copr[12] = 0x10900000;
      copr[15] = 0x2;

      opcodeCount = 0;
      r[32] = 0xbfc00000;
      ptr = r[32]>>>20 === 0xbfc ? pseudo.CstrMem.__rom.uw : pseudo.CstrMem.__ram.uw;

      // Clear console out
      divOutput.text(' ');

      // BIOS bootstrap
      pseudo.CstrMips.consoleWrite('info', 'BIOS file has been written to ROM');
      var start = performance.now();

      while (r[32] !== 0x80030000) {
        step(false);
      }
      var delta = parseFloat(performance.now()-start).toFixed(2);
      pseudo.CstrMips.consoleWrite('info', 'Bootstrap completed in '+delta+' ms');
    },

    run() {
      bp = false;
      requestAF = requestAnimationFrame(pseudo.CstrMips.run);

      while (!bp) { // And u don`t stop!
        step(false);
      }
    },

    exeHeader(hdr) {
      r[32]    = hdr[2+ 2];
      r[28] = hdr[2+ 3];
      r[29] = hdr[2+10];
    },

    writeOK() {
      return !(copr[12]&0x10000);
    },

    consoleWrite(kind, str) {
      divOutput.append('<div class="'+kind+'"><span>PSeudo:: </span>'+str+'</div>');
    },

    setbp() {
      bp = true;
    },

    setbase(addr, data) {
      r[addr] = data;
    },

    readbase(addr) {
      return r[addr];
    },

    pause() {
      cancelAnimationFrame(requestAF);
      requestAF = undefined;
      bp = true;
    },

    resume() {
      pseudo.CstrMips.run();
    },

    setpc(addr) {
      ptr = addr>>>20 === 0xbfc ? pseudo.CstrMem.__rom.uw : pseudo.CstrMem.__ram.uw;
    }
  };
})();
















pseudo.CstrMain = (function() {
  var divDropzone;
  var iso, unusable;

  // AJAX function
  function request(path, fn) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if (xhr.status === 404) {
        pseudo.CstrMips.consoleWrite('error', 'Unable to read file "'+path+'"');
        unusable = true;
      }
      else {
        fn(xhr.response);
      }
    };
    xhr.responseType = 'arraybuffer';
    xhr.open('GET', path);
    xhr.send();
  }

  // Chunk reader function
  function chunkReader(file, start, size, kind, fn) {
    var end = start+size;

    // Check boundaries
    if (file.size > end) {
      var reader = new FileReader();
      reader.onload = function(e) { // Callback
        fn(e.target.result);
      };
      // Read sliced area
      var slice = file.slice(start, end);

      if (kind === 'text') {
        reader.readAsText(slice);
      }
      else {
        reader.readAsArrayBuffer(slice);
      }
    }
  }

  function reset() {
    // Prohibit all user actions
    if (unusable) {
      return false;
    }

    // Reset all emulator components
     pseudo.CstrTexCache.reset();
     pseudo.CstrRender.reset();
         pseudo.CstrGraphics.reset();
        pseudo.CstrMem.reset();
      pseudo.CstrAudio.reset();
    pseudo.CstrCounters.reset();
      pseudo.CstrCdrom.reset();
        pseudo.CstrBus.reset();
        pseudo.CstrSerial.reset();
       pseudo.CstrCop2.reset();
        pseudo.CstrMips.reset();

    return true;
  }

  function prepareExe(resp) {
    var header = new Uint32Array(resp, 0, 0x800);
    var offset = header[2+4]&(pseudo.CstrMem.__ram.ub.byteLength-1); // Offset needs boundaries... huh?
    var size   = header[2+5];

    // Set pseudo.CstrMem
    pseudo.CstrMem.__ram.ub.set(new Uint8Array(resp, 0x800, size), offset);
    
    // Set processor
    pseudo.CstrMips.exeHeader(header);
    pseudo.CstrMips.consoleWrite('info', 'PSX-EXE has been transferred to RAM');
  }

  // Exposed class functions/variables
  return {
    awake(screen, blink, kb, res, double, output, dropzone, footer) {
      divDropzone = dropzone;
         unusable = false;
      
      pseudo.CstrRender.awake(screen, res, double, footer);
       pseudo.CstrAudio.awake();
       pseudo.CstrCdrom.awake(blink, kb);
         pseudo.CstrMips.awake(output);

      request('bios/scph1001.bin', function(resp) {
        // Move BIOS to Mem
        pseudo.CstrMem.__rom.ub.set(new Uint8Array(resp));
      });
    },

    run(path) {
      if (reset()) {
        if (path === 'bios') { // BIOS run
          pseudo.CstrMips.run();
        }
        else { // Homebrew run
          request(path, function(resp) {
            prepareExe(resp);
            pseudo.CstrMips.run();
          });
        }
      }
    },

    drop: {
      file(e) {
        e.preventDefault();
        pseudo.CstrMain.drop.exit();
        
        var dt = e.dataTransfer;

        if (dt.files) {
          var file = dt.files[0];
          
          // PS-X EXE
          chunkReader(file, 0, 8, 'text', function(id) {
            if (id === 'PS-X EXE') {
              var reader = new FileReader();
              reader.onload = function(e) { // Callback
                if (reset()) {
                  prepareExe(e.target.result);
                  pseudo.CstrMips.run();
                }
              };
              // Read file
              reader.readAsArrayBuffer(file);
            }
          });

          // ISO 9660
          chunkReader(file, 0x9319, 5, 'text', function(id) {
            if (id === 'CD001') {
              chunkReader(file, 0x9340, 32, 'text', function(name) { // Get Name
                iso = file;
                if (reset()) {
                  pseudo.CstrMips.setbase(32, pseudo.CstrMips.readbase(31));
                  pseudo.CstrMips.setpc(pseudo.CstrMips.readbase(32));
                  pseudo.CstrMips.run();
                }
              });
            }
          });
        }
      },

      over(e) {
        e.preventDefault();
      },

      enter() {
        divDropzone.addClass('dropzone-active');
      },

      exit() {
        divDropzone.removeClass('dropzone-active');
      }
    },

    error(out) {
      throw new Error('PSeudo / '+out);
    },

    trackRead(time) {
      if (!iso) {
        return;
      }

      var minute = (parseInt((time[0])/16) * 10 + (time[0])%16);
      var sec    = (parseInt((time[1])/16) * 10 + (time[1])%16);
      var frame  = (parseInt((time[2])/16) * 10 + (time[2])%16);

      // var minute = (parseInt((time.minute)/16) * 10 + (time.minute)%16);
      // var sec    = (parseInt((time.sec)/16) * 10 + (time.sec)%16);
      // var frame  = (parseInt((time.frame)/16) * 10 + (time.frame)%16);

      // console.dir(minute+' '+sec+' '+frame);

      var offset = (((minute) * 60 + ( sec) - 2) * 75 + ( frame)) * 2352 + 12;
      var size   = (2352 - 12);

      chunkReader(iso, offset, size, 'raw', function(data) {
        // pseudo.CstrCdrom.cdromRead2(new Uint8Array(data));
        pseudo.CstrCdrom.interruptRead2(new Uint8Array(data));
        // slice(0, DATASIZE)
      });
    }
  };
})();















  // Compose Blend







// Compose Color





// Compose Vertex





// Compose Texture


// Disable Texture




// Draw!

















// SIGN_EXT_16

































































pseudo.CstrRender = (function() {
  var divScreen, divRes, divDouble, divFooter;
  
  var ctx, attrib, bfr; // 'webgl', { preserveDrawingBuffer: true } Context
  var blend, bit, ofs;
  var drawArea, spriteTP;

  // Resolution
  var res = {
        native: { w:   0, h:   0 },
      override: { w: 320, h: 240 },
    multiplier: 1
  };

  // Information
  info = new Uint32Array(8);

  // Generic function for shaders
  function createShader(kind, content) {
    var shader = ctx.createShader(kind);
    ctx.shaderSource (shader, content);
    ctx.compileShader(shader);
    ctx.getShaderParameter(shader, ctx.COMPILE_STATUS);

    return shader;
  }

  function drawAreaCalc(n) {
    return Math.round((n * (res.override.w * res.multiplier)) / 100);
  }

  // Exposed class functions/variables
  return {
    awake(screen, resolution, double, footer) {
      // Get HTML elements
      divScreen = screen[0];
      divRes    = resolution[0];
      divDouble = double;
      divFooter = footer;

      // 'webgl', { preserveDrawingBuffer: true } Canvas
      ctx = divScreen.getContext('webgl', { preserveDrawingBuffer: true });
      ctx. enable(ctx.BLEND);
      ctx.disable(ctx.DEPTH_TEST);
      ctx.disable(ctx.CULL_FACE);
      ctx.clearColor(0.0, 0.0, 0.0, 1.0);

      // Shaders
      var func = ctx.createProgram();
      ctx.attachShader(func, createShader(ctx.  VERTEX_SHADER, '  attribute vec2 a_position;  attribute vec4 a_color;  attribute vec2 a_texCoord;  uniform vec2 u_resolution;  varying vec4 v_color;  varying vec2 v_texCoord;    void main() {    gl_Position = vec4(((a_position / u_resolution) - 1.0) * vec2(1, -1), 0, 1);    v_color = a_color;    v_texCoord = a_texCoord;  }'));
      ctx.attachShader(func, createShader(ctx.FRAGMENT_SHADER, '  precision mediump float;  uniform sampler2D u_texture;  uniform bool u_enabled;  varying vec4 v_color;  varying vec2 v_texCoord;    void main() {    if (u_enabled) {      gl_FragColor = texture2D(u_texture, v_texCoord) * (v_color * vec4(2.0, 2.0, 2.0, 1));    }    else {      gl_FragColor = v_color;    }  }'));
      ctx.linkProgram(func);
      ctx.getProgramParameter(func, ctx.LINK_STATUS);
      ctx.useProgram (func);

      // Attributes
      attrib = {
        _c: ctx.getAttribLocation(func, 'a_color'),
        _p: ctx.getAttribLocation(func, 'a_position'),
        _t: ctx.getAttribLocation(func, 'a_texCoord'),
        _r: ctx.getUniformLocation  (func, 'u_resolution'),
        _e: ctx.getUniformLocation  (func, 'u_enabled')
      };

      ctx.enableVertexAttribArray(attrib._c);
      ctx.enableVertexAttribArray(attrib._p);
      ctx.enableVertexAttribArray(attrib._t);

      // Buffers
      bfr = {
        _c: ctx.createBuffer(),
        _v: ctx.createBuffer(),
        _t: ctx.createBuffer(),
      };

      // Blend
      bit = [
        { src: ctx.SRC_ALPHA, target: ctx.ONE_MINUS_SRC_ALPHA, opaque: 128 },
        { src: ctx.ONE,       target: ctx.ONE_MINUS_SRC_ALPHA, opaque:   0 },
        { src: ctx.ZERO,      target: ctx.ONE_MINUS_SRC_COLOR, opaque:   0 },
        { src: ctx.SRC_ALPHA, target: ctx.ONE,                 opaque:  64 },
      ];
    },

    reset() {
      info.fill(0);
      info[7]  = 2;
      spriteTP = 0;
         blend = 0;

      // Draw Area Start/End
      drawArea = {
        start: { h: 0, v: 0 },
          end: { h: 0, v: 0 },
      };

      // Offset
      ofs = {
        h: 0, v: 0
      };

      pseudo.CstrRender.resize({ w: 320, h: 240 });
      ctx.clear(ctx.COLOR_BUFFER_BIT);
    },

    resize(data) {
      // Same resolution? Ciao!
      if (data.w === res.native.w && data.h === res.native.h) {
        return;
      }

      // Check if we have a valid resolution
      if (data.w > 0 && data.h > 0) {
        // Store valid resolution
        res.native.w = data.w;
        res.native.h = data.h;

        // Native PSX resolution
        ctx.uniform2f(attrib._r, data.w/2, data.h/2);
        divRes.innerText = data.w+' x '+data.h;

        // Construct desired resolution
        var w = (res.override.w || data.w) * res.multiplier;
        var h = (res.override.h || data.h) * res.multiplier;

        divScreen.width = w;
        divScreen.height   = h;
        ctx.viewport(0, 0, w, h);
      }
      else {
        console.info('Not a valid resolution');
      }
    },

    doubleResolution() {
      res.multiplier = res.multiplier === 1 ? 2 : 1;

      // Show/hide elements
      if (res.multiplier === 1) {
        divFooter.show();
      }
      else {
        divFooter.hide();
      }
      
      // Redraw
      var w = res.native.w;
      var h = res.native.h;

      res.native.w = -1;
      res.native.h = -1;

      pseudo.CstrRender.resize({ w: w, h: h });
    },

    draw(addr, data) {
      // Primitives
      switch(addr&0xfc) {
        case 0x20: // POLY F3
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,} ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[2]>> 0)&0xffff, v: (data[2]>>16)&0xffff,}, { h: (data[3]>> 0)&0xffff, v: (data[3]>>16)&0xffff,}, { h: (data[4]>> 0)&0xffff, v: (data[4]>>16)&0xffff,}, ]}; var cr = []; var vx = []; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (var i=0; i<3; i++) { cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]); vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.uniform1i(attrib._e, false); ctx.disableVertexAttribArray(attrib._t); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays( ctx.TRIANGLE_STRIP, 0, 3); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x24: // POLY FT3
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,} ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[3]>> 0)&0xffff, v: (data[3]>>16)&0xffff,}, { h: (data[5]>> 0)&0xffff, v: (data[5]>>16)&0xffff,}, { h: (data[7]>> 0)&0xffff, v: (data[7]>>16)&0xffff,}, ], tx: [ { u: (data[2]>>>0)&0xff, v: (data[2]>>>8)&0xff,}, { u: (data[4]>>>0)&0xff, v: (data[4]>>>8)&0xff,}, { u: (data[6]>>>0)&0xff, v: (data[6]>>>8)&0xff,}, { u: (data[8]>>>0)&0xff, v: (data[8]>>>8)&0xff,}, ], tp: [ (data[2]>>>16)&0xffff, (data[4]>>>16)&0xffff, ]}; var cr = []; var vx = []; var tx = []; blend = (k.tp[1]>>>5)&3; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (var i=0; i<3; i++) { if (k.cr.n&1) { cr.push(255>>>1, 255>>>1, 255>>>1, b[1]); } else { cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]); } vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v); tx.push(k.tx[i].u, k.tx[i].v); } pseudo.CstrTexCache.fetchTexture(ctx, k.tp[1], k.tp[0]); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); for (var i in tx) { tx[i] /= 256.0; } ctx.uniform1i(attrib._e, true); ctx.enableVertexAttribArray(attrib._t); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._t); ctx.vertexAttribPointer(attrib._t, 2, ctx.FLOAT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(tx), ctx.DYNAMIC_DRAW); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 3); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x28: // POLY F4
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,} ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[2]>> 0)&0xffff, v: (data[2]>>16)&0xffff,}, { h: (data[3]>> 0)&0xffff, v: (data[3]>>16)&0xffff,}, { h: (data[4]>> 0)&0xffff, v: (data[4]>>16)&0xffff,}, ]}; var cr = []; var vx = []; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (var i=0; i<4; i++) { cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]); vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.uniform1i(attrib._e, false); ctx.disableVertexAttribArray(attrib._t); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays( ctx.TRIANGLE_STRIP, 0, 4); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x2c: // POLY FT4
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,} ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[3]>> 0)&0xffff, v: (data[3]>>16)&0xffff,}, { h: (data[5]>> 0)&0xffff, v: (data[5]>>16)&0xffff,}, { h: (data[7]>> 0)&0xffff, v: (data[7]>>16)&0xffff,}, ], tx: [ { u: (data[2]>>>0)&0xff, v: (data[2]>>>8)&0xff,}, { u: (data[4]>>>0)&0xff, v: (data[4]>>>8)&0xff,}, { u: (data[6]>>>0)&0xff, v: (data[6]>>>8)&0xff,}, { u: (data[8]>>>0)&0xff, v: (data[8]>>>8)&0xff,}, ], tp: [ (data[2]>>>16)&0xffff, (data[4]>>>16)&0xffff, ]}; var cr = []; var vx = []; var tx = []; blend = (k.tp[1]>>>5)&3; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (var i=0; i<4; i++) { if (k.cr.n&1) { cr.push(255>>>1, 255>>>1, 255>>>1, b[1]); } else { cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]); } vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v); tx.push(k.tx[i].u, k.tx[i].v); } pseudo.CstrTexCache.fetchTexture(ctx, k.tp[1], k.tp[0]); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); for (var i in tx) { tx[i] /= 256.0; } ctx.uniform1i(attrib._e, true); ctx.enableVertexAttribArray(attrib._t); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._t); ctx.vertexAttribPointer(attrib._t, 2, ctx.FLOAT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(tx), ctx.DYNAMIC_DRAW); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x30: // POLY G3
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,}, { a: (data[2]>>> 0)&0xff, b: (data[2]>>> 8)&0xff, c: (data[2]>>>16)&0xff, n: (data[2]>>>24)&0xff,}, { a: (data[4]>>> 0)&0xff, b: (data[4]>>> 8)&0xff, c: (data[4]>>>16)&0xff, n: (data[4]>>>24)&0xff,}, { a: (data[6]>>> 0)&0xff, b: (data[6]>>> 8)&0xff, c: (data[6]>>>16)&0xff, n: (data[6]>>>24)&0xff,}, ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[3]>> 0)&0xffff, v: (data[3]>>16)&0xffff,}, { h: (data[5]>> 0)&0xffff, v: (data[5]>>16)&0xffff,}, { h: (data[7]>> 0)&0xffff, v: (data[7]>>16)&0xffff,}, ]}; var cr = []; var vx = []; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (var i=0; i<3; i++) { cr.push(k.cr[i].a, k.cr[i].b, k.cr[i].c, b[1]); vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.uniform1i(attrib._e, false); ctx.disableVertexAttribArray(attrib._t); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays( ctx.TRIANGLE_STRIP, 0, 3); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x34: // POLY GT3
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,}, { a: (data[3]>>> 0)&0xff, b: (data[3]>>> 8)&0xff, c: (data[3]>>>16)&0xff, n: (data[3]>>>24)&0xff,}, { a: (data[6]>>> 0)&0xff, b: (data[6]>>> 8)&0xff, c: (data[6]>>>16)&0xff, n: (data[6]>>>24)&0xff,}, { a: (data[9]>>> 0)&0xff, b: (data[9]>>> 8)&0xff, c: (data[9]>>>16)&0xff, n: (data[9]>>>24)&0xff,}, ], vx: [ { h: (data[ 1]>> 0)&0xffff, v: (data[ 1]>>16)&0xffff,}, { h: (data[ 4]>> 0)&0xffff, v: (data[ 4]>>16)&0xffff,}, { h: (data[ 7]>> 0)&0xffff, v: (data[ 7]>>16)&0xffff,}, { h: (data[10]>> 0)&0xffff, v: (data[10]>>16)&0xffff,}, ], tx: [ { u: (data[ 2]>>>0)&0xff, v: (data[ 2]>>>8)&0xff,}, { u: (data[ 5]>>>0)&0xff, v: (data[ 5]>>>8)&0xff,}, { u: (data[ 8]>>>0)&0xff, v: (data[ 8]>>>8)&0xff,}, { u: (data[11]>>>0)&0xff, v: (data[11]>>>8)&0xff,}, ], tp: [ (data[2]>>>16)&0xffff, (data[5]>>>16)&0xffff, ]}; var cr = []; var vx = []; var tx = []; blend = (k.tp[1]>>>5)&3; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (var i=0; i<3; i++) { cr.push(k.cr[i].a, k.cr[i].b, k.cr[i].c, b[1]); vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v); tx.push(k.tx[i].u, k.tx[i].v); } pseudo.CstrTexCache.fetchTexture(ctx, k.tp[1], k.tp[0]); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); for (var i in tx) { tx[i] /= 256.0; } ctx.uniform1i(attrib._e, true); ctx.enableVertexAttribArray(attrib._t); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._t); ctx.vertexAttribPointer(attrib._t, 2, ctx.FLOAT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(tx), ctx.DYNAMIC_DRAW); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 3); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x38: // POLY G4
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,}, { a: (data[2]>>> 0)&0xff, b: (data[2]>>> 8)&0xff, c: (data[2]>>>16)&0xff, n: (data[2]>>>24)&0xff,}, { a: (data[4]>>> 0)&0xff, b: (data[4]>>> 8)&0xff, c: (data[4]>>>16)&0xff, n: (data[4]>>>24)&0xff,}, { a: (data[6]>>> 0)&0xff, b: (data[6]>>> 8)&0xff, c: (data[6]>>>16)&0xff, n: (data[6]>>>24)&0xff,}, ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[3]>> 0)&0xffff, v: (data[3]>>16)&0xffff,}, { h: (data[5]>> 0)&0xffff, v: (data[5]>>16)&0xffff,}, { h: (data[7]>> 0)&0xffff, v: (data[7]>>16)&0xffff,}, ]}; var cr = []; var vx = []; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (var i=0; i<4; i++) { cr.push(k.cr[i].a, k.cr[i].b, k.cr[i].c, b[1]); vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.uniform1i(attrib._e, false); ctx.disableVertexAttribArray(attrib._t); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays( ctx.TRIANGLE_STRIP, 0, 4); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x3c: // POLY GT4
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,}, { a: (data[3]>>> 0)&0xff, b: (data[3]>>> 8)&0xff, c: (data[3]>>>16)&0xff, n: (data[3]>>>24)&0xff,}, { a: (data[6]>>> 0)&0xff, b: (data[6]>>> 8)&0xff, c: (data[6]>>>16)&0xff, n: (data[6]>>>24)&0xff,}, { a: (data[9]>>> 0)&0xff, b: (data[9]>>> 8)&0xff, c: (data[9]>>>16)&0xff, n: (data[9]>>>24)&0xff,}, ], vx: [ { h: (data[ 1]>> 0)&0xffff, v: (data[ 1]>>16)&0xffff,}, { h: (data[ 4]>> 0)&0xffff, v: (data[ 4]>>16)&0xffff,}, { h: (data[ 7]>> 0)&0xffff, v: (data[ 7]>>16)&0xffff,}, { h: (data[10]>> 0)&0xffff, v: (data[10]>>16)&0xffff,}, ], tx: [ { u: (data[ 2]>>>0)&0xff, v: (data[ 2]>>>8)&0xff,}, { u: (data[ 5]>>>0)&0xff, v: (data[ 5]>>>8)&0xff,}, { u: (data[ 8]>>>0)&0xff, v: (data[ 8]>>>8)&0xff,}, { u: (data[11]>>>0)&0xff, v: (data[11]>>>8)&0xff,}, ], tp: [ (data[2]>>>16)&0xffff, (data[5]>>>16)&0xffff, ]}; var cr = []; var vx = []; var tx = []; blend = (k.tp[1]>>>5)&3; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (var i=0; i<4; i++) { cr.push(k.cr[i].a, k.cr[i].b, k.cr[i].c, b[1]); vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v); tx.push(k.tx[i].u, k.tx[i].v); } pseudo.CstrTexCache.fetchTexture(ctx, k.tp[1], k.tp[0]); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); for (var i in tx) { tx[i] /= 256.0; } ctx.uniform1i(attrib._e, true); ctx.enableVertexAttribArray(attrib._t); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._t); ctx.vertexAttribPointer(attrib._t, 2, ctx.FLOAT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(tx), ctx.DYNAMIC_DRAW); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x40: // LINE F2
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,} ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[2]>> 0)&0xffff, v: (data[2]>>16)&0xffff,}, { h: (data[3]>> 0)&0xffff, v: (data[3]>>16)&0xffff,}, { h: (data[4]>> 0)&0xffff, v: (data[4]>>16)&0xffff,}, ]}; var cr = []; var vx = []; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (var i=0; i<2; i++) { cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]); vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.uniform1i(attrib._e, false); ctx.disableVertexAttribArray(attrib._t); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays( ctx.LINE_STRIP, 0, 2); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x48: // LINE F3
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,} ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[2]>> 0)&0xffff, v: (data[2]>>16)&0xffff,}, { h: (data[3]>> 0)&0xffff, v: (data[3]>>16)&0xffff,}, { h: (data[4]>> 0)&0xffff, v: (data[4]>>16)&0xffff,}, ]}; var cr = []; var vx = []; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (var i=0; i<3; i++) { cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]); vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.uniform1i(attrib._e, false); ctx.disableVertexAttribArray(attrib._t); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays( ctx.LINE_STRIP, 0, 3); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x4c: // LINE F4
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,} ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[2]>> 0)&0xffff, v: (data[2]>>16)&0xffff,}, { h: (data[3]>> 0)&0xffff, v: (data[3]>>16)&0xffff,}, { h: (data[4]>> 0)&0xffff, v: (data[4]>>16)&0xffff,}, ]}; var cr = []; var vx = []; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (var i=0; i<4; i++) { cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]); vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.uniform1i(attrib._e, false); ctx.disableVertexAttribArray(attrib._t); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays( ctx.LINE_STRIP, 0, 4); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x50: // LINE cop2d.ub[(22<<2)+1]
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,}, { a: (data[2]>>> 0)&0xff, b: (data[2]>>> 8)&0xff, c: (data[2]>>>16)&0xff, n: (data[2]>>>24)&0xff,}, { a: (data[4]>>> 0)&0xff, b: (data[4]>>> 8)&0xff, c: (data[4]>>>16)&0xff, n: (data[4]>>>24)&0xff,}, { a: (data[6]>>> 0)&0xff, b: (data[6]>>> 8)&0xff, c: (data[6]>>>16)&0xff, n: (data[6]>>>24)&0xff,}, ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[3]>> 0)&0xffff, v: (data[3]>>16)&0xffff,}, { h: (data[5]>> 0)&0xffff, v: (data[5]>>16)&0xffff,}, { h: (data[7]>> 0)&0xffff, v: (data[7]>>16)&0xffff,}, ]}; var cr = []; var vx = []; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (var i=0; i<2; i++) { cr.push(k.cr[i].a, k.cr[i].b, k.cr[i].c, b[1]); vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.uniform1i(attrib._e, false); ctx.disableVertexAttribArray(attrib._t); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays( ctx.LINE_STRIP, 0, 2); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x58: // LINE G3
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,}, { a: (data[2]>>> 0)&0xff, b: (data[2]>>> 8)&0xff, c: (data[2]>>>16)&0xff, n: (data[2]>>>24)&0xff,}, { a: (data[4]>>> 0)&0xff, b: (data[4]>>> 8)&0xff, c: (data[4]>>>16)&0xff, n: (data[4]>>>24)&0xff,}, { a: (data[6]>>> 0)&0xff, b: (data[6]>>> 8)&0xff, c: (data[6]>>>16)&0xff, n: (data[6]>>>24)&0xff,}, ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[3]>> 0)&0xffff, v: (data[3]>>16)&0xffff,}, { h: (data[5]>> 0)&0xffff, v: (data[5]>>16)&0xffff,}, { h: (data[7]>> 0)&0xffff, v: (data[7]>>16)&0xffff,}, ]}; var cr = []; var vx = []; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (var i=0; i<3; i++) { cr.push(k.cr[i].a, k.cr[i].b, k.cr[i].c, b[1]); vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.uniform1i(attrib._e, false); ctx.disableVertexAttribArray(attrib._t); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays( ctx.LINE_STRIP, 0, 3); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x5c: // LINE G4
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,}, { a: (data[2]>>> 0)&0xff, b: (data[2]>>> 8)&0xff, c: (data[2]>>>16)&0xff, n: (data[2]>>>24)&0xff,}, { a: (data[4]>>> 0)&0xff, b: (data[4]>>> 8)&0xff, c: (data[4]>>>16)&0xff, n: (data[4]>>>24)&0xff,}, { a: (data[6]>>> 0)&0xff, b: (data[6]>>> 8)&0xff, c: (data[6]>>>16)&0xff, n: (data[6]>>>24)&0xff,}, ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[3]>> 0)&0xffff, v: (data[3]>>16)&0xffff,}, { h: (data[5]>> 0)&0xffff, v: (data[5]>>16)&0xffff,}, { h: (data[7]>> 0)&0xffff, v: (data[7]>>16)&0xffff,}, ]}; var cr = []; var vx = []; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); for (var i=0; i<4; i++) { cr.push(k.cr[i].a, k.cr[i].b, k.cr[i].c, b[1]); vx.push(k.vx[i].h+ofs.h, k.vx[i].v+ofs.v); } ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.uniform1i(attrib._e, false); ctx.disableVertexAttribArray(attrib._t); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays( ctx.LINE_STRIP, 0, 4); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x60: // TILE S
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,} ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[2]>> 0)&0xffff, v: (data[2]>>16)&0xffff,}, ]}; var cr = []; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); if (0) { k.vx[1].h = 0; k.vx[1].v = 0; } for (var i=0; i<4; i++) { cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]); } var vx = [ k.vx[0].h+ofs.h, k.vx[0].v+ofs.v, k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v, k.vx[0].h+ofs.h, k.vx[0].v+ofs.v+k.vx[1].v, k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v+k.vx[1].v, ]; ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.uniform1i(attrib._e, false); ctx.disableVertexAttribArray(attrib._t); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x64: // SPRITE S
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,} ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[3]>> 0)&0xffff, v: (data[3]>>16)&0xffff,}, ], tx: [ { u: (data[2]>>>0)&0xff, v: (data[2]>>>8)&0xff,} ], tp: [ (data[2]>>>16)&0xffff ]}; var cr = []; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); if (0) { k.vx[1].h = 0; k.vx[1].v = 0; } for (var i=0; i<4; i++) { if (k.cr[0].n&1) { cr.push(255>>>1, 255>>>1, 255>>>1, b[1]); } else { cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]); } } var vx = [ k.vx[0].h+ofs.h, k.vx[0].v+ofs.v, k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v, k.vx[0].h+ofs.h, k.vx[0].v+ofs.v+k.vx[1].v, k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v+k.vx[1].v, ]; var tx = [ k.tx[0].u, k.tx[0].v, k.tx[0].u+k.vx[1].h, k.tx[0].v, k.tx[0].u, k.tx[0].v+k.vx[1].v, k.tx[0].u+k.vx[1].h, k.tx[0].v+k.vx[1].v, ]; pseudo.CstrTexCache.fetchTexture(ctx, spriteTP, k.tp[0]); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); for (var i in tx) { tx[i] /= 256.0; } ctx.uniform1i(attrib._e, true); ctx.enableVertexAttribArray(attrib._t); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._t); ctx.vertexAttribPointer(attrib._t, 2, ctx.FLOAT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(tx), ctx.DYNAMIC_DRAW); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x68: // TILE 1
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,} ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[2]>> 0)&0xffff, v: (data[2]>>16)&0xffff,}, ]}; var cr = []; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); if (1) { k.vx[1].h = 1; k.vx[1].v = 1; } for (var i=0; i<4; i++) { cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]); } var vx = [ k.vx[0].h+ofs.h, k.vx[0].v+ofs.v, k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v, k.vx[0].h+ofs.h, k.vx[0].v+ofs.v+k.vx[1].v, k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v+k.vx[1].v, ]; ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.uniform1i(attrib._e, false); ctx.disableVertexAttribArray(attrib._t); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x70: // TILE 8
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,} ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[2]>> 0)&0xffff, v: (data[2]>>16)&0xffff,}, ]}; var cr = []; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); if (8) { k.vx[1].h = 8; k.vx[1].v = 8; } for (var i=0; i<4; i++) { cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]); } var vx = [ k.vx[0].h+ofs.h, k.vx[0].v+ofs.v, k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v, k.vx[0].h+ofs.h, k.vx[0].v+ofs.v+k.vx[1].v, k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v+k.vx[1].v, ]; ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.uniform1i(attrib._e, false); ctx.disableVertexAttribArray(attrib._t); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x74: // SPRITE 8
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,} ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[3]>> 0)&0xffff, v: (data[3]>>16)&0xffff,}, ], tx: [ { u: (data[2]>>>0)&0xff, v: (data[2]>>>8)&0xff,} ], tp: [ (data[2]>>>16)&0xffff ]}; var cr = []; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); if (8) { k.vx[1].h = 8; k.vx[1].v = 8; } for (var i=0; i<4; i++) { if (k.cr[0].n&1) { cr.push(255>>>1, 255>>>1, 255>>>1, b[1]); } else { cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]); } } var vx = [ k.vx[0].h+ofs.h, k.vx[0].v+ofs.v, k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v, k.vx[0].h+ofs.h, k.vx[0].v+ofs.v+k.vx[1].v, k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v+k.vx[1].v, ]; var tx = [ k.tx[0].u, k.tx[0].v, k.tx[0].u+k.vx[1].h, k.tx[0].v, k.tx[0].u, k.tx[0].v+k.vx[1].v, k.tx[0].u+k.vx[1].h, k.tx[0].v+k.vx[1].v, ]; pseudo.CstrTexCache.fetchTexture(ctx, spriteTP, k.tp[0]); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); for (var i in tx) { tx[i] /= 256.0; } ctx.uniform1i(attrib._e, true); ctx.enableVertexAttribArray(attrib._t); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._t); ctx.vertexAttribPointer(attrib._t, 2, ctx.FLOAT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(tx), ctx.DYNAMIC_DRAW); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x78: // TILE 16
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,} ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[2]>> 0)&0xffff, v: (data[2]>>16)&0xffff,}, ]}; var cr = []; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); if (16) { k.vx[1].h = 16; k.vx[1].v = 16; } for (var i=0; i<4; i++) { cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]); } var vx = [ k.vx[0].h+ofs.h, k.vx[0].v+ofs.v, k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v, k.vx[0].h+ofs.h, k.vx[0].v+ofs.v+k.vx[1].v, k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v+k.vx[1].v, ]; ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); ctx.uniform1i(attrib._e, false); ctx.disableVertexAttribArray(attrib._t); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4); ctx.disable(ctx.SCISSOR_TEST);};
          return;

        case 0x7c: // SPRITE 16
          { var k = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,} ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[3]>> 0)&0xffff, v: (data[3]>>16)&0xffff,}, ], tx: [ { u: (data[2]>>>0)&0xff, v: (data[2]>>>8)&0xff,} ], tp: [ (data[2]>>>16)&0xffff ]}; var cr = []; var b = [ k.cr[0].n&2 ? blend : 0, k.cr[0].n&2 ? bit[blend].opaque : 255 ]; ctx.blendFunc(bit[b[0]].src, bit[b[0]].target); if (16) { k.vx[1].h = 16; k.vx[1].v = 16; } for (var i=0; i<4; i++) { if (k.cr[0].n&1) { cr.push(255>>>1, 255>>>1, 255>>>1, b[1]); } else { cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, b[1]); } } var vx = [ k.vx[0].h+ofs.h, k.vx[0].v+ofs.v, k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v, k.vx[0].h+ofs.h, k.vx[0].v+ofs.v+k.vx[1].v, k.vx[0].h+ofs.h+k.vx[1].h, k.vx[0].v+ofs.v+k.vx[1].v, ]; var tx = [ k.tx[0].u, k.tx[0].v, k.tx[0].u+k.vx[1].h, k.tx[0].v, k.tx[0].u, k.tx[0].v+k.vx[1].v, k.tx[0].u+k.vx[1].h, k.tx[0].v+k.vx[1].v, ]; pseudo.CstrTexCache.fetchTexture(ctx, spriteTP, k.tp[0]); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW); for (var i in tx) { tx[i] /= 256.0; } ctx.uniform1i(attrib._e, true); ctx.enableVertexAttribArray(attrib._t); ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._t); ctx.vertexAttribPointer(attrib._t, 2, ctx.FLOAT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(tx), ctx.DYNAMIC_DRAW); ctx.enable(ctx.SCISSOR_TEST); ctx.scissor(drawArea.start.h, drawArea.start.v, drawArea.end.h, drawArea.end.v); ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4); ctx.disable(ctx.SCISSOR_TEST);};
          return;
      }

      // Operations
      switch(addr) {
        case 0x01: // FLUSH
          return;

        case 0x02: // BLOCK FILL
          {
            var k  = { cr: [ { a: (data[0]>>> 0)&0xff, b: (data[0]>>> 8)&0xff, c: (data[0]>>>16)&0xff, n: (data[0]>>>24)&0xff,} ], vx: [ { h: (data[1]>> 0)&0xffff, v: (data[1]>>16)&0xffff,}, { h: (data[2]>> 0)&0xffff, v: (data[2]>>16)&0xffff,}, ]};
            var cr = [];

            for (var i=0; i<4; i++) {
              cr.push(k.cr[0].a, k.cr[0].b, k.cr[0].c, 255);
            }

            var vx = [
              k.vx[0].h,           k.vx[0].v,
              k.vx[0].h+k.vx[1].h, k.vx[0].v,
              k.vx[0].h,           k.vx[0].v+k.vx[1].v,
              k.vx[0].h+k.vx[1].h, k.vx[0].v+k.vx[1].v,
            ];

            ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._c); ctx.vertexAttribPointer(attrib._c, 4, ctx.UNSIGNED_BYTE, true, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Uint8Array(cr), ctx.DYNAMIC_DRAW);
            ctx.bindBuffer(ctx.ARRAY_BUFFER, bfr._v); ctx.vertexAttribPointer(attrib._p, 2, ctx.SHORT, false, 0, 0); ctx.bufferData(ctx.ARRAY_BUFFER, new Int16Array(vx), ctx.DYNAMIC_DRAW);
            ctx.uniform1i(attrib._e, false); ctx.disableVertexAttribArray(attrib._t);
            ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
          }
          return;

        case 0x80: // MOVE IMAGE
          return;

        case 0xa0: // LOAD IMAGE
          pseudo.CstrGraphics.inread(data);
          return;

        case 0xc0: // STORE IMAGE
          return;

        case 0xe1: // TEXTURE PAGE
          blend = (data[0]>>>5)&3;
          spriteTP = data[0]&0x7ff;
          pseudo.CstrGraphics.texp(spriteTP);
          ctx.blendFunc(bit[blend].src, bit[blend].target);
          return;

        case 0xe2: // TEXTURE WINDOW
          info[2] = data[0]&0xfffff;
          return;

        case 0xe3: // DRAW AREA START
          {
            var pane = {
              h: data[0]&0x3ff, v: (data[0]>>10)&0x1ff
            };

            drawArea.start.h = drawAreaCalc(pane.h);
            drawArea.start.v = drawAreaCalc(pane.v);

            info[3] = data[0]&0x3fffff;
          }
          return;

        case 0xe4: // DRAW AREA END
          {
            var pane = {
              h: data[0]&0x3ff, v: (data[0]>>10)&0x1ff
            };

            drawArea.end.h = drawAreaCalc(pane.h);
            drawArea.end.v = drawAreaCalc(pane.v);

            info[4] = data[0]&0x3fffff;
          }
          return;

        case 0xe5: // DRAW OFFSET
          ofs.h = (((data[0])<<0>>0)<<21)>>21;
          ofs.v = (((data[0])<<0>>0)<<10)>>21;

          info[5] = data[0]&0x7fffff;
          return;

        case 0xe6: // STP
          pseudo.CstrGraphics.stp(data);
          return;
      }
      pseudo.CstrMips.consoleWrite('error', 'GPU Render Primitive '+('0x'+(addr>>>0).toString(16)));
    },

    infoRead(n) {
      return info[n];
    }
  };
})();
// Based on PCSX 1.5











pseudo.CstrSerial = (function() {
  var baud, control, mode, status, bfrCount, padst, parp;

  var bfr = new Uint8Array(256);

  return {
    reset() {
      bfr.fill(0);
      baud     = 0;
      control  = 0;
      mode     = 0;
      status   = 0x001 | 0x004;
      bfrCount = 0;
      padst    = 0;
      parp     = 0;
    },

    write: {
      h(addr, data) {
        switch(addr) {
          case 0x1048: // Mode
            mode = data;
            return;

          case 0x104a: // Control
            control = data;

            if (control&0x010) {
              status  &= ~0x200;
              control &= ~0x010;
            }

            if (control&0x040 || !control) {
              status = 0x001 | 0x004;
              padst  = 0;
              parp   = 0;
            }
            return;

          case 0x104e: // Baud
            baud = data;
            return;
        }
        pseudo.CstrMain.error('SIO write h '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      },

      b(addr, data) {
        switch(addr) {
          case 0x1040:
            switch(padst) {
              case 1:
                if (data&0x40) {
                  padst = 2;
                  parp  = 1;

                  switch(data) {
                    case 0x42:
                      bfr[1] = 0x41; //parp
                      break;

                    case 0x43:
                      bfr[1] = 0x43; //parp
                      break;

                    case 0x45:
                      bfr[1] = 0xf3; //parp
                      bfr[3] = 0x00;
                      bfr[4] = 0x00;
                      break;

                    default:
                      console.dir('SIO write b data '+('0x'+(data>>>0).toString(16)));
                      break;
                  }
                }
                pseudo.CstrBus.interruptSet(7);
                return;

              case 2:
                parp++;
                
                if (parp !== bfrCount) {
                  pseudo.CstrBus.interruptSet(7);
                }
                else {
                  padst = 0;
                }
                return;
            }

            if (data === 1) {
              status &= ~0x004;
              status |=  0x002;
              padst = 1;
              parp  = 0;

              if (control&0x002) {
                switch(control) {
                  case 0x1003:
                  case 0x3003:
                    bfrCount = 4;
                    bfr[0] = 0x00;
                    bfr[1] = 0x41;
                    bfr[2] = 0x5a;
                    bfr[3] = 0xff;
                    bfr[4] = 0xff;
                    pseudo.CstrBus.interruptSet(7);
                    return;
                }
              }
            }
            return;
        }
        pseudo.CstrMain.error('SIO write b '+('0x'+(addr>>>0).toString(16))+' <- '+('0x'+(data>>>0).toString(16)));
      }
    },

    read: {
      h(addr) {
        switch(addr) {
          case 0x1044:
            return status;

          case 0x104a:
            return control;

          case 0x104e:
            return baud;
        }
        pseudo.CstrMain.error('SIO read h '+('0x'+(addr>>>0).toString(16)));
      },

      b(addr) {
        switch(addr) {
          case 0x1040:
            {
              if (!(status&0x002)) {
                return 0;
              }

              if (parp === bfrCount) {
                status &= ~0x002;
                status |=  0x004;
              }
              return bfr[parp];
            }
        }
        pseudo.CstrMain.error('SIO read b '+('0x'+(addr>>>0).toString(16)));
      }
    }
  };
})();
// Based on FPSE 0.08









pseudo.CstrTexCache = (function() {
  var stack, idx;

  var bTex  = union(256*256*4);
  var ctbl2 = union(256*4);

  function pixel2texel(tx, p, n) {
    do {
      var c = pseudo.CstrGraphics.__vram.uh[p++];
      tx.ub[idx++] = (c>>0x0)<<3;
      tx.ub[idx++] = (c>>0x5)<<3;
      tx.ub[idx++] = (c>>0xa)<<3;
      tx.ub[idx++] = c ? 255 : 0;
    }
    while (--n);
  }

  return {
    reset() {
      stack = [];
    },

    fetchTexture(ctx, tp, clut) {
      var id = tp | (clut<<16);
      
      if (stack[id]) {
        ctx.bindTexture(ctx.TEXTURE_2D, stack[id]);
        return;
      }

      var tex  = (tp&15)*64+(tp&16)*(1024*256/16);
      var ctbl = (clut&0x7fff)*16;

      switch((tp>>7)&3) {
        case 0: // 04-bit
          idx = 0;
          pixel2texel(ctbl2, ctbl, 16);
          idx = 0;
          for (var v=0; v<256; v++) {
            for (var h=0; h<256/4; h++) {
              var c = pseudo.CstrGraphics.__vram.uh[tex+h];
              bTex.uw[idx++] = ctbl2.uw[(c>> 0)&15];
              bTex.uw[idx++] = ctbl2.uw[(c>> 4)&15];
              bTex.uw[idx++] = ctbl2.uw[(c>> 8)&15];
              bTex.uw[idx++] = ctbl2.uw[(c>>12)&15];
            }
            tex += 1024;
          }
          break;

        case 1: // 08-bit
          idx = 0;
          pixel2texel(ctbl2, ctbl, 256);
          idx = 0;
          for (var v=0; v<256; v++) {
            for (var h=0; h<256/2; h++) {
              var c = pseudo.CstrGraphics.__vram.uh[tex+h];
              bTex.uw[idx++] = ctbl2.uw[(c>>0)&255];
              bTex.uw[idx++] = ctbl2.uw[(c>>8)&255];
            }
            tex += 1024;
          }
          break;

        case 2: // 16-bit
          idx = 0;
          for (var v=0; v<256; v++) {
            pixel2texel(bTex, tex, 256);
            tex += 1024;
          }
          break;
      }

      // Create texture
      stack[id] = ctx.createTexture();
      ctx.bindTexture  (ctx.TEXTURE_2D, stack[id]);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
      ctx.texImage2D   (ctx.TEXTURE_2D, 0, ctx.RGBA, 256, 256, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, bTex.ub);
    }
  };
})();





















pseudo.CstrGraphics = (function() {
  var status, data, modeDMA;

  // VRAM Operations
  var vrop = {
    h: {},
    v: {},
  };

  // Command Pipe
  var pipe = {
    data: new Uint32Array(100)
  };

  // Primitive Size
  var sizePrim = [
    0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x00
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x10
    4, 4, 4, 4, 7, 7, 7, 7, 5, 5, 5, 5, 9, 9, 9, 9, // 0x20
    6, 6, 6, 6, 9, 9, 9, 9, 8, 8, 8, 8,12,12,12,12, // 0x30
    3, 3, 3, 3, 0, 0, 0, 0, 5, 5, 5, 5, 6, 6, 6, 6, // 0x40
    4, 4, 4, 4, 0, 0, 0, 0, 7, 7, 7, 7, 9, 9, 9, 9, // 0x50
    3, 3, 3, 3, 4, 4, 4, 4, 2, 2, 2, 2, 0, 0, 0, 0, // 0x60
    2, 2, 2, 2, 3, 3, 3, 3, 2, 2, 2, 2, 3, 3, 3, 3, // 0x70
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x80
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0x90
    3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xa0
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xb0
    3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xc0
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xd0
    0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xe0
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0xf0
  ];

  // Resolution Mode
  var resMode = [
    256, 320, 512, 640, 368, 384, 512, 640
  ];

  function infoSet(n) {
    data = pseudo.CstrRender.infoRead[n&0xff];
  }

  function fetchFromRAM(stream, addr, size) {
    var count = 0;

    // False alarm!
    if (!vrop.enabled) {
      modeDMA = 0;
      return 0;
    }
    size <<= 1;

    while (vrop.v.p < vrop.v.end) {
      while (vrop.h.p < vrop.h.end) {
        // Keep position of pseudo.CstrGraphics.__vram
        var pos = (vrop.v.p<<10)+vrop.h.p;

        // Check if it`s a 16-bit (stream), or a 32-bit (command) address
        if (stream) {
          pseudo.CstrGraphics.__vram.uh[pos] = pseudo.CstrMem.__ram.uh[(( addr)&(pseudo.CstrMem.__ram.uh.byteLength-1))>>>1];
        }
        else { // A dumb hack for now
          if (!(count%2)) {
            pseudo.CstrGraphics.__vram.uw[pos>>>1] = addr;
          }
        }

        addr += 2;
        vrop.h.p++;

        if (++count === size) {
          if (vrop.h.p === vrop.h.end) {
            vrop.h.p = vrop.h.start;
            vrop.v.p++;
          }
          return fetchEnd(count);
        }
      }

      vrop.h.p = vrop.h.start;
      vrop.v.p++;
    }
    return fetchEnd(count);
  }

  function fetchEnd(count) {
    if (vrop.v.p >= vrop.v.end) {
      modeDMA = 0;
      vrop.enabled = false;

      // if (count%2 === 1) {
      //     count++;
      // }
    }
    return count>>1;
  }

  var dataMem = {
    write(stream, addr, size) {
      var i = 0;
      
      while (i < size) {
        if (modeDMA === 2) {
          if ((i += fetchFromRAM(stream, addr, size-i)) >= size) {
            continue;
          }
          addr += i;
        }
        
        data = stream ? pseudo.CstrMem.__ram.uw[(( addr)&(pseudo.CstrMem.__ram.uw.byteLength-1))>>>2] : addr;
        addr += 4;
        i++;

        if (!pipe.size) {
          var prim  = (data>>>24)&0xff;
          var count = sizePrim[prim];

          if (count) {
            pipe.data[0] = data;
            pipe.prim = prim;
            pipe.size = count;
            pipe.row  = 1;
          }
          else {
            continue;
          }
        }
        else {
          pipe.data[pipe.row] = data;
          pipe.row++;
        }

        if (pipe.size === pipe.row) {
          pipe.size = 0;
          pipe.row  = 0;

          pseudo.CstrRender.draw(pipe.prim, pipe.data);
        }
      }
    },

    read(addr, size) {
      // Oops
    }
  }

  function pipeReset() {
    pipe.data.fill(0);
    pipe.prim = 0;
    pipe.size = 0;
    pipe.row  = 0;
  }

  // Exposed class functions/variables
  return {
    __vram: union(1024*512*2),

    reset() {
      pseudo.CstrGraphics.__vram.uh.fill(0);
      status  = 0x14802000;
      data    = 0x400;
      modeDMA = 0;

      // VRAM Operations
      vrop.enabled = false;
      vrop.h.p     = 0;
      vrop.h.start = 0;
      vrop.h.end   = 0;
      vrop.v.p     = 0;
      vrop.v.start = 0;
      vrop.v.end   = 0;

      // Command Pipe
      pipeReset();
    },

    redraw() {
      status ^= 0x80000000;
    },

    scopeW(addr, data) {
      switch(addr&0xf) {
        case 0:
          dataMem.write(false, data, 1);
          return;

        case 4:
          switch((data>>>24)&0xff) {
            case 0x00:
              status = 0x14802000;
              return;

            case 0x01:
              pipeReset();
              return;

            case 0x04:
              modeDMA = data&3;
              return;

            case 0x08:
              pseudo.CstrRender.resize({
                w: resMode[(data&3) | ((data&0x40)>>>4)],
                h: (data&4) ? 480 : 240
              });
              return;

            case 0x10:
              infoSet(data);
              return;

            
            case 0x02:
            case 0x03:
            case 0x05:
            case 0x06:
            case 0x07:
              return;
          }
          pseudo.CstrMain.error('GPU Write Status '+('0x'+((data>>>24)&0xff>>>0).toString(16)));
          return;
      }
    },

    scopeR(addr) {
      switch(addr&0xf) {
        case 0:
          return data;

        case 4:
          status |=  0x08000000;
          status &= ~0x00080000;
          return status;
      }
    },

    executeDMA(addr) {
      var size = (pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|4)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]>>16)*(pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|4)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]&0xffff);

      switch(pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|8)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]) {
        case 0x00000401: // Disable DMA?
          return;

        case 0x01000200:
          dataMem.read(pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2], size);
          return;

        case 0x01000201:
          dataMem.write(true, pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2], size);
          return;

        case 0x01000401:
          while (pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2] !== 0xffffff) {
            var count = pseudo.CstrMem.__ram.uw[(( pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2])&(pseudo.CstrMem.__ram.uw.byteLength-1))>>>2];
            dataMem.write(true, (pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]+4)&0x1ffffc, count>>>24);
            pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|0)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2] = count&0xffffff;
          }
          return;
      }
      pseudo.CstrMain.error('GPU DMA '+('0x'+(pseudo.CstrMem.__hwr.uw[(((addr&0xfff0)|8)&(pseudo.CstrMem.__hwr.uw.byteLength-1))>>>2]>>>0).toString(16)));
    },

    inread(data) {
      var k = { n2: (data[1]>>> 0)&0xffff, n3: (data[1]>>>16)&0xffff, n4: (data[2]>>> 0)&0xffff, n5: (data[2]>>>16)&0xffff,};

      vrop.enabled = true;
      vrop.h.p     = vrop.h.start = k.n2;
      vrop.v.p     = vrop.v.start = k.n3;
      vrop.h.end   = vrop.h.start + k.n4;
      vrop.v.end   = vrop.v.start + k.n5;
      
      modeDMA = 2;
    },

    texp(spriteTP) {
      status = (status&(~0x7ff)) | spriteTP;
    },

    stp(data) {
      status = (status&(~(3<<11))) | ((data[0]&3)<<11);
    }
  };
})();


