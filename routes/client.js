const db = require("../db/roomdb");
const userdb = require("../db/userdb");
const ioManager = require("../io-manager");

function Client(io, socket) {
  this.socket = socket;
  /*
    Message object should be formatted as the following:
    {
        sender: "user",
        message: "message",
        room: "room_id"
    }
    */

  this.getSocket = () => socket;
  this.getUsername = () => socket.username;
  this.getAvatar = () => {
    if (socket.avatar) return socket.avatar;
  };

  this.disconnect = () => {
    ioManager.removeClient(this);
    if (!socket.username || socket.username == "") {
      return;
    }
    io.emit("message", {
      username: socket.username,
      message: "disconnected.",
    });
  };

  socket.on("disconnect", this.disconnect);

  //If there is no supplied username, don't do anything else!
  if (!socket.handshake.query.username) {
    console.error("User connected without a username!");
    return;
  } else {
    socket.username = socket.handshake.query.username;
  }
  //We probably don't need to send this message every time the page is refreshed.
  // Just need it when they first join a room.
  let connect = () => {
    io.emit("message", {
      username: socket.username,
      avatar: socket.avatar,
      message: "connected!",
    });
    console.log(socket.username + " connected.");
  };

  userdb.getUser(socket.username, (err, user) => {
    if (err) {
      console.log(
        "A user attempted to connect by username '" +
          socket.username +
          "' but we couldn't fetch data for them."
      );
      return;
    }
    if (user) {
      socket.avatar = user.avatar;
      connect();
    } else {
      console.log(
        "Could not find user by the name of '" +
          socket.username +
          "' on the database."
      );
    }
  });

  this.sendMessage = (message) => {
    //Sends a message specifically to the client.
    socket.emit("message", message);
  };

  this.broadcastMessage = (message) => {
    if (!socket.username && message.username)
      socket.username = message.username;
    if (!message.username && socket.username)
      message.username = socket.username;

    let db_message = {
      room: message.room_id,
      content: message.message,
      sender: socket.username,
      avatar: socket.avatar,
      is_file: message.is_file,
      timestamp: new Date(),
    };
    //We might need to actually call this on the rooms.js script if needed.
    db.sendMessage(db_message, (err, msg) => {});

    if (message.room_id) {
      // Should always be sent with a room.
      db.getRoom(message.room_id, (err, room) => {
        let nickname = room.getNickname(socket.username);
        // Find the user's nickname (if applicable) and send it along with the message
        // if (room.nicknames) {
        //     for (let arr of room.nicknames) {
        //         if (arr[0] == message.username)
        //             nickname = arr[1];
        //     }
        // }

        let msg = {
          room_id: message.room_id,
          username: socket.username,
          nickname, //If null, this just won't show up.
          avatar: socket.avatar,
          message: message.message,
          is_file: message.is_file,
        };

        io.emit("message", msg);
      });
    } else {
      //If not, just forward the message along
      io.emit("message", {
        room_id: message.room_id,
        username: socket.username,
        avatar: socket.avatar,
        message: message.message,
        is_file: message.is_file,
      });
    }
  };

  socket.on("message", (message) => this.broadcastMessage(message));
  return this;
}

module.exports = Client;
