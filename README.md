## Overview
**PSeudo** emulator is being developed using **.h headers** in addition to **.js files**. This technique helps me keep the workspace clean and simple, while at the same time modular code gets inlined for optimization. The codebase is compatible with **ES6 JavaScript** onwards.

![Commercial](https://raw.githubusercontent.com/dkoliris/pseudo/master/res/commercial.jpg)

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

**PSeudo** can load some commercial games, but speed and overall experience is mediocre at best. The emulator is quite inaccurate on timing and this is crucial most of the time. Also, for quite some time I will keep working on it with the provided slow CPU Interpreter. An attempt for speedup will be made later on with a **JavaScript Tracer**.

## How-to
You need to run this project from a localhost server like **Apache**. In order to build **PSeudo**, just run the `build` command on the terminal. You must also include a valid **BIOS** file like "SCPH1001.bin" on the `bios` folder in order to test the emulator. I will not provide information on how and where to find that.
