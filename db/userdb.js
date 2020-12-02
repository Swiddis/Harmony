const bcrypt = require("bcryptjs");
const { User } = require("../conf/mongo_conf");
let user_cache = [];

/**
 * The user should be passed in as a JSON object.
 * {
 *     username: "name",
 *     password: "password", //This will be converted to a salted/hashed password
 *     avatar: "url_to_avatar", //This will be either stored locally, or online
 *     joined_rooms: ["room1", "room2"] //Completely optional
 * }
 *
 * @param user_obj - The user to create and add to the db.
 * @param callback - The callback function taking in (err, user)
 */
exports.createUser = (user_obj, callback) => {
  User.findOne(
    {
      username: user_obj.username,
    },
    (err, user) => {
      if (err) {
        console.error("Could not fetch user from DB");
        console.error(err);
        callback(err);
        return;
      }
      if (user) {
        callback(new Error("User already exists"), user);
      } else {
        console.log("Didn't have any errors, but didn't find user.");
        let salt = bcrypt.genSaltSync(10);
        let hash = bcrypt.hashSync(user_obj.password, salt);
        user_obj.password = hash;

        new User(user_obj).save((err, user) => {
          if (err) {
            console.error("Could not save user to DB.");
            console.error(err);
            callback(err);
            return;
          }
          user_cache.push(user);
          callback(undefined, user);
        });
      }
    }
  );
};

/**
 * Attempts to find a user identified by username.
 * Calls the callback on the retrieved user object,
 * or calls an empty callback when running into an error.
 * @param username - The username to search for
 * @param callback - The callback method to call on the given user. callback(err, user)
 */
exports.getUser = (username, callback) => {
  // We'll cache users in memory so we don't always have to query the database
  for (let user of user_cache) {
    if (user.username == username) {
      callback(undefined, user);
      return;
    }
  }

  User.findOne(
    {
      username,
    },
    (err, user) => {
      if (err) {
        console.error("Could not find user by username '" + username + "'");
        console.error(err);
        callback(err);
        return;
      }
      if (user) {
        user_cache.push(user);
        callback(undefined, user);
      } else {
        callback(new Error("User not found"));
      }
    }
  ).select("-__v");
};

//Simply updates the user and saves them to the db.
const updateAndSaveUser = (us, user) => {
  if (user.avatar) {
    us.avatar = user.avatar;
  }

  if(user.theme) {
    us.theme = user.theme;
  }

  if (user.password) {
    let salt = bcrypt.genSaltSync(10);
    let hash = bcrypt.hashSync(user.password, salt);
    user.password = hash;
    us.password = user.password;
  }

  // if (user.joined_rooms) {
  //   us.joined_rooms = user.joined_rooms;
  // }

  new User(us).save((err, user) => {
    if (err) {
      console.error("Could not update user '" + us.username + "'");
      console.error(err);
      return;
    }
  });
};

/**
 * Updates the user by username. The user passed in should contain a
 * plain text password if it is going to be updated. This password will be hashed.
 * @param user - The information to update the user with.
 * @param callback - The method to callback
 */
exports.updateUser = (user, callback) => {
  let username = user.username;
  //Update the cached user.
  for (let us of user_cache) {
    if (us.username == username) {
      updateAndSaveUser(us, user);
      callback(undefined, us);
      return;
    }
  }

  //Cache not found, update and push the update to the db.
  User.findOne(
    {
      username,
    },
    (err, us) => {
      if (err) {
        console.error("Could not fetch user from db.");
        callback(err);
        return;
      }
      updateAndSaveUser(us, user);
      callback(undefined, us);
    }
  );
};

/**
 * Deletes the user by the given username
 * @param username - The username to find and delete
 */
exports.deleteUser = (username, callback) => {
  //Remove from cache
  for (let i = 0; i < user_cache.length; i++) {
    let us = user_cache[i];
    if (us.username == username) {
      user_cache.splice(i, 1);
      break;
    }
  }

  //Remove from db
  User.deleteOne(
    {
      username,
    },
    (err, user) => {
      if (err) {
        console.error("Could not delete user");
        callback(err);
        return;
      }

      callback(undefined, user);
    }
  );
};

/**
 * Test authentication with stored password in the database.
 * @param username - The username to check
 * @param password - The plain-text password to check
 * @param callback - The callback (ie callback(err, user))
 */
exports.authenticateUser = (username, password, callback) => {
  this.getUser(username, (err, user) => {
    if (err) {
      console.error("Error authenticating user '" + username + "':");
      console.error(err);
      callback(err);
      return;
    }

    if (user) {
      if (bcrypt.compareSync(password, user.password)) {
        //Authenticated!
        //TODO Store and send back list of authorities
        callback(undefined, ["USER", "ADMIN"]);
      } else {
        //Not authenticated.
        callback(new Error("Invalid credentials"));
      }
    } else {
      callback(new Error("User not found"));
    }
  });
};
