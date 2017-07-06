![PSeudo](https://raw.githubusercontent.com/dkoliris/pseudo/master/res/motto.png)

## Overview
**PSeudo** emulator is being developed using **.h headers** in addition to **.js files**. It helps me keep the workspace clean and simple, while at the same time code gets inlined for further optimization. The codebase is compatible with **ES6 Javascript** onwards. Also, please use **Chrome** for best results (this is due to V8 optimization).

## Completion
Here's a list with the overall progress of the emulator, broken down in distinct hardware parts. Components with 0% progress are not listed.
* `99% -> BIOS Bootstrap`
* `95% -> PSX-EXE Loader`
* `90% -> CPU Mips R3000A`
* `75% -> Mem IO`
* `25% -> DMA`
* `20% -> Interrupts`
* `15% -> Graphics`
* `10% -> Audio`
* `10% -> Rootcounters`

![PSeudo](https://raw.githubusercontent.com/dkoliris/pseudo/master/res/screenshot.png)

## How-to
You need to run this project from a localhost server, like **Apache**. In order to build **PSeudo**, just run the `build` command on the terminal. You must also include a valid **BIOS** file on the `bios` folder in order to test the emulator. I will not provide information on how and where to find that.
