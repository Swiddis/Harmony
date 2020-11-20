const express = require('express');
const pug = require('pug')
const path = require('path');
const render = require('./routes/render');
const rooms = require('./routes/rooms');
const users = require('./routes/users');
const bodyParser = require('body-parser');
const expressSession = require("express-session");

const app = express();

const server = require('http').createServer(app);
const io = require('socket.io')(server);
const Client = require('./routes/client');
io.on('connection', (socket) => new Client(io, socket));


app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, '/public')));

const urlencodedParser = bodyParser.urlencoded({
    extended: true
})

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
)

app.get('/', render.index);

// app.get("/room", render.rooms)
app.get("/room", checkAuth, render.rooms)

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

app.get("/signup", render.signUp);
app.post("/signup", urlencodedParser, users.createUser); // Redundant?

//TODO Development purposes. Will be removed for prod.
app.get('/testsocket', (req, res) => {
    res.render('testsocket', {
        username: (req.session.user ? req.session.user.username : undefined)
    })
});

app.get("/logout", render.logout)

server.listen(3000, () => {
    console.log("Listening on port 3000");
});
