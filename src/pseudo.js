pseudo.CstrMain = function() {
    return {
        init(screen) {
            const xhr = new XMLHttpRequest();
            xhr.onload = function() {
                render.init(screen);

                const header = new Uint32Array(xhr.response, 0, 0x800);
                const start  = header[4];
                const size   = header[7];

                mem.ram.ub.set(
                    new Uint8Array(xhr.response, 0x800, size), start & (mem.ram.ub.byteLength - 1)
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

const psx = new pseudo.CstrMain();
