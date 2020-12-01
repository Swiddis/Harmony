const bcrypt = require('bcryptjs');
const {
    User,
    Room,
    Message
} = require('../conf/mongo_conf');
const userdb = require('./userdb');
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
    Room.findOne({
        room_id: room.room_id
    }, (err, rm) => {
        if (err) {
            console.error("Could not fetch room from DB");
            console.error(err);
            callback(err);
            return;
        }
        if (rm) {
            callback(new Error("Room already exists"), rm);
        } else {
            if (room.password && room.password != "") {
                let salt = bcrypt.genSaltSync(10);
                let hash = bcrypt.hashSync(room.password, salt);
                room.password = hash;
            }

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
 * Sets a user's nickname in the specified room. The callback function will be run
 * after the operation is completed or upon hitting an error.
 * @param room_id - The room in which to change the nickname
 * @param username - The user of whom to change their nickname
 * @param nickname - The nickname to change the user to
 * @param callback - callback(err, room)
 */
exports.setNickname = (room_id, username, nickname, callback) => {
    if (!room_id) {
        callback(new Error("Room id not defined"));
        return;
    }
    // We'll cache rooms in memory so we don't always have to query the database
    for (let room of room_cache) {
        if (room.room_id == room_id) {
            room.setNickname(username, nickname, callback);
            return;
        }
    }

    Room.findOne({
        room_id
    }, (err, room) => {
        if (err) { //This is only thrown if there is a problem finding a room.
            console.error("Could not load room by id '" + room + "'");
            console.error(err);
            callback(err, {
                room_id: id
            });
            return;
        }
        if (room) {
            room.setNickname(username, nickname, callback);
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
    if (!id) {
        callback(new Error("Room id not defined"));
        return;
    }
    // We'll cache rooms in memory so we don't always have to query the database
    for (let room of room_cache) {
        if (room.room_id == id) {
            callback(undefined, room);
            return;
        }
    }

    Room.findOne({
        room_id: id
    }, (err, room) => {
        if (err) { //This is only thrown if there is a problem finding a room.
            console.error("Could not load room by id '" + room + "'");
            console.error(err);
            callback(err, {
                room_id: id
            });
            return;
        }
        if (room) {
            room_cache.push(room);
            callback(undefined, room);
        } else {
            callback(new Error("Room not found"), {
                room_id: id
            });
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
    Room.findOne({
        room_id: room
    }, (err, room) => {
        if (err) { //This is only thrown if there is a problem finding a room.
            console.error("Could not load room by id '" + room + "'");
            console.error(err);
            callback(err, {
                room_id: id
            });
            return;
        }
        if (room) {
            room.getMessages(callback);
        } else {
            callback(new Error("Room does not exist"));
        }
    });
    // Message.find({room}, null, {sort: {timestamp: -1}}, (err, messages) => {
    //     if (err) {
    //         console.error("Could not find messages for room '" + room + "'");
    //         console.error(err);
    //         callback(err);
    //         return;
    //     }
    //     for(let message of messages) {
    //
    //     }
    //     callback(undefined, messages);
    // });
};

/**
 * File data should be formatted the following:
 * {
 *     is_file: true,
 *     content: "/data_url::File Name",
 *     sender: "sender_username",
 *     room: "room_id"
 * }
 * The data url can be absolute or relative to our server.
 * @param fileData - The file data to store in the database
 * @param callback - The function to call once data is committed to the database (callback(err, message))
 */
exports.sendFile = (data, callback) => {
    data.timestamp = new Date();
    new Message(data).save((err, message) => {
        if (err) {
            console.error("Could not save file data to the database!");
            console.error(err);
            callback(err);
            return;
        }
        console.log("File data saved!");
        callback(undefined, data.content);
    });
};

/**
 * Message should be a fully formatted message (ie room, content, sender, and is_file all set. Server will set the timestamp.)
 * The room is derived from the message object itself.
 * @param message - The fully formatted message to send.
 * @param callback - The callback function to call upon success/failure
 */
//Possibly change this to a general 'sendToRoom' to accept files as well? Files are going to be fun.
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

/**
 * Attempts to authorize the user for the given room by password.
 * @param room_id - The room_id to authorize to.
 * @param password - The plain text password to check against the database.
 * @param callback - Callback formatted as callback(err, success) where success is a boolean.
 */
exports.authorizeRoomAccess = (username, room_id, password, callback) => {
    /*
    Maybe move this to userdb.js?
    UNTESTED!
     */
    userdb.getUser(username, (err, user) => {
        if (err) {
            callback(err, []);
            return;
        }

        if (!user) { //The user has to exist!
            callback(new Error("User not found"), []);
            return;
        }

        this.getRoom(room_id, (err, room) => {
            if (err) {
                callback(err, []);
                return;
            }

            if (!room) {
                callback(new Error("Room not found"), []);
                return;
            }

            if (!room.password || bcrypt.compareSync(password, room.password)) {
                //Authenticated!
                if (!user.joined_rooms.includes(room.room_id))
                    user.joined_rooms.push(room.room_id);
                callback(undefined, ["USER", "ADMIN"]);
                new User(user).save();
            } else {
                //Not authenticated.
                callback(new Error("Invalid credentials"), []);
            }
        });
    });
};

/**
 * Update nickname of user given data as object:
 * {
 *  username, -- User to update
 *  room_id,  -- Room in which to update nickname
 *  nickname  -- New nickname
 * }
 * @param data - Data containing update info. Needs
 * @param callback
 */
exports.updateUserNickname = (data, callback) => {
    Room.findOne({room_id: data.room_id}, (err, room) => {
        if (err) callback(err, {room_id: data.room_id});

        console.log(data);
        if (room)
            this.setNickname(data.room_id, data.username, data.nickname, callback);
        else
            callback(new Error("Room not found"));
    });
};
//     Room.findOne({
//         room_id: data.room_id
//     }, (err, room) => {
//         if (err) callback(err, {
//             room_id: room_id
//         });
//         if (room) {
//             let nicks = room.nicknames;
//             let updated = false;
//             for (let nick of nicks) {
//                 if (nick.name == data.username) {
//                     nick.nick = data.nickname;
//                     updated = true;
//                     break;
//                 }
//             }
//
//             if (!updated) {
//                 nicks.push({
//                     name: data.username,
//                     nick: data.nickname
//                 });
//             }
//
//             Room.updateOne({
//                 room_id: data.room_id
//             }, {
//                 $set: {
//                     nicknames: nicks
//                 }
//             });
//
//             room.nicknames = nicks;
//
//             callback(undefined, room);
//         } else {
//             callback(new Error('Could not find room ' + room_id));
//         }
//     })
// };