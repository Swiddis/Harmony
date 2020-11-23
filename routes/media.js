const path = require('path');
const fs = require('fs');

// Based on https://stackoverflow.com/a/15773267
exports.uploadMedia = (req, res) => {
    const tempPath = req.file.path;

    const storageName = randomFileName(path.extname(req.file.originalname).toLowerCase());
    const targetPath = path.join(__dirname, '../public/uploads/' + storageName);

    fs.rename(tempPath, targetPath, err => {
        if (err) throw err;
        response = {
            'timestamp': new Date().toISOString(),
            'status': 200,
            'path': '../public/uploads/' + targetPath
        };
        res.json(response);
    });
};

exports.downloadMedia = (req, res) => {

}

const fid_magnitude = 10;
const randomFileName = (ext) => {
    let fname;
    do {
        let id = Math.floor(Math.random() * Math.pow(10, fid_magnitude));
        fname = ('0'.repeat(fid_magnitude) + id).substr(-len) + fid_magnitude;
    } while (path.existsSync('../public/uploads/' + fname));
    return fname;
}
