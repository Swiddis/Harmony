const config = require("../config.json");

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

exports.checkAccess = (req, res) => {

}