const express = require('express');
const pug = require('pug')
const path = require('path');
const render = require('./routes/render');
const rooms = require('./routes/rooms');
const users = require('./routes/users');
const bodyParser = require('body-parser');

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, '/public')));

var urlencodedParser = bodyParser.urlencoded({
    extended: true
})

app.get('/', render.index);

app.get("/login", render.login);
app.post("/login", urlencodedParser, render.checkAccess);

app.post('/room', urlencodedParser, rooms.createRoom);
app.get('/room/:room_id', rooms.getRoom);
app.post('/room/:room_id', urlencodedParser, rooms.sendToRoom)

app.post('/user', urlencodedParser, users.createUser);
app.get('/user/:usermame', users.getUser);
app.patch('/user/:username', urlencodedParser, users.updateUser);
app.get('/user/authenticate', users.authenticateUser);

app.listen(3000);