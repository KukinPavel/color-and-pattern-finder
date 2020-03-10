// replace with path where you unzipped coco-SSD_300x300 model
const ssdcocoModelPath = '../lib/COCO/'
const cv = require('opencv4nodejs');
const fs = require('fs');
const path = require('path');
const inceptionModelPath = '../lib/tensorflow/'
const RED = new cv.Vec3(0, 0, 255);

const prototxt = path.resolve(ssdcocoModelPath, 'deploy.prototxt');
const modelFile = path.resolve(ssdcocoModelPath, 'VGG_coco_SSD_300x300_iter_400000.caffemodel');

if (!fs.existsSync(prototxt) || !fs.existsSync(modelFile)) {
    console.log('exiting: could not find ssdcoco model');
    console.log('download the model from: https://drive.google.com/file/d/0BzKzrI_SkD1_dUY1Ml9GRTFpUWc/view');
}

// initialize ssdcoco model from prototxt and modelFile
const net = cv.readNetFromCaffe(prototxt, modelFile);

const classifyImg = (img) => {
    const white = new cv.Vec(255, 255, 255);
    // ssdcoco model works with 300 x 300 images
    const imgResized = img.resize(300, 300);

    // network accepts blobs as input
    const inputBlob = cv.blobFromImage(imgResized);
    net.setInput(inputBlob);

    // forward pass input through entire network, will return
    // classification result as 1x1xNxM Mat
    let outputBlob = net.forward();
    // extract NxM Mat
    outputBlob = outputBlob.flattenFloat(outputBlob.sizes[2], outputBlob.sizes[3]);

    const results = Array(outputBlob.rows).fill(0)
        .map((res, i) => {
            const className = classNames[outputBlob.at(i, 1)];
            const confidence = outputBlob.at(i, 2);
            const topLeft = new cv.Point(
                outputBlob.at(i, 3) * img.cols,
                outputBlob.at(i, 6) * img.rows
            );
            const bottomRight = new cv.Point(
                outputBlob.at(i, 5) * img.cols,
                outputBlob.at(i, 4) * img.rows
            );

            return ({
                className,
                confidence,
                topLeft,
                bottomRight
            })
        });

    return results;
};


const classNamesFile = path.resolve(ssdcocoModelPath, 'dnnCocoClassNames.ts');
// read classNames and store them in an array
const classNames = fs.readFileSync(classNamesFile).toString().split("\n");


const testData = [
    {
        image: '../hero.jpg',
        label: 'car'
    },
    {
        image: '../middle.png',
        label: 'middle'
    },
    {
        image: '../middle_underwear.png',
        label: 'middle_underwear'
    },
    {
        image: '../underwear_close.png',
        label: 'underwear_close'
    },
    {
        image: '../long.png',
        label: 'long'
    }
];

testData.forEach((data) => {
    const img = cv.imread(data.image);
    console.log('%s: ', data.label);
    const res = classifyImg(img);
    //[className, confidence, topLeft, bottomRight].forEach(p => console.log(p));
    console.log("className: ", res[1].className);
    console.log("confidence: ", res[1].confidence);

    console.log();
    const imgResized = img.resize(300, 300);
    imgResized.drawRectangle(
        res[1].topLeft,
        res[1].bottomRight,
        RED,
        2
    );
    imgResized.drawRectangle(
        res[2].topLeft,
        res[2].bottomRight,
        RED,
        1
    );

    cv.imshowWait('img', imgResized);
});