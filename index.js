const express = require('express');
const pug = require('pug')
const path = require('path');
const render = require('./routes/render');
const rooms = require('./routes/rooms');
const users = require('./routes/users');
const bodyParser = require('body-parser');

const app = express();

const server = require('http').createServer(app);
const io = require('socket.io')(server);
io.on('connection', (socket) => {
    console.log("Received connection. Waiting for credentials.");

    socket.on('username', (username) => {
        socket.username = username;
        console.log(username + " connected");
        io.emit('message', {username, message: "connected!"});
    });

    socket.on('disconnect', () => {
        console.log("Received disconnect request for user " + socket.username);
        if (!socket.username || socket.username == "") {
            return;
        }
        io.emit('message', {username: socket.username, message: "disconnected."});
    });

    socket.on('message', (message) => {
        console.log("Received message: ");
        console.log(message);
        io.emit('message', {username: socket.username, message: message.message});
    });
});


app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, '/public')));

const urlencodedParser = bodyParser.urlencoded({
    extended: true
})

app.get('/', render.index);

app.get("/login", render.login);
app.post("/login", urlencodedParser, render.checkAccess);

app.post('/room', urlencodedParser, rooms.createRoom);
app.get('/room/:room_id', rooms.getRoom);
app.post('/room/:room_id', urlencodedParser, rooms.sendToRoom);
app.get('/room/authorize/:room_id', rooms.authorizeRoomAccess);

app.post('/user', urlencodedParser, users.createUser);
app.get('/user/:usermame', users.getUser);
app.patch('/user/:username', urlencodedParser, users.updateUser);
app.get('/user/authenticate', users.authenticateUser);

app.get('/testsocket', (req, res) => {
    res.render('testsocket')
});

server.listen(3000, () => {
    console.log("Listening on port 3000");
});