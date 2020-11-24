const path = require('path');
const fs = require('fs');
const db = require('../db/roomdb.js');
const image_formats = ['.png', '.jpg', '.gif']

// Based on https://stackoverflow.com/a/15773267
// Expects multi-part post body, with the file
// contained in the "file" field and sender information
// contained in "source"
exports.uploadMedia = (req, res) => {
    console.log(req);
    console.log("\n\n\n");
    console.log(req.body);
    console.log("\n\n\n");
    console.log(req.file);
    const data = {
        sender: req.body.sender,
        room_id: req.body.room_id,
    }
    console.log(data);

    const temp_path = req.file.path;
    const storage_name = randomFileName(path.extname(req.file.originalname).toLowerCase());
    const target_path = path.join(__dirname, '../public/uploads/' + storage_name);

    fs.rename(temp_path, target_path, err => {
        if (err) buildResponse(err);

        db.sendFile({
            'is_file': true,
            'content': `/media/${storage_name}::${path.basename(req.file.originalname)}`,
            sender: data.sender,
            room: data.room_id
        }, buildResponse, res)
    });
};

exports.getMedia = (req, res) => {
    let file_name = req.params.file_name;
    if (image_formats.contains(path.extname(file_name).toLowerCase())) {
        return res.sendFile('../public/uploads/' + file_name)
    } else {
        return res.download('../public/uploads/' + file_name);
    }
}

const buildResponse = (res, err, fname) => {
    let response;
    if (err) {
        response = {
            'timestamp': new Date().toISOString(),
            'status': 500,
            'path': '/media',
            'error': err.message
        };
    } else {
        response = {
            'timestamp': new Date().toISOString(),
            'status': 200,
            'path': fname
        };
    }
    res.json(response);
}

const fid_magnitude = 10;
const randomFileName = (ext) => {
    let fname;
    do {
        let id = Math.floor(Math.random() * Math.pow(10, fid_magnitude));
        fname = ('0'.repeat(fid_magnitude) + id).substr(-fid_magnitude) + fid_magnitude;
    } while (fs.existsSync('/public/uploads/' + fname));
    return fname + ext;
}
