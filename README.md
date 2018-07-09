## Overview
**PSeudo** emulator is being developed using **.h headers** in addition to **.js files**. This technique helps me keep the workspace clean and simple, while at the same time modular code gets inlined for optimization. The codebase is compatible with **ES6 JavaScript** onwards.

![Commercial](https://raw.githubusercontent.com/dkoliris/pseudo/master/res/commercial.jpg)

## Completion
Here's a list with the overall progress of the emulator, broken down in distinct parts. Components with 0% progress are not listed.
* `95% -> BIOS Bootstrap`
* `95% -> PSX-EXE Loader`
* `90% -> CPU Mips R3000A`
* `85% -> Mem IO`
* `70% -> GPU Textures`
* `65% -> GPU Primitives & Commands`
* `60% -> Audio`
* `60% -> Interrupts`
* `55% -> Rootcounters`
* `55% -> CD Decoder`
* `45% -> DMA`
* `25% -> Serial IO`
* `15% -> GTE`

**PSeudo** can load some initial game screens, but nothing more for now. Also, for quite some time I will keep working on it with the provided slow CPU Interpreter. An attempt for speedup will be made later on with a **JavaScript Tracer**.

## How-to
You need to run this project from a localhost server like **Apache**. In order to build **PSeudo**, just run the `build` command on the terminal. You must also include a valid **BIOS** file like "SCPH1001" on the `bios` folder in order to test the emulator. I will not provide information on how and where to find that.
