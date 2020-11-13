/**
 * Room API endpoints
 * RESTful API for room CRUD operations
 * 
 * API is accessed at the /room path
 */

exports.createRoom = () => {};

// Room GET API endpoint
// Takes room ID as path variable, e.g. /room/public
exports.getRoom = (req, res) => {
    let room_id = req.params.room_id;
    res.json({room_id});
};

exports.sendToRoom = () => {};

exports.authorizeRoomAccess = () => {};

exports.establishUserDMs = () => {};