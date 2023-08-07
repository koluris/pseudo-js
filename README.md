<h1>PSeudo JS (<a href="https://naden.co">https://naden.co</a>)</h1>

[![GitHub stars](https://img.shields.io/github/stars/dkoluris/pseudo-js.svg?style=flat-square)](https://github.com/dkoluris/pseudo-js/stargazers) [![GitHub license](https://img.shields.io/github/license/dkoluris/pseudo-js.svg?style=flat-square)](https://github.com/dkoluris/pseudo-js/blob/master/LICENSE) [![Twitter](https://img.shields.io/twitter/url/https/github.com/dkoluris/pseudo-js.svg?style=social)](https://twitter.com/intent/tweet?text=Wow:&url=https%3A%2F%2Fgithub.com%2Fdkoluris%2Fpseudo-js)

**PSeudo JS** is a PSX emulator based on JavaScript and is being developed using **.h headers** in addition to **.js files**. This unusual technique helps me keep the workspace clean and simple, while at the same time modular code gets inlined for optimization before runtime on the VM. The codebase is compatible with **ES5 JavaScript** onwards.

<a href="https://www.youtube.com/watch?v=dGA6fzY5bmI">Check out this video demonstration</a>

<img alt="Bushido Blade" src="https://raw.githubusercontent.com/dkoluris/pseudo-js/master/res/bushido-blade.jpg" width="48.5%"/><img alt="Bust-A-Move" src="https://raw.githubusercontent.com/dkoluris/pseudo-js/master/res/bust-a-move.jpg" width="48.5%" align="right"/>

<img alt="Klonoa" src="https://raw.githubusercontent.com/dkoluris/pseudo-js/master/res/klonoa-1.jpg" width="48.5%"/><img alt="Soul Reaver" src="https://raw.githubusercontent.com/dkoluris/pseudo-js/master/res/soul-reaver-1.jpg" width="48.5%" align="right"/>

<h2>Live Build</h2>

https://naden.co/pseudo

<h2>Completion</h2>

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

**PSeudo JS** can load some commercial games, but speed and overall experience is mediocre at best. The emulator is quite inaccurate on timing and this is crucial most of the time. Also, for quite some time I will keep working on it with the provided slow CPU Interpreter. An attempt for speedup will be made later on with a **JavaScript Tracer**.

<img alt="Gran Turismo 2" src="https://raw.githubusercontent.com/dkoluris/pseudo-js/master/res/turismo-2.jpg" width="48.5%"/><img alt="Klonoa" src="https://raw.githubusercontent.com/dkoluris/pseudo-js/master/res/klonoa-3.jpg" width="48.5%" align="right"/>

<h2>Compile / Build</h2>

**PSeudo JS** makes usage of `Clang` compiler to build. In order to build **PSeudo JS**, just run the `build` command on the terminal. You need to run this project from a localhost server like **Apache**. You must also include a valid **BIOS** file like `scph1001.bin` in the `bios` folder in order to test it. I will not provide information on how and where to find this.

<h2>License</h2>

Open-source under [Apache 2.0 license](https://www.apache.org/licenses/LICENSE-2.0).
