const bcrypt = require('bcryptjs');
const {Room, Message} = require('../conf/mongo_conf');
let room_cache = [];

/**
 * The room should be passed in as a JSON object.
 * {
 *     room_id: "id",
 *     room_title: "title",
 *     password: "password", //This will be converted to a salted/hashed password
 *     nicknames: [{name: "user1", nick: "me"}, {name: "user2", nick: "you"}]
 * }
 *
 * @param room - The room object to create and save to the db.
 * @param callback - The callback function taking in (err, room)
 */
exports.createRoom = (room, callback) => {
    Room.findOne({room_id: room.room_id}, (err, rm) => {
        if (err) {
            console.error("Could not fetch room from DB");
            console.error(err);
            callback(err);
            return;
        }
        if (room) {
            callback("Room already exists", rm);
        } else {
            let salt = bcrypt.genSaltSync(10);
            let hash = bcrypt.hashSync(room.password, salt);
            room.password = hash;

            new Room(room).save((err, rm) => {
                if (err) {
                    console.error("Could not save user to DB.");
                    console.error(err);
                    callback(err);
                    return;
                }
                room_cache.push(rm);
                callback(undefined, rm);
            });
        }
    });
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

/**
 * Gets messages as an array for the specified room (newest first).
 * Callback structured as callback(err, messages)
 * @param room - The room id to find messages for
 * @param callback - The callback function.
 */
exports.getMessages = (room, callback) => {
    Message.find({room}, null, {sort: {date: -1}}, (err, messages) => {
        if (err) {
            console.error("Could not find messages for room '" + room + "'");
            console.error(err);
            callback(err);
            return;
        }
        callback(undefined, messages);
    });
};

/**
 * Message should be a fully formatted message (ie room, content, sender, and is_file all set. Server will set the timestamp.)
 * The room is derived from the message object itself.
 * @param message - The fully formatted message to send.
 * @param callback - The callback function to call upon success/failure
 */
exports.sendMessage = (message, callback) => {
    let room_id = message.room;
    new Message(message).save((err, message) => {
        if (err) {
            console.error("Could not save message to the database!");
            console.error(err);
            callback(err);
            return;
        }
        console.log("Message sent to " + room_id + " saved to the database.");
        callback(undefined, message);
    });
};

exports.sendToRoom = () => {
};

exports.authorizeRoomAccess = () => {
    /*
    This will be the method that assigns the room to the user's
    list of joined rooms?
     */
};

exports.establishUserDMs = (user1, user2) => {
    /*
    TODO Create a new room with a random id.
     Add each user to the room (add to joined_rooms)
    These rooms should be given a password to ensure that no
    randoms join the room. The clients likely won't even be aware of
    what the password even is.
     */

};