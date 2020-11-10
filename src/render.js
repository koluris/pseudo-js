/***
    Base components
***/

#define RGBC(data) { \
    a: (data >>>  0) & 0xff, \
    b: (data >>>  8) & 0xff, \
    c: (data >>> 16) & 0xff, \
    n: (data >>> 24) & 0xff, \
}

#define POINT(data) { \
    h: (data >>  0) & 0xffff, \
    v: (data >> 16) & 0xffff, \
}

pseudo.CstrRender = function() {
    let ctx;

    // Exposed class functions/variables
    return {
        init(canvas) {
            ctx = canvas.fetchContext('2d');
        },

        draw(addr, data) {
            switch(addr & 0xfc) {
                case 0x38: // POLY G4
                    {
                        const p = {
                            cr: [
                                RGBC(data[0]),
                                RGBC(data[2]),
                                RGBC(data[4]),
                                RGBC(data[6]),
                            ],
                            vx: [
                                POINT(data[1]),
                                POINT(data[3]),
                                POINT(data[5]),
                                POINT(data[7]),
                            ]
                        };

                        var grd = ctx.createLinearGradient(0, 0, p.vx[3].h, p.vx[3].v);
                        grd.addColorStop(0, 'RGBA(' + p.cr[0].a + ', ' + p.cr[0].b + ', ' + p.cr[0].c + ', 255)');
                        grd.addColorStop(1, 'RGBA(' + p.cr[3].a + ', ' + p.cr[3].b + ', ' + p.cr[3].c + ', 255)');

                        ctx.fillStyle = grd;
                        ctx.fillRect(
                            p.vx[0].h,
                            p.vx[0].v,
                            p.vx[3].h,
                            p.vx[3].v,
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

                        ctx.fillStyle = 'RGBA(' + p.colors[0].a + ', ' + p.colors[0].b + ', ' + p.colors[0].c + ', 255)';
                        ctx.fillRect(
                            p.points[0].h,
                            p.points[0].v,
                            8,
                            8,
                        );
                        ctx.closePath();
                    }
                    return;
            }
        }
    };
};

const render = new pseudo.CstrRender();
