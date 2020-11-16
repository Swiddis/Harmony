const express = require('express');
const pug = require('pug')
const path = require('path');
const bodyParser = require('body-parser');
const userdb = require('./db/userdb');
const rendering = require('./routes/render');

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, '/public')));

app.get('/', rendering.index);

app.post('/createuser', bodyParser.json(), (req, res) => {
    userdb.createUser(req.body, (err, user) => {
        if (err) {
            res.status(400).json({err});
            return;
        }
        if (user) {
            res.status(204).send();
        }
    });
});

app.listen(3000);