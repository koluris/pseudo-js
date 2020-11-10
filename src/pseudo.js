pseudo.CstrMain = function() {
    return {
        init(screen) {
            render.init(screen);

            let xhr = new XMLHttpRequest();
            xhr.onload = function() {
                let header = new Uint32Array(this.response, 0, 0x800);
                let start  = header[4];
                let size   = header[7];

                mem.ram.ub.set(
                    new Uint8Array(this.response, 0x800, size), start & (mem.ram.ub.byteLength - 1)
                );
                cpu.setpc(start);
                cpu.run();
            };
            xhr.responseType = 'arraybuffer';
            xhr.open('GET', 'print-text.exe');
            xhr.send();
        }
    };
};

let psx = new pseudo.CstrMain();
