const express = require('express');
const pug = require('pug')
const path = require('path');
const render = require('./routes/render');
const rooms = require('./routes/rooms');

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, '/public')));

app.get('/', render.index);
app.get('/room/:room_id', rooms.getRoom);

app.listen(3000);