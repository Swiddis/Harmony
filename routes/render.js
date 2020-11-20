const config = require("../config.json");
const {User} = require('../conf/mongo_conf');
const bcrypt = require("bcrypt-nodejs");
const userdb = require('../db/userdb');

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

exports.signUp = (req, res) => {
    res.render("create", {
        title: "Sign Up",
        config: config
    });
}

exports.rooms = (req, res) => {
    User.find((err, user) => {
        res.render("room", {
            'title': "Room",
            users: user,
            //The user should exist and be passed into the render
            // Since this should be an authenticated end-point, this works.
            // TestUser1's password is testing123
            // Other accounts should be able to be created using the sign up page.
            username: (req.session.user ? req.session.user.username : undefined)
        })
    })
}

exports.checkAccess = (req, res) => {
    if (req.body.username == "" || req.body.password == null) {
        res.redirect("/login");
    }

    let userName = req.body.username;
    let userPassword = req.body.password;
    console.log("Attempting to authenticate user " + userName);

    userdb.authenticateUser(userName, userPassword, (err, user) => {
        if (err) {
            if (err.message == "Invalid credentials" || err.message == "User not found") {
                res.redirect("/login");
                return;
            }
        }

        console.log("User authenticated!");
        req.session.user = {
            isAuthenticated: true,
            username: req.body.username
        };
        allowed = userName;
        res.redirect("/room");
    });
}

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
}
