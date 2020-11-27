const Client = require('./routes/client');
let clients = [];

exports.init = (io) => {
    io.on('connection', (socket) => {
        let client = new Client(io, socket);
        clients.push(client);
    });
};

exports.removeClient = client => {
    let index = 0;
    for (let i = 0; i < clients.length; i++) {
        let cl = clients[i];
        if (cl == client) {
            index = i;
            break;
        }
    }

    clients.splice(index, 1);
};

exports.getClientByUsername = username => {
    for (let cl of clients) {
        if (cl.getUsername()) {
            if (cl.getUsername() == username) {
                return cl;
            }
        }
    }
    return;
};