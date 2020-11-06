## Overview
**PSeudo** emulator is being developed using **.h headers** in addition to **.js files**. This technique helps me keep the workspace clean and simple, while at the same time modular code gets inlined for optimization. The codebase is compatible with **ES6 JavaScript** onwards.

<img alt="Bushido Blade" src="https://raw.githubusercontent.com/dkoluris/pseudo-js/master/res/bushido-blade.jpg" width="48.5%"/><img alt="Bust-A-Move" src="https://raw.githubusercontent.com/dkoluris/pseudo-js/master/res/bust-a-move.jpg" width="48.5%" align="right"/>

<img alt="Klonoa" src="https://raw.githubusercontent.com/dkoluris/pseudo-js/master/res/klonoa-1.jpg" width="48.5%"/><img alt="Soul Reaver" src="https://raw.githubusercontent.com/dkoluris/pseudo-js/master/res/soul-reaver-1.jpg" width="48.5%" align="right"/>

## Live Build
https://naden.co/pseudo

## Completion
Here's a list with the overall progress of the emulator, broken down in distinct parts.
* `95% -> CPU Mips R3000A`
* `90% -> DMA`
* `85% -> Mem IO`
* `85% -> Movie Decoder`
* `80% -> Interrupts`
* `75% -> CD Decoder`
* `70% -> GPU Primitives & Commands`
* `65% -> GPU Textures`
* `60% -> Audio`
* `60% -> GTE`
* `55% -> Rootcounters`
* `25% -> Serial IO`
* `10% -> XA Audio`

<img alt="Smash Court Tennis 3" src="https://raw.githubusercontent.com/dkoluris/pseudo-js/master/res/smash-court.jpg" width="48.5%"/><img alt="Tenchu" src="https://raw.githubusercontent.com/dkoluris/pseudo-js/master/res/tenchu.jpg" width="48.5%" align="right"/>

**PSeudo** can load some commercial games, but speed and overall experience is mediocre at best. The emulator is quite inaccurate on timing and this is crucial most of the time. Also, for quite some time I will keep working on it with the provided slow CPU Interpreter. An attempt for speedup will be made later on with a **JavaScript Tracer**.

<img alt="Gran Turismo 2" src="https://raw.githubusercontent.com/dkoluris/pseudo-js/master/res/turismo-2.jpg" width="48.5%"/><img alt="Klonoa" src="https://raw.githubusercontent.com/dkoluris/pseudo-js/master/res/klonoa-3.jpg" width="48.5%" align="right"/>

## How-to
You need to run this project from a localhost server like **Apache**. In order to build **PSeudo**, just run the `build` command on the terminal. You must also include a valid **BIOS** file like "SCPH1001.bin" on the `bios` folder in order to test the emulator. I will not provide information on how and where to find that.
