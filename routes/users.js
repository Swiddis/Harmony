// User POST endpoint

const { response } = require("express");

// Post to /user, accepts input in JSON format
exports.createUser = (req, res) => {
    let user = {
        username: req.body.username,
        password: req.body.password,
    };

    db.createUser(user, buildResponse);
};

// User GET API endpoint
// Takes username as path variable, e.g. /user/john_doe
exports.getUser = (req, res) => {
    let username = req.params.username;

    db.getUser(username, buildResponse);
};

// User PATCH endpoint
// Patch to /user/username
exports.updateUser = (req, res) => {
    let username = req.params.username;
    let updates = {
        avatar: req.body.avatar,
        username: req.body.uesrname,
        password: req.body.password,
        joined_rooms: req.body.joined_rooms
    };

    db.updateUser(username, updates, buildResponse);
};

// User DELETE endpoint
// Delete at /user/username
exports.deleteUser = (req, res) => {
    let username = req.params.username;
    
    db.deleteUser(username, buildResponse);
};

// User authentication endpoint
// Authenticate /user/authenticate
exports.authenticateUser = (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    db.authenticateUser(username, password, buildAuthResponse);
};

const buildResponse = (err, user) => {
    let response;
    let user_path = user ? '/' + encodeURIComponent(user.username) : '';

    if (err) {
        response = {
            'timestamp': new Date().toISOString(),
            'path': '/user' + user_path,
            'error': err.message()
        }
        if (err.message() == "User not found") {
            response.status = 404;
        } else if (err.message() == "User already exists") {
            response.status = 403;
        }else {
            response.status = 500;
        }
    } else {
        response = {
            'timestamp': new Date().toISOString(),
            'status': 200,
            'path': '/user' + user_path
        }
        if (user) response.data = user;
    }

    res.status(response.status);
    res.json(response);
};

const buildAuthResponse = (err, authorities) => {
    let response;

    if (err) {
        response = {
            'timestamp': new Date().toISOString(),
            'path': '/user/authenticate',
            'error': err.message()
        }
        if (err.message() == "User not found") {
            response.status = 404;
        } else if (err.message() == "Invalid credentials") {
            response.status = 401;
        } else {
            response.status = 500;
        }
    } else {
        response = {
            'timestamp': new Date().toISOString(),
            'status': 200,
            'path': '/user/authenticate',
            'authorities': authorities
        }
    }

    res.status(response.status);
    res.json(response);
}
