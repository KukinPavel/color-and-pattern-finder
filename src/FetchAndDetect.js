const fetch = require("node-fetch");
let fs = require('fs');
let https = require('https');
const cv = require('opencv4nodejs');
const ColorFinder = require("./ColorFinder");
const MAX_IMG_RESOLUTION = 400;

const url = "https://service.findologic.com/ps/frontend/index.php?outputAdapter=JSON_1.0&outputAttrib[]=cat&query=&count=20";
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
    // make directory if not exist
    const dir = await (async function () {
        let dir = `./${shopkey}`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        if (!fs.existsSync(`${dir}/${cat}`)) {
            fs.mkdirSync(`${dir}/${cat}`);
        }
        return dir = `${dir}/${cat}/${id}.png`;
    })(id, cat, shopkey);
    const s = await saveImageToDisk(imageURL, dir);
    await (async function (s) {
        let img = cv.imread(dir);
        let finder = new ColorFinder.ColorFinder(img);
        finder.pasteurise(MAX_IMG_RESOLUTION);
        finder.getTopColorsFromArray();
        finder.saveImageWithTopColors(5, dir);
        //return 1;
    })();
}

async function fetchResponseAndProcessEachImage(url, shopkey, cat) {
    url = url + `&shopkey=${shopkey}&attrib[cat][]=${cat}`;
    const result = await getData(url)
        .then(response => {
            return response.result;
            //saveImageToDisk(imageURL, "./img.png");
        }).then((result) => {
            result.items.forEach( function(element,index) {
                let imageURL = element.imageUrl,
                    id = element.id;
                fetchAndDetect(imageURL, id, cat, shopkey);
            });
        });
}

let results = fetchResponseAndProcessEachImage(url, '30C0586DD71B5F008C32511B4C7E934C', 'Home');





