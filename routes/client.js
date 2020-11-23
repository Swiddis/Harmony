let db = require('../db/roomdb');

function Client(io, socket) {
    /*
    Message object should be formatted as the following:
    {
        sender: "user",
        message: "message",
        room: "room_id"
    }
    */

    if (!socket.handshake.query.username) {
        console.error("User connected without a username!");
        return;
    } else {
        socket.username = socket.handshake.query.username;
    }
    //We probably don't need to send this message every time the page is refreshed.
    // Just need it when they first join a room.
    io.emit('message', {username: socket.username, message: "connected!"});
    console.log(socket.username + " connected.");

    this.sendMessage = (message) => { //Sends a message specifically to the client.
        socket.emit('message', message);
    };

    this.broadcastMessage = (message) => {
        if (!socket.username)
            socket.username = message.username;
        let db_message = {
            room: message.room_id,
            content: message.message,
            sender: message.username,
            is_file: false,
            timestamp: new Date()
        }
        //We might need to actually call this on the rooms.js script if needed.
        db.sendMessage(db_message, (err, msg) => {
        });

        if (message.room_id) { // Should always be sent with a room.
            db.getRoom(message.room_id, (err, room) => {
                let nickname;
                // Find the user's nickname (if applicable) and send it along with the message
                for (let arr of room.nicknames) {
                    if (arr[0] == message.username)
                        nickname = arr[1];
                }

                io.emit('message', {
                    room_id: message.room_id,
                    username: socket.username,
                    nickname, //If null, this just won't show up.
                    message: message.message
                })
            });
        } else { //If not, just forward the message along
            io.emit('message', {
                room_id: message.room_id,
                username: socket.username,
                message: message.message
            });
        }
    };

    this.disconnect = () => {
        if (!socket.username || socket.username == "") {
            return;
        }
        io.emit('message', {username: socket.username, message: "disconnected."});
    }

    socket.on('disconnect', this.disconnect);
    socket.on('message', (message) => this.broadcastMessage(message));
    return this;
}

module.exports = Client;