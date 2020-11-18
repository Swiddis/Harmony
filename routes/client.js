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

    this.sendMessage = (message) => { //Sends a message specifically to the client.
        socket.emit('message', message);
    };

    this.broadcastMessage = (message) => {
        if(!socket.username)
            socket.username = message.username;
        let db_message = {
            room_id: message.room_id,
            content: message.message,
            sender: message.username,
            is_file: false,
            timestamp: new Date()
        }
        //We might need to actually call this on the rooms.js script if needed.
        db.sendMessage(db_message, (err, msg) => {});

        io.emit('message', {username: socket.username, message: message.message});
    };

    //This method currently isn't used and may not be.
    // The client is kind of responsible for sending the username to the server.
    // This will also not be used since they will be logging in by username and their
    // username shouldn't change. Maybe we change this to nicknames.
    this.updateUsername = (username) => {
        socket.username = username;
        io.emit('message', {username, message: "connected!"});
    };

    this.disconnect = () => {
        if (!socket.username || socket.username == "") {
            return;
        }
        io.emit('message', {username: socket.username, message: "disconnected."});
    }

    console.log("Client connected.");

    socket.on('username', (username) => this.updateUsername(username));
    socket.on('disconnect', this.disconnect);
    socket.on('message', (message) => this.broadcastMessage(message));
    return this;
}

module.exports = Client;