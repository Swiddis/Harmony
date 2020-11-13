const express = require('express');
const pug = require('pug')
const path = require('path');
const rendering = require('./routes/render');

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, '/public')));

app.get('/', routes.index);

app.listen(3000);