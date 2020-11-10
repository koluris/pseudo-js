pseudo.CstrMain = function() {
    return {
        init(screen) {
            const xhr = new XMLHttpRequest();
            xhr.onload = function() {
                render.init(screen);
                mem.writeExecutable(xhr.response);
                cpu.run();
            };
            xhr.responseType = 'arraybuffer';
            xhr.open('GET', 'print-text.exe');
            xhr.send();
        }
    };
};

const psx = new pseudo.CstrMain();
