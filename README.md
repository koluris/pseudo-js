## Overview
**PSeudo** emulator is being developed using **.h headers** in addition to **.js files**. It helps me keep the workspace clean and simple, while at the same time code gets inlined for further optimization. The codebase is compatible with **ES6 Javascript** onwards. Also, please use **Chrome** for best results (this is due to V8 optimization).

## Completion
Here's a list with the overall progress of the emulator, broken down in distinctive hardware parts. Components with 0% progress are not listed.
* `CPU Mips R3000A` -> 90%
* `Mem IO` -> 75%
* `DMA` -> 20%
* `Interrupts` -> 20%
* `Graphics` -> 15%

## How-to
In order to build it, just run the `build` command on the terminal. You must also include a valid **BIOS** file on the `bios` folder in order to test the emulator. I will not provide information on how and where to find that.
