const socket = io.connect(document.location.host, {
  query: `username=${document.getElementById("username").innerText}`,
}); // <-- The client should connect to the server by passing in its username like this!
const messages = document.getElementById("messages");
const form = document.getElementById("sendMessage");
const messageBox = document.getElementById("message");
const setUsername = document.getElementById("setUsername");
const username = document.getElementById("username");

// setUsername.onsubmit = () => {
//     if (username.value == "") {
//         alert("Please enter a username!");
//         return false;
//     }
//
//     console.log("Setting username");
//     socket.emit('username', username.value);
//     alert("Username set!");
//     return false;
// };

form.onsubmit = () => {
  // We should be connecting with a username now.

  // if (username.value == "") {
  //     alert("Please enter a username!");
  //     return false;
  // }
  console.log("Sending message: " + messageBox.value);
  socket.emit("message", {
    username: username.value,
    message: messageBox.value,
  });
  messageBox.value = "";
  return false;
};

socket.on("message", (msg) => {
  console.log(msg);
  messages.innerHTML +=
    "<div class='message'>" + msg.username + ": " + msg.message + "</div>";
});
