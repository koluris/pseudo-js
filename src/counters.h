#define rootcnt\
  pseudo.CstrCounters

#define PSX_CLK\
  33868800

// Assume NTSC for now
#define PSX_VSYNC\
  (PSX_CLK/60)

#define PSX_HSYNC\
  (PSX_CLK/15734)

// This is uttermost experimental, it's the Achilles' heel
#define PSX_CYCLE\
  64
