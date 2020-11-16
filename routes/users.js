// User POST endpoint
// Post to /user, accepts input in JSON format
exports.createUser = () => {
    let user = {
        username: req.body.username,
        password: req.body.password,
    };
    let response;

    try {
        db.createUser(user);
        res.status(201);
        response = {
            'timestamp': new Date().toISOString(),
            'status': 201,
            'path': '/user'
        };
    } catch (err) {
        res.status(500);
        response = {
            'timestamp': new Date().toISOString(),
            'status': 500,
            'error': err.message(),
            'path': '/user'
        };
    }
    res.json(response);
};

// User GET API endpoint
// Takes username as path variable, e.g. /user/john_doe
exports.getUser = () => {
    let username = req.params.username;
    let response;

    try {
        let user = db.getUser(username);
        response = {
            'timestamp': new Date().toISOString(),
            'status': 200,
            'data': user,
            'path': '/user/' + encodeURIComponent(user.username)
        };
    } catch (err) {
        res.status(500);
        response = {
            'timestamp': new Date().toISOString(),
            'status': 500,
            'error': err.message(),
            'path': '/user'
        };
    }

    res.json(response);
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
    let response;
    
    try {
        db.updateUser(username, updates);
        response = {
            'timestamp': new Date().toISOString(),
            'status': 200,
            'path': '/user'
        };
    } catch (err) {
        res.status(500);
        response = {
            'timestamp': new Date().toISOString(),
            'status': 500,
            'error': err.message(),
            'path': '/user'
        };
    }
    res.json(response);
};

exports.deleteUser = () => {
    let user = req.params.username;
    let response;
    try {
        db.deleteUser(username);
        response = {
            'timestamp': new Date().toISOString(),
            'status': 200,
            'path': '/user'
        };
    } catch (err) {
        res.status(500);
        response = {
            'timestamp': new Date().toISOString(),
            'status': 500,
            'error': err.message(),
            'path': '/user'
        };
    }

    res.json(response);
};

exports.authenticateUser = (req, res) => {
    res.json({
        'timestamp': new Date().toISOString(),
        'status': 200,
        'path': '/user/authenticate',
        'authorities': ['USER', 'ADMIN']
    });
};
