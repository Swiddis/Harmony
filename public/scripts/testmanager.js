const socket = io.connect(document.location.host, {query: `username=${document.getElementById("usernameText").innerText}`});
const messages = document.getElementById("messages");
const form = document.getElementById("message_container");
const messageBox = document.getElementById("my_message");
const setUsername = document.getElementById("setUsername");
const username = document.getElementById("username");

const usernameText = document.getElementById("usernameText");

setUsername.onsubmit = () => {
    if(username.value == "") {
        alert("Please enter a username!");
        return false;
    }

    console.log("Setting username");
    socket.emit('username', username.value);
    alert("Username set!");
    usernameText.innerHTML = username.value;
    return false;
};

form.onsubmit = () => {
    if (username.value == "") {
        alert("Please enter a username!");
        return false;
    }
    console.log("Sending message: " + messageBox.value);
    socket.emit('message', {username: username.value, message: messageBox.value});
    messageBox.value = "";
    return false;
};

socket.on('message', msg => {
    console.log(msg);
    messages.innerHTML += "<span class='message_box'>" + 
                                "<span class='avatar'></span>" +
                                "<span class='name'>" + msg.username +  "</span>" + 
                                "<span class='message'>" + msg.message + "</span>" + 
                            "</span>";
});