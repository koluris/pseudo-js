/***
    Base components
***/

#define RGBC(data) { \
    r: (data >>>  0) & 0xff, \
    g: (data >>>  8) & 0xff, \
    b: (data >>> 16) & 0xff, \
    a: (data >>> 24) & 0xff, \
}

#define POINT(data) { \
    x: (data >>  0) & 0xffff, \
    y: (data >> 16) & 0xffff, \
}

pseudo.CstrRender = function() {
    let ctx;

    // Exposed class functions/variables
    return {
        init(canvas) {
            ctx = canvas.getContext('2d');
        },

        draw(addr, data) {
            switch(addr & 0xfc) {
                case 0x38: // POLY G4
                    {
                        const p = {
                            colors: [
                                RGBC(data[0]),
                                RGBC(data[2]),
                                RGBC(data[4]),
                                RGBC(data[6]),
                            ],
                            points: [
                                POINT(data[1]),
                                POINT(data[3]),
                                POINT(data[5]),
                                POINT(data[7]),
                            ]
                        };

                        const gradient = ctx.createLinearGradient(0, 0, p.points[3].x, p.points[3].y);
                        gradient.addColorStop(0, 'RGBA(' + p.colors[0].r + ', ' + p.colors[0].g + ', ' + p.colors[0].b + ', 255)');
                        gradient.addColorStop(1, 'RGBA(' + p.colors[3].r + ', ' + p.colors[3].g + ', ' + p.colors[3].b + ', 255)');

                        ctx.fillStyle = gradient;
                        ctx.fillRect(
                            p.points[0].x,
                            p.points[0].y,
                            p.points[3].x,
                            p.points[3].y,
                        );
                    }
                    return;

                case 0x74: // SPRITE 8
                    {
                        const p = {
                            colors: [
                                RGBC(data[0])
                            ],
                            points: [
                                POINT(data[1]),
                                POINT(data[3]),
                            ]
                        };

                        ctx.fillStyle = 'RGBA(' + p.colors[0].r + ', ' + p.colors[0].g + ', ' + p.colors[0].b + ', 255)';
                        ctx.fillRect(
                            p.points[0].x,
                            p.points[0].y,
                            8,
                            8,
                        );
                    }
                    return;
            }
        }
    };
};

const render = new pseudo.CstrRender();
