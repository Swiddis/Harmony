/*

This is just a basic layout for Mongo that can be included and utilized using code similar to the following.

Everything should be preconfigured to connect to an online Mongo cluster. If you copy the
provided connection URI to MongoDB Compass, you should be able to connect and view documents on the DB.

const {User, Message, Room} = require('../conf/mongo_conf');

new User({
    avatar: '',
    username: 'test',
    password: 'test',
    joined_rooms: []
}).save((err, user) => {
    if(err) {
        console.error(err);
        return;
    }
    console.log("saved new user");
});
 */


const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

mongoose.connect('mongodb+srv://admin:Ydp4ZCmttqp2zPj@harmony-main.784cu.mongodb.net/data?retryWrites=true&w=majority', {
    useUnifiedTopology: true,
    useNewUrlParser: true
});

let userSchema = mongoose.Schema({
    avatar: String,
    username: String,
    password: String,
    joined_rooms: [String]
});

let roomSchema = mongoose.Schema({
    room_id: String,
    room_title: String,
    password: String,
    nicknames: [{
        name: String,
        nick: String
    }]
});

let messageSchema = mongoose.Schema({
    room: String,
    content: String,
    sender: String,
    is_file: Boolean,
    timestamp: Date
});

exports.User = mongoose.model('users', userSchema);
exports.Room = mongoose.model('rooms', roomSchema);
exports.Message = mongoose.model('message', messageSchema);

let mdb = mongoose.connection;
mdb.on('error', console.error.bind(console, 'connection error'));
mdb.once('open', callback => {
    console.log("Connected to Mongo!");
});