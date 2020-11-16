const bcrypt = require('bcryptjs');
const {User} = require('../conf/mongo_conf');
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
    User.findOne({username: user_obj.username}, (err, user) => {
        if (err) {
            console.error("Could not fetch user from DB");
            console.error(err);
            callback(err);
            return;
        }
        if (user) {
            callback("User already exists", user);
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
    });
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

    User.findOne({username}, (err, user) => {
        if (err) {
            console.error("Could not find user by username '" + username + "'");
            console.error(err);
            callback(err);
            return;
        }
        user_cache.push(user);
        callback(undefined, user);
    });
};

exports.updateUser = (username, user) => {
};

exports.deleteUser = () => {
};

exports.authenticateUser = () => {
};