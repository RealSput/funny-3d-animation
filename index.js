// REALLY PAINFUL SPAGHETTI CODE AHEAD
// LAST WARNING
require('@g-js-api/g.js');

const fs = require('fs');
const Jimp = require('jimp');
let {
    Bitmap,
    ImageRunner,
    ShapeTypes,
    ShapeJsonExporter
} = require('geometrizejs');

function rgb2hsv(r, g, b) {
    let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
    rabs = r / 255;
    gabs = g / 255;
    babs = b / 255;
    v = Math.max(rabs, gabs, babs),
        diff = v - Math.min(rabs, gabs, babs);
    diffc = c => (v - c) / 6 / diff + 1 / 2;
    percentRoundFn = num => Math.round(num * 100) / 100;
    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(rabs);
        gg = diffc(gabs);
        bb = diffc(babs);

        if (rabs === v) {
            h = bb - gg;
        } else if (gabs === v) {
            h = (1 / 3) + rr - bb;
        } else if (babs === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        } else if (h > 1) {
            h -= 1;
        }
    }
    let [hue, saturation, brightness] = [Math.round(h * 360), percentRoundFn(s * 100) / 100, percentRoundFn(v * 100) / 100]
    return `${hue}a${saturation}a${brightness}a0a0`;
}

let DRAW_SCALE = 2;
let offset_x = 0,
    offset_y = 0;

let col = unknown_c();
col.set(rgb(255, 0, 0));

let zo = 0;
let move_groups = unknown_g();

let circle = (x, y, radius, rgba) => {
    let str = rgb2hsv(...rgba.slice(0, -1));

    $.add({
        OBJ_ID: 1764,
        X: (x / DRAW_SCALE) + offset_x,
        Y: (y / DRAW_SCALE) + offset_y,
        SCALING: radius / DRAW_SCALE / 4,
        HVS_ENABLED: 1,
        HVS: str,
        COLOR: col,
        Z_ORDER: zo,
        GROUPS: move_groups
    });
    zo++;
}

let readfile = (filename) => {
    return new Promise((resolve) => {
        let output = [];

        const readStream = fs.createReadStream(filename);

        readStream.on('data', function(chunk) {
            output.push(chunk);
        });

        readStream.on('end', function() {
            resolve(Buffer.concat(output));
        });
    })
}

let image = async (buf) => {
    let image = await Jimp.read(buf);
    image = image.flip(false, true);
    const bitmap = Bitmap.createFromByteArray(image.bitmap.width,
        image.bitmap.height, image.bitmap.data)
    const runner = new ImageRunner(bitmap)
    const options = {
        shapeTypes: [ShapeTypes.CIRCLE],
        candidateShapesPerStep: 50,
        shapeMutationsPerStep: 100,
        alpha: 255
    }
    const iterations = 200
    const shapes = []
    for (let i = 0; i < iterations; i++) {
        // data: 0 = x, 1 = y, 2 = width, 3 = height
        let x = JSON.parse(ShapeJsonExporter.exportShapes(runner.step(options)));
        circle(...x.data, x.color);
    }
};

(async () => {
    let frame = 1;
    let max_frames = 144;

    while (frame < max_frames) {
        let file = await readfile(`frames/frame_${frame}.png`);
        image(file);
        offset_x += 250 * 3;
        console.log(`frame ${frame} done`);
        frame++;
    }

    let cunter = counter(max_frames);
    while_loop(greater_than(cunter, 0), () => {
        move_groups.move(-250, 0);
        cunter.subtract(1);
    })

    $.exportToSavefile({
        info: true
    });
})();
