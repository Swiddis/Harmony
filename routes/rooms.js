/**
 * Room API endpoints
 * RESTful API for room CRUD operations
 *
 * API is accessed at the /room path
 */

const db = require("../db/roomdb");
const crypto = require("crypto");
const iomanager = require('../io-manager');

const btoa = (string) => {
    return Buffer.from(string, "binary").toString("base64");
};

const atob = (encoded) => {
    return Buffer.from(encoded, "base64").toString("binary");
};

// Room POST API endpoint
// Post to /room, accepts input in JSON format
exports.createRoom = (req, res) => {
    let room = {
        room_id: req.body.room_id,
        room_title: req.body.room_title,
        owner: req.body.owner,
        password: req.body.password,
        nicknames: req.body.nicknames,
        roomAvatar: "./images/room.png",
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

    db.sendMessage(
        {
            room_id,
            message,
        },
        (err, message) => buildResponse(res, err, message)
    );
};

/**
 * Edit room endpoint to be used with the PATCH '/room'
 */
exports.editRoom = (req, res) => {
    let user = req.body.user;
    let room = req.body.room;

    db.editRoom(
        room,
        user,
        (err, room) => buildResponse(res, err, room)
    );
};

exports.leaveRoom = (req, res) => {
    let user = req.session.user;
    let room = req.params.room_id;

    db.leaveRoom(user, room, (err, obj) => buildResponse(res, err, obj));

};

exports.getMessages = (req, res) => {
    let room_id = req.params.room_id;

    db.getMessages(room_id, (err, messages) =>
        buildMessageResponse(res, err, messages, room_id)
    );
};

exports.authorizeRoomAccess = (req, res) => {
    let auth = atob(req.headers.authorization.substring(6)).split(":"); // Remove leading 'Basic ' and convert from base64
    let username = auth[0];
    let password = auth.slice(1).join(":");
    let room_id = req.params.room_id;

    db.authorizeRoomAccess(username, room_id, password, (err, authorities) =>
        buildAuthResponse(res, err, authorities)
    );
};

exports.establishUserDMs = (req, res) => {
    let user1 = req.params.user1;
    let user2 = req.params.user2;
    let password = crypto.randomBytes(20).toString("hex");
    let masterRoom = {
        room_id: crypto.randomBytes(20).toString("hex"),
        room_title: `Direct ${user1}-${user2}`,
        password,
        owner: user1,
        is_dm: true
    };

    db.findDM(user1, user2, (err, room) => {
        if (err && err.message != "Room not found") return buildResponse(res, err, room);
        if (room) { //We've got to make sure a DM does not already exist!
            console.log("Found DM between " + user1 + " and " + user2);
            buildResponse(res, undefined, room);
        } else {
            console.log("DM not found for " + user1 + " and " + user2 + ". Creating one.");
            db.createRoom(masterRoom, (err, room) => {
                if (err) return buildCreationResponse(res, err, room);
                db.authorizeRoomAccess(
                    user1,
                    room.room_id,
                    password,
                    (err, auths) => {
                        if (err) return buildCreationResponse(res, err, room);
                        db.authorizeRoomAccess(
                            user2,
                            room.room_id,
                            password,
                            (err, auths) => {

                                let client = iomanager.getClientByUsername(user2);
                                if (client) {
                                    // Push a message out telling the client to re-render the rooms list.
                                    client.getSocket().emit("custom", {action: "rerender"});
                                }

                                buildCreationResponse(res, err, room);
                            }
                        );
                    }, false);
            });
        }
    });
};

// User PATCH endpoint for nicknames
// Patch to /room/nick/:room_id
exports.updateUserNickname = (req, res) => {
    let data = {
        room_id: req.params.room_id,
        username: req.body.username,
        nickname: req.body.nickname,
    };

    if (data.nickname) {
        db.updateUserNickname(data, (err, room) => buildResponse(res, err, room));
    } else {
        buildResponse(res, new Error("No nickname supplied"), {
            room_id: data.room_id,
        });
    }
};

// To be used with the DELETE endpoint
// /room/nick/:room_id/:user
exports.deleteNickname = (req, res) => {
    let room_id = req.params.room_id;
    let username = req.params.user;
    let data = {
        room_id,
        username
    }

    if (room_id && username) {
        db.updateUserNickname(data, (err, room) => buildResponse(res, err, room));
    } else {
        buildResponse(res, new Error("Invalid room id or username"), {room_id});
    }
}

const buildCreationResponse = (res, err, room) => {
    buildResponse(res, err, room, true);
};

const buildResponse = (res, err, room, created = false) => {
    let response;
    let room_path =
        "/room" + (room ? "/" + encodeURIComponent(room.room_id) : "");

    if (err) {
        response = {
            timestamp: new Date().toISOString(),
            path: room_path,
            error: err.message,
        };
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
            timestamp: new Date().toISOString(),
            status: 200,
            path: room_path,
        };
        if (room) {
            let tempRoom = { // We have to sanitize and not send the password back
                room_id: room.room_id,
                room_title: room.room_title,
                nicknames: room.nicknames,
                roomAvatar: room.roomAvatar,
                members: room.members,
                is_dm: room.is_dm
            }
            response.data = tempRoom;
        }
        if (created) response.status = 201;
    }

    res.status(response.status);
    res.json(response);
};

const buildMessageResponse = (res, err, messages, room_id) => {
    let response;
    let path = "/messages/" + encodeURIComponent(room_id);

    if (err) {
        response = {
            timestamp: new Date().toISOString(),
            path: path,
            error: err.message,
        };
        if (err) {
            response.status = 500;
        }
    } else {
        response = {
            timestamp: new Date().toISOString(),
            status: 200,
            path: path,
        };
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
            timestamp: new Date().toISOString(),
            path: "/room/authorize",
            error: err.message,
        };
        if (err.message == "Room not found") {
            response.status = 404;
        } else if (err.message == "Invalid credentials") {
            response.status = 401;
        } else {
            response.status = 500;
        }
    } else {
        response = {
            timestamp: new Date().toISOString(),
            status: 200,
            path: "/room/authorize",
            authorities: authorities,
        };
    }

    res.status(response.status);
    res.json(response);
};
