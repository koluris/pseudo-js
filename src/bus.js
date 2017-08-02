#define hwr  mem.__hwr

#define IRQ_QUEUED_YES 1
#define IRQ_QUEUED_NO  0

pseudo.CstrBus = (function() {
  var interrupts = [{
    code: IRQ_VSYNC,
    dest: 1
  }, {
    code: IRQ_GPU,
    dest: 1
  }, {
    code: IRQ_CD,
    dest: 4
  }, {
    code: IRQ_DMA,
    dest: 1
  }, {
    code: IRQ_RTC0,
    dest: 1
  }, {
    code: IRQ_RTC1,
    dest: 1
  }, {
    code: IRQ_RTC2,
    dest: 1
  }, {
    code: IRQ_SIO0,
    dest: 8
  }, {
    code: IRQ_SIO1,
    dest: 8
  }, {
    code: IRQ_SPU,
    dest: 1
  }, {
    code: IRQ_PIO,
    dest: 1
  }];

  // Exposed class functions/variables
  return {
    reset() {
      for (var item of interrupts) {
        item.queued = IRQ_QUEUED_NO;
      }
    },

    interruptsUpdate() { // A method to schedule when IRQs should fire
      for (var item of interrupts) {
        if (item.queued) {
          if (item.queued++ === item.dest) {
            data16 |= (1<<item.code);
            item.queued = IRQ_QUEUED_NO;
            break;
          }
        }
      }
    },

    interruptSet(n) {
      interrupts[n].queued = IRQ_QUEUED_YES;
    },

    checkDMA(addr, data) {
      var chan = ((addr>>>4)&0xf) - 8;

      if (pcr&(8<<(chan*4))) { // GPU does not execute sometimes
        chcr = data;

        switch(chan) {
          case 0: // MDEC in
          case 1: // MDEC out
            break;

          case 2: vs   .executeDMA(addr); break; // Graphics
          case 3: cdrom.executeDMA(addr); break; // CD-ROM
          case 4: audio.executeDMA(addr); break; // Audio
          case 6: mem  .executeDMA(addr); break; // Clear OT

          default:
            psx.error('DMA Channel '+chan);
            break;
        }
        chcr = data & ~0x01000000;

        if (icr&(1<<(16+chan))) {
          icr |= 1<<(24+chan);
          bus.interruptSet(IRQ_DMA);
        }
      }
    }
  };
})();

#undef hwr
