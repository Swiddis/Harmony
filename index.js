const express = require('express');
const pug = require('pug')
const path = require('path');
const render = require('./routes/render');
const rooms = require('./routes/rooms');
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
app.post("/login", urlencodedParser, render.checkAcces);

app.get('/room/:room_id', rooms.getRoom);

app.listen(3000);