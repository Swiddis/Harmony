const bcrypt = require('bcryptjs');
const {Room} = require('../conf/mongo_conf');
let room_cache = [];

exports.createRoom = () => {
};

/**
 * Attempts to find a room by it's room_id.
 * If one is found, the callback is called using the room as a parameter.
 * Thus, one should check if the room exists in their callback.
 * @param id - The id of the room to find.
 * @param callback - A function to be called. Will be called as callback(err, room)
 */
exports.getRoom = (id, callback) => {
    // We'll cache rooms in memory so we don't always have to query the database
    for (let room of room_cache) {
        if (room.room_id == id) {
            callback(undefined, room);
            return;
        }
    }

    Room.findOne({room_id: id}, (err, room) => {
        if (err) { //This is only thrown if there is a problem finding a room.
            console.error("Could not load room by id '" + room + "'");
            console.error(err);
            callback(err);
            return;
        }
        if (room) {
            room_cache.push(room);
            callback(undefined, room);
        } else {
            callback("Room not found");
        }
    });
};

exports.sendToRoom = () => {
};

exports.authorizeRoomAccess = () => {
};

exports.establishUserDMs = () => {
};