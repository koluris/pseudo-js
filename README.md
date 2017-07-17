![PSeudo](https://raw.githubusercontent.com/dkoliris/pseudo/master/res/motto.png)

## Overview
**PSeudo** emulator is being developed using **.h headers** in addition to **.js files**. It helps me keep the workspace clean and simple, while at the same time code gets inlined for further optimization. The codebase is compatible with **ES6 JavaScript** onwards. Also, please use **Chrome** browser for best results (this is due to V8 optimization).

Check out the up-to-date [Live version of PSeudo](http://vuemaps.com/pseudo)

![PSeudo](https://raw.githubusercontent.com/dkoliris/pseudo/master/res/screenshot.png)

**Important note to developers:** It's official, the usage of **"let"** and **"const"** ES6 variable declaration is slower than **"var"** about 20% overall. I made a new branch, and I was able to compare both products. I tried to be nice, but... Chrome isn't up to the task for now :)

## Completion
Here's a list with the overall progress of the emulator, broken down in distinct hardware parts. Components with 0% progress are not listed.
* `99% -> BIOS Bootstrap`
* `95% -> PSX-EXE Loader`
* `90% -> CPU Mips R3000A`
* `85% -> Mem IO`
* `70% -> GPU Textures`
* `60% -> GPU Primitives & Commands`
* `45% -> Interrupts`
* `35% -> DMA`
* `20% -> Serial IO`
* `15% -> Rootcounters`
* `10% -> Audio`

![Demos](https://raw.githubusercontent.com/dkoliris/pseudo/master/res/demos.jpg)

**PSeudo** does not run commercial games at this point. I want to be able to run all demos/cractros available first, then proceed with the CD-ROM and MDEC implementation. Also, for quite some time I will keep working on it with the provided CPU Interpreter. An attempt for speedup will be made later on with a **JavaScript Tracer**.

## How-to
You need to run this project from a localhost server, like **Apache**. In order to build **PSeudo**, just run the `build` command on the terminal. You must also include a valid **BIOS** file like "SCPH1001" on the `bios` folder in order to test the emulator. I will not provide information on how and where to find that.
