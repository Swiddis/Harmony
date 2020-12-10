const express = require('express');
const pug = require('pug')
const path = require('path');
const render = require('./routes/render');
const rooms = require('./routes/rooms');
const users = require('./routes/users');
const media = require('./routes/media');
const bodyParser = require('body-parser');
const expressSession = require("express-session");
const multer = require('multer');
const ioManager = require("./io-manager");
/*
We can interface with the ioManager like this

    let user = ioManager.getClientByUsername("Travja");
    if (user) {
        //This broadcasts a message as "Travja" to room ID "MyRoom".
        // Because the socket is called Travja, the "TEST BOT" username supplied is overwritten.
        user.broadcastMessage({message: "Testing socket stuff", room_id: "MyRoom", username: "TEST BOT"});
    }
 */

const app = express();

const server = require('http').createServer(app);
const io = require('socket.io')(server);
ioManager.init(io);

const upload = multer({
    dest: './public/uploads'
});

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, '/public')));

const urlencodedParser = bodyParser.urlencoded({
    extended: true
});

const jsonParser = bodyParser.json();

const checkAuth = (req, res, next) => {
    if (req.session.user && req.session.user.isAuthenticated) {
        next();
    } else {
        res.redirect("/login");
    }
};

app.use(
    expressSession({
        secret: "It'sSecretPassword",
        saveUninitialized: true,
        resave: true
    })
);

app.get('/', render.index);

// app.get("/room", render.rooms)
app.get("/app", checkAuth, render.rooms);

app.get("/login", render.login);
app.post("/login", urlencodedParser, render.checkAccess);

app.post('/room', checkAuth, jsonParser, rooms.createRoom);
app.patch('/room', checkAuth, jsonParser, rooms.editRoom);
app.post('/leaveroom/:room_id', checkAuth, rooms.leaveRoom);
app.get('/room/:room_id', rooms.getRoom);
app.get('/messages/:room_id', rooms.getMessages); // Possibly add authentication here so no anons can get the message history.
app.post('/room/:room_id', urlencodedParser, rooms.sendToRoom);
app.get('/room/authorize/:room_id', rooms.authorizeRoomAccess);
app.patch('/room/nick/:room_id', urlencodedParser, jsonParser, rooms.updateUserNickname);
app.delete('/room/nick/:room_id/:user', rooms.deleteNickname)

app.post('/settheme/:username/:theme', checkAuth, urlencodedParser, users.setTheme);
app.post('/user', urlencodedParser, users.createUser);
app.get('/user/:username', users.getUser);
app.patch('/user/:username', urlencodedParser, jsonParser, users.updateUser);
app.get('/user/authenticate', users.authenticateUser);
app.post('/dm/:user1/:user2', rooms.establishUserDMs);

app.get("/signup", render.signUp);
app.post("/signup", urlencodedParser, users.createUser); // Redundant?

app.delete('/delete/:id', checkAuth, render.delete);

app.post(
    '/media',
    upload.single('media'),
    media.uploadMedia
);
app.get('/media/:file_name', media.getMedia);

app.get("/logout", render.logout);

server.listen(3000, () => {
    console.log("Listening on port 3000");
});