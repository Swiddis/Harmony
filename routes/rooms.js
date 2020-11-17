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
    let currMethod = 'createRoom';
    let room = {
        room_id: req.body.id,
        room_title: req.body.title,
        password: req.body.password,
        nicknames: req.body.nicknames
    };
    
    db.createRoom(room, buildResponse);
};

// Room GET API endpoint
// Takes room ID as path variable, e.g. /room/public
exports.getRoom = (req, res) => {
    let currMethod = 'getRoom';
    let room_id = req.params.room_id;

    db.getRoom(room_id, buildResponse);
};

// Room messaging POST endpoint
// Post to /room/room_id
exports.sendToRoom = (req, res) => {
    let currMethod = 'sendToRoom';
    let room_id = req.params.room_id;
    let message = req.body.message;
    
    db.sendToRoom(room_id, message, buildResponse);
};

exports.authorizeRoomAccess = (req, res) => {
    // TODO
};

exports.establishUserDMs = (req, res) => {
    // TODO
};

const buildResponse = (err, room) => {
    let response;
    let room_path = '/room' + (room ? '/' + encodeURIComponent(room.room_id) : '');

    if (err) {
        response = {
            'timestamp': new Date().toISOString(),
            'path': room_path,
            'error': err.message()
        }
        if (err.message() == "Room not found") {
            response.status = 404;
        } else if (err.message == "Room already exists") {
            response.status = 403;
        }else {
            response.status = 500;
        }
    } else {
        response = {
            'timestamp': new Date().toISOString(),
            'status': 200,
            'path': room_path
        }
        if (room) response.data = room;
    }

    res.status(response.status);
    res.json(response);
};
