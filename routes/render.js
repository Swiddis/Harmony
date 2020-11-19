const config = require("../config.json");
const {User} = require('../conf/mongo_conf');
const bcrypt = require("bcrypt-nodejs");

var allowed;

exports.index = (req, res) => {
    res.render('index', {
        title: 'Home',
        config: config
    });
};

exports.login = (req, res) => {
    res.render("login", {
        title: "Login",
        config: config
    });
}

exports.rooms = (req, res) => {
    User.find((err, user) => {
        res.render("Room", {
            'title': "Room",
            users: user
        })
    })
}

exports.checkAccess = (req, res) => {
    if(req.body.username == "" || req.body.password == null) {
        res.redirect("/login");
    }

    let userName = req.body.username;
    let userPassword = req.body.password;

    User.findOne({ name: userName }, (err, user) => {
        if(err) return console.error(err);
        let passMatch = bcrypt.compareSync(userPassword, user.password);
        if(passMatch) {
            req.session.user = {
                isAuthenticated: true,
                username: req.body.username
            };
            allowed = userName;
            res.redirect("/room");
        } else {
            res.redirect("/login");
        }
    });
}

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if(err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
}