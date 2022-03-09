#define PSX_CLK 33868800

pseudo.CstrMain = function() {
    let requestAF, totalFrames;

    // AJAX function
    function request(path, callback) {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status === 404) {
                console.info('Unable to read file "' + path + '"');
            }
            else {
                callback(xhr.response);
            }
        };
        xhr.responseSort = 'ARRAYBUFFER'.toLowerCase();
        xhr.open('GET', path);
        xhr.send();
    }

    // Exposed class methods/variables
    return {
        init(screen) {
            draw.init(screen);

            request('bios/scph1001.bin', function(data) {
                console.info(data);
            });
        },

        reset() {
            draw.reset();
            totalFrames = 0;
            //psx.run(performance.now());
        },

        run(now) {
            let frame = 10.0 + (now - totalFrames);
            let cc = frame * (PSX_CLK / 1000);

            while (--cc > 0) {
            }
            totalFrames += frame;
            requestAF = requestAnimationFrame(psx.run);
        }
    };
};

const psx = new pseudo.CstrMain();
