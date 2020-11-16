/**
 * Room API endpoints
 * RESTful API for room CRUD operations
 * 
 * API is accessed at the /room path
 */

 const db = require('../db/roomdb');

 // Room POST API endpoint
 // Post to /room, accepts input in JSON format
exports.createRoom = (req, res) => {
    let room = {
        room_id: req.body.id,
        room_title: req.body.title,
        password: req.body.password,
        nicknames: req.body.nicknames
    };

    try {
        db.createRoom(room);
        res.status(204);
        res.send();
    } catch (err) {
        response = {
            'timestamp': new Date().toISOString(),
            'status': 500,
            'error': err.message(),
            'path': '/room'
        };
        res.status(500);
        res.json(response);
    }
};

// Room GET API endpoint
// Takes room ID as path variable, e.g. /room/public
exports.getRoom = (req, res) => {
    let room_id = req.params.room_id;
    let response;

    try {
        let room = db.getRoom(room_id);
        response = {
            'timestamp': new Date().toISOString(),
            'status': 200,
            'data': room,
            'path': '/room/' + encodeURIComponent(room.room_id)
        };
    } catch (err) {
        response = {
            'timestamp': new Date().toISOString(),
            'status': 500,
            'error': err.message(),
            'path': '/room'
        };
        res.status(500);
    }

    res.json(response);
};

// Room messaging POST endpoint
// Post to /room/room_id
exports.sendToRoom = (req, res) => {
    let room_id = req.params.room_id;
    let message = req.body.message;
    
    try {
        db.sendToRoom(room_id, message);
        res.status(204);
        res.send();
    } catch (err) {
        response = {
            'timestamp': new Date().toISOString(),
            'status': 500,
            'error': err.message(),
            'path': '/room'
        };
        res.status(500);
        res.json(response);
    }
};

exports.authorizeRoomAccess = (req, res) => {
    // TODO
};

exports.establishUserDMs = (req, res) => {
    // TODO
};
