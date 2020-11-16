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

//The following methods are really just test end-points. Modify and export to other classes at will.
app.post('/createuser', bodyParser.json(), (req, res) => {
    userdb.createUser(req.body, (err, user) => {
        if (err) {
            res.status(400).json({err});
            return;
        }
        res.status(204).send();
    });
});

app.put('/updateuser', bodyParser.json(), (req, res) => {
    userdb.updateUser(req.body, (err, user) => {
        if (err) {
            res.status(400).json({err});
            return;
        }

        res.status(204).send();
    });
});

app.delete('/deleteuser/:username', (req, res) => {
    userdb.deleteUser(req.params.username, (err, user) => {
        if(err) {
            res.status(500).send(err);
        } else {
            res.status(204).send();
        }
    });
});

app.listen(3000);