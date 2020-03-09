const cv = require('opencv4nodejs');
const TOP_COLORS_AMOUNT = 10;
const MAX_IMG_RESOLUTION = 300;
const BLACK = new cv.Vec3(0, 0, 0);
const RED = new cv.Vec3(0, 0, 255);;
/*
* This class designed to find top-colors of image
* */
class ColorFinder {
    constructor(image) {
        this.image = image;
        this.posteurisedImage = new cv.Mat();
        this.posteurisedImageWithTops = new cv.Mat();
        this.topColors = new Array(TOP_COLORS_AMOUNT).fill(0);
        this.patterns = [];
        // array of "125" elements, all possible colors after pasteurization
        this.arrayOfPosterColors = new Array(125).fill(0);
    }

    // Pasteurise this.image, resizing it beforehand to `maxRowsOrCols` and form this.arrayOfPosterColors
    pasteurise(maxRowsOrCols) {
        const resizedImg = this.image.resizeToMax(maxRowsOrCols);

        // pasteurize image, count all colors
        let poster = new cv.Mat(resizedImg.rows, resizedImg.cols, cv.CV_8UC3, [255, 255, 255]);
        for (let y = 0; y < resizedImg.cols - 1; y++) {
            for (let x = 0; x < resizedImg.rows - 1; x++) {
                let pix = [0, 0, 0],
                    xyz = ['x', 'y', 'z'];
                for (let z = 0; z < 3; z++) {
                    if (resizedImg.at(x, y)[xyz[z]] < 63)
                        pix[z] = 0;
                    else if (resizedImg.at(x, y)[xyz[z]] < 127)
                        pix[z] = 63;
                    else if (resizedImg.at(x, y)[xyz[z]] < 191)
                        pix[z] = 127;
                    else
                        pix[z] = 191;
                }
                poster.set(x, y, pix);
                let indexInArray = getIndexByColor([pix[0], pix[1], pix[2]]);
                this.arrayOfPosterColors[indexInArray] += 1;
            }
        }
        this.posteurisedImage = poster;
    }

    getTopColorsFromArray() {
        let dummy = [...this.arrayOfPosterColors];
        for (let i = 0; i < this.topColors.length; i++) {
            // get Top color from array of poster colors
            let topColor = getColorByIndex(indexOfMax(dummy));
            this.topColors[i] = topColor;
            // cut this top out
            dummy[indexOfMax(dummy)] = 0;
        }
    }

    // draw image with `n` top colors
    drawImageWithTopColors(n) {
        let image = this.posteurisedImage;
        let width = 0.15*this.image.cols;
        let height = (n/100)*this.image.cols;;
        for (let i = 0; i < n; i++) {
            let currentTopColor = new cv.Vec3(this.topColors[i][0], this.topColors[i][1], this.topColors[i][2]);
            // filled color tile
            image.drawRectangle(
                new cv.Point2(0, i*height),
                new cv.Point2(width, (i+1)*height),// this.arrayOfPosterColors[getIndexByColor(currentTopColor)]
                new cv.Vec3(this.topColors[i][0], this.topColors[i][1], this.topColors[i][2]),
                -1,
                1
            );
            // border
            image.drawRectangle(
                new cv.Point2(0, i*height),
                new cv.Point2(width, (i+1)*height),
                BLACK,
                1
            );
            // text
            image.putText(this.arrayOfPosterColors[getIndexByColor(this.topColors[i])].toString(),
                new cv.Point(width, i*height+30), cv.FONT_HERSHEY_SIMPLEX, 0.5, BLACK, 1, cv.LINE_4);
            // level of color amount
            let level = width * (this.arrayOfPosterColors[getIndexByColor(this.topColors[i])] / this.arrayOfPosterColors[getIndexByColor(this.topColors[0])]);
            image.drawRectangle(
                new cv.Point2(0, i*height),
                new cv.Point2(level, (i)*height + 5),
                RED,
                -1,
                1
            );
        }
        //cv.imshow('rgb image', image);
        this.posteurisedImageWithTops = image;
        //cv.waitKey();
    }
}

// help functions
function getIndexByColor(color) {
    var x = color[0] === 0 ? 0 : (color[0] + 1) / 64 * 25;
    var y = color[1] === 0 ? 0 : (color[1] + 1) / 64 * 5;
    var z = color[2] === 0 ? 0 : (color[2] + 1) / 64;
    return x + y + z;
}

function getColorByIndex(index) {
    var x = parseInt(index / 25) * 64;
    if (x > 0)
        x -= 1
    var y = index - parseInt(index / 25) * 25;
    y = parseInt(y / 5) * 64;
    if (y > 0)
        y -= 1
    var z = (index - parseInt(index / 5) * 5) * 64;
    if (z > 0)
        z -= 1
    return [x, y, z];
}

function indexOfMax(arr) {
    if (arr.length === 0) {
        return -1;
    }
    var max = arr[0];
    var maxIndex = 0;
    for (var i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            maxIndex = i;
            max = arr[i];
        }
    }
    return maxIndex;
}

module.exports.getColorByIndex = getColorByIndex;
module.exports.indexOfMax = indexOfMax;
module.exports.getIndexByColor = getIndexByColor;
module.exports.ColorFinder = ColorFinder;

//module.exports = ColorFinder;
