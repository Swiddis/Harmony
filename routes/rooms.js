/**
 * Room API endpoints
 * RESTful API for room CRUD operations
 *
 * API is accessed at the /room path
 */

const db = require('../db/roomdb');

const btoa = (string) => {
    return Buffer.from(string, 'binary').toString('base64');
};

const atob = (encoded) => {
    return Buffer.from(encoded, 'base64').toString('binary');
}

// Room POST API endpoint
// Post to /room, accepts input in JSON format
exports.createRoom = (req, res) => {
    let room = {
        room_id: req.body.room_id,
        room_title: req.body.room_title,
        password: req.body.password,
        nicknames: req.body.nicknames,
        roomAvatar: "./images/room.png"
    };

    db.createRoom(room, (err, room) => buildCreationResponse(res, err, room));
};

// Room GET API endpoint
// Takes room ID as path variable, e.g. /room/public
exports.getRoom = (req, res) => {
    let room_id = req.params.room_id;

    db.getRoom(room_id, (err, room) => buildResponse(res, err, room));
};

// Room messaging POST endpoint
// Post to /room/room_id
exports.sendToRoom = (req, res) => {
    let room_id = req.params.room_id;
    let message = req.body.message;

    db.sendMessage({
            room_id,
            message
        },
        (err, message) => buildResponse(res, err, message));
};

exports.getMessages = (req, res) => {
    let room_id = req.params.room_id;

    db.getMessages(room_id,
        (err, messages) => buildMessageResponse(res, err, messages, room_id));
};

exports.authorizeRoomAccess = (req, res) => {
    let auth = atob(req.headers.authorization.substring(6)).split(':'); // Remove leading 'Basic ' and convert from base64
    let username = auth[0];
    let password = auth.slice(1).join(':');
    let room_id = req.params.room_id;

    db.authorizeRoomAccess(username, room_id, password, (err, authorities) => buildAuthResponse(res, err, authorities));
};

exports.establishUserDMs = (req, res) => {
    // TODO
};

// User PATCH endpoint for nicknames
// Patch to /room/nick/:room_id
exports.updateUserNickname = (req, res) => {
    let data = {
        room_id: req.params.room_id,
        username: req.body.username,
        nickname: req.body.nickname
    };

    if (data.nickname) {
        db.updateUserNickname(data, (err, room) => buildResponse(res, err, room));
    } else {
        buildResponse(res, new Error("No nickname supplied"), {room_id: data.room_id});
    }
}

const buildCreationResponse = (res, err, room) => {
    buildResponse(res, err, room, true);
}

const buildResponse = (res, err, room, created = false) => {
    let response;
    let room_path = '/room' + (room ? '/' + encodeURIComponent(room.room_id) : '');

    if (err) {
        response = {
            'timestamp': new Date().toISOString(),
            'path': room_path,
            'error': err.message
        }
        if (err.message == "Room not found") {
            response.status = 404;
        } else if (err.message == "Room already exists") {
            response.status = 403;
        } else if (err.message == "No nickname supplied") {
            response.status = 400;
        } else {
            response.status = 500;
        }
    } else {
        response = {
            'timestamp': new Date().toISOString(),
            'status': 200,
            'path': room_path
        }
        if (room) response.data = room;
        if (created) response.status = 204;
    }

    res.status(response.status);
    res.json(response);
};

const buildMessageResponse = (res, err, messages, room_id) => {
    let response;
    let path = '/messages/' + encodeURIComponent(room_id);

    if (err) {
        response = {
            'timestamp': new Date().toISOString(),
            'path': path,
            'error': err.message
        }
        if (err) {
            response.status = 500;
        }
    } else {
        response = {
            'timestamp': new Date().toISOString(),
            'status': 200,
            'path': path
        }
        response.status = 200;
        response.data = messages;
    }

    res.status(response.status);
    res.json(response);
};

const buildAuthResponse = (res, err, authorities) => {
    let response;

    if (err) {
        response = {
            'timestamp': new Date().toISOString(),
            'path': '/room/authorize',
            'error': err.message
        }
        if (err.message == "Room not found") {
            response.status = 404;
        } else if (err.message == "Invalid credentials") {
            response.status = 401;
        } else {
            response.status = 500;
        }
    } else {
        response = {
            'timestamp': new Date().toISOString(),
            'status': 200,
            'path': '/room/authorize',
            'authorities': authorities
        }
    }

    res.status(response.status);
    res.json(response);
}