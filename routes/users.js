// User POST endpoint

const { response } = require("express");
const db = require("../db/userdb");
const roomdb = require("../db/roomdb");
const io = require("../io-manager");

// Post to /user, accepts input in JSON format
exports.createUser = (req, res) => {
  console.log(req.body);
  let user = {
    username: req.body.username,
    password: req.body.password,
    avatar: `https://ui-avatars.com/api/size=256&name=${req.body.username}`,
  };

  db.createUser(user, (err, user) => buildCreationResponse(res, err, user));
  roomdb.authorizeRoomAccess(user.username, "public", "", (err, authorities) =>
    buildAuthResponse(res, err, authorities)
  );
  res.redirect("/login");
};

// User GET API endpoint
// Takes username as path variable, e.g. /user/john_doe
exports.getUser = (req, res) => {
  let username = req.params.username;

  db.getUser(username, (err, user) => buildResponse(res, err, user));
};

// User PATCH endpoint
// Patch to /user/username
exports.updateUser = (req, res) => {
  let username = req.params.username;
  let updates = {
    avatar: req.body.avatar,
    username,
    password: req.body.password,
    // joined_rooms: req.body.joined_rooms, // Joined rooms will all be handled from the server. The client shouldn't be allowed to change these values.
  };
  if (updates.avatar) {
    //Get applicable socket for the user and update the socket's avatar.
    let client = io.getClientByUsername(username);
    if (client) {
      client.getSocket().avatar = updates.avatar;
    }
  }

  db.updateUser(updates, (err, user) => buildResponse(res, err, user));
};

// User DELETE endpoint
// Delete at /user/username
exports.deleteUser = (req, res) => {
  let username = req.params.username;

  db.deleteUser(username, (err, user) => buildResponse(res, err, user));
};

exports.setTheme = (req, res) => {
  let username = req.params.username;
  let theme = req.params.theme;

  db.updateUser({username, theme}, (err, user) => buildResponse(res, err, user));
};

// User GET authentication endpoint
// Authenticate /user/authenticate
exports.authenticateUser = (req, res) => {
  let auth = btoa(req.headers.Authorization.substring(6)).split(":"); // Remove leading 'Basic ' and convert from base64
  let username = auth[0];
  let password = auth.slice(1).join(":");

  db.authenticateUser(username, password, (err, user) =>
    buildAuthResponse(res, err, user)
  );
};

const buildCreationResponse = (res, err, room) => {
  buildResponse(res, err, room, true);
};

const buildResponse = (res, err, user, created = false) => {
  let response;
  let user_path = user ? "/" + encodeURIComponent(user.username) : "";

  if (err) {
    response = {
      timestamp: new Date().toISOString(),
      path: "/user" + user_path,
      error: err.message,
    };
    if (err.message == "User not found") {
      response.status = 404;
    } else if (err.message == "User already exists") {
      response.status = 403;
    } else {
      response.status = 500;
    }
  } else {
    response = {
      timestamp: new Date().toISOString(),
      status: 200,
      path: "/user" + user_path,
    };
    if (user) {
      let tempUser = {
        username: user.username,
        joined_rooms: user.joined_rooms,
        avatar: user.avatar,
        theme: user.theme
      }; //Make sure not to send back the password!
      response.data = tempUser;
    }
    if (created) response.status = 201;
  }

  res.status(response.status);
  res.json(response);
};

const buildAuthResponse = (res, err, authorities) => {
  let response;

  if (err) {
    response = {
      timestamp: new Date().toISOString(),
      path: "/user/authenticate",
      error: err.message,
    };
    if (err.message == "User not found") {
      response.status = 404;
    } else if (err.message == "Invalid credentials") {
      response.status = 401;
    } else {
      response.status = 500;
    }
  } else {
    response = {
      timestamp: new Date().toISOString(),
      status: 200,
      path: "/user/authenticate",
      authorities: authorities,
    };
  }

  res.status(response.status);
  res.json(response);
};
