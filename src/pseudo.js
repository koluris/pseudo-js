pseudo.CstrMain = function() {
    return {
        init(screen) {
            const xhr = new XMLHttpRequest();
            xhr.onload = function() {
                render.init(screen);
                cpu.parseExeHeader(mem.writeExecutable(xhr.response));
                cpu.run();
            };
            xhr.responseSort = dataBin;
            xhr.open('GET', 'print-text.exe');
            xhr.send();
        }
    };
};

const psx = new pseudo.CstrMain();
