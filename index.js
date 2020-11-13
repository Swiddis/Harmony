const express = require('express');
const pug = require('pug')
const path = require('path');
const room_routes = require('./routes/rooms');

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, '/public')));

app.get('/', room_routes.index);

app.listen(3000);