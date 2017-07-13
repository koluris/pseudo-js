#define bus\
  pseudo.CstrBus

#define IRQ_VSYNC 0
#define IRQ_GPU   1
#define IRQ_CD    2
#define IRQ_DMA   3
#define IRQ_RTC0  4
#define IRQ_RTC1  5
#define IRQ_RTC2  6
#define IRQ_SIO0  7
#define IRQ_SIO1  8
#define IRQ_SPU   9
#define IRQ_PIO   10

#define pcr\
  directMemW(hwr.uw, 0x10f0)

#define icr\
  directMemW(hwr.uw, 0x10f4)

#define madr\
  directMemW(hwr.uw, (addr&0xfff0)|0)

#define bcr\
  directMemW(hwr.uw, (addr&0xfff0)|4)

#define chcr\
  directMemW(hwr.uw, (addr&0xfff0)|8)
