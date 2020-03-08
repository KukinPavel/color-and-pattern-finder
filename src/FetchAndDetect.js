const fetch = require("node-fetch");
var fs = require('fs');
var https = require('https');
const cv = require('opencv4nodejs');
const ColorFinder = require("./ColorFinder");
//const foobar = import("./ColorFinder.mjs");
//require {ColorFinder, getIndexByColor, getColorByIndex, indexOfMax} from "./ColorFinder.js";


const url = "https://service.findologic.com/ps/frontend/index.php?outputAdapter=JSON_1.0&shopkey=30C0586DD71B5F008C32511B4C7E934C&query=es&count=10";
// fetches response
const getData = async url => {
    try {
        const response = await fetch(url);
        const json = await response.json();
        return json;
    } catch (error) {
        console.log(error);
    }
};
//Node.js Function to save image from External URL.

const saveImageToDisk = async (url, localPath) => {
    let request = new Promise((resolve, reject) => {
        let file = fs.createWriteStream(localPath);
        https.get(url, function (response) {
            response.pipe(file);
        });
        file.on('finish', resp => {
            resolve('Finished.');
        });
    });
    request.then(result => {
        console.log('Success in saving:', result);
    }).catch(err => {
        console.log("Fail in save. ", err);
        reject(err);
    });
    return request;
}

// This function fetches image, saves it and shows the pasteurised with top colors on it
async function fetchAndDetect(imageURL, id, cat, shopkey) {
    const s = await saveImageToDisk(imageURL, './img.png');
    await (async function (s) {
        let img = cv.imread('./img.png');
        let finder = new ColorFinder.ColorFinder(img);
        finder.pasteurise(300);
        finder.getTopColorsFromArray();
        finder.drawImageWithTopColors(5);
        return 1;
    })();
}

async function fetchResponseAndProcessEachImage(url) {
    const result = await getData(url)
        .then(response => {
            return response.result;
            //saveImageToDisk(imageURL, "./img.png");
        });
    result.items[0].imageUrl;
}

let results = fetchAndDetect(url);





