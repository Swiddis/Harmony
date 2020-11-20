const rooms_container = document.getElementById("left_content");
const messages_container = document.getElementById("display_messages_container");
const message_box = document.getElementById("my_message");
const modal = document.getElementById("room_modal");
const create_modal = document.getElementById("create_room_modal");
const join_modal = document.getElementById("join_room_modal");
//Need to get username (not sure)
let username = "TestUser1";
let currentRoomIndex = 0;
document.getElementById("username_label").innerHTML = username;


async function fetchUser(username){
    let response = await fetch(`/user/${username}`);
    let data = await response.text();
    return JSON.parse(data).data;
};

window.onload = function(){
    fetchUser(username).then(function(user){
        console.log(user);
        if(user.joined_rooms.length > 0){
            renderRoomList(user.joined_rooms);
            renderRoomContent(user.joined_rooms[0]);
            //Currently when first loading in, will just load the first room in the list
        }
    });
};

const socket = io.connect(document.location.host, {query: `username=${username}`});

//Standard Communication Functions
const sendMessage = () => {
    console.log("Sending message: " + message_box.value);
    socket.emit('message', {username: username, message: message_box.value});
    message_box.value = "";
    return false;
};

socket.on('message', msg => {
    console.log(msg);
    messages_container.innerHTML += "<span class='message_box'>" + 
                                        "<span class='avatar'></span>" +
                                        "<span class='name'>" + msg.username +  "</span>" + 
                                        "<span class='message'>" + msg.message + "</span>" + 
                                     "</span>";
    //To scroll to bottom every message(Not done)
    messages_container.scrollTop = messages_container.scrollHeight;
});

async function createRoom(){
    const room_id = document.getElementById("create_id").value;
    const room_title = document.getElementById("create_title").value;
    const password = document.getElementById("create_password").value;
    const nicknames = {};

    const room = {
        room_id: room_id,
        room_title: room_title,
        password: password,
        nicknames: nicknames
    };
    const response = await fetch('/room', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify(room)
    });
    // if(response.status == 200){
    //     console.log(this.responseText);
    //     fetchUser(username).then(function(user){
    //         renderRoomList(user.joined_rooms);
    //         renderRoomContent(user.joined_rooms[user.joined_rooms.length - 1]);
    //     });
    // }else if(response.status == 403){ //Room already exists
    //     console.log(this.responseText);
    // }
};

const joinRoom = () => {
    const room_id = document.getElementById("join_id");
    const password = document.getElementById("join_password");

    fetch(`/room/authorize/${join_id}`, {
        headers: new Headers({
            "Authorization": `Basic ${atob(`${username}:${password}`)}`
        }),
    })
    .then(response => {
        console.log(response.status);
    });
};

//Render Functions
const renderRoomContent = (room) => {
    messages_container.innerHTML = "";
    let messages = {};
    //Not sure how to get rooms messages
    //or room infrastructure
    //messges = room.messages ?

    for(let i = 0; i < messages.length; i++){
        messages_container.innerHTML += "<span class='message_box'>" + 
                                            "<span class='avatar'></span>" +
                                            "<span class='name'>" + messages[i].username +  "</span>" + 
                                            "<span class='message'>" + messages[i].message + "</span>" + 
                                        "</span>";
    }
}

const renderRoomList = (roomList) => {
    rooms_container.innerHTML = "";

    for(let i = 0; i < roomList.length; i++){
        rooms_container.innerHTML += `<span class='room'>${roomList[i].title}</span>`;
        makeRoomClickable(roomList[i]);
    }
    rooms_container.innerHTML += "<span id='new_room'></span>"
};
const makeRoomClickable = (room) => {
    room.addEventListener("click", renderRoomContent(room));
}



//For Modal Displays (Popup Windows)
const displayModal = () => {
    modal.style.display = "block";
};
const displayCreateModal = () => {
    create_modal.style.display = "block";
};
const displayJoinModal = () => {
    join_modal.style.display = "block";
};
const closeModal = () => {
    modal.style.display = "none";
    create_modal.style.display = "none";
    join_modal.style.display = "none";
};



//Assign Buttons Functions
document.getElementById("send_message_button").addEventListener("click", sendMessage);
document.getElementById("new_room").addEventListener("click", displayModal);
document.getElementById("create_room_option").addEventListener("click", displayCreateModal);
document.getElementById("join_room_option").addEventListener("click", displayJoinModal);
document.getElementById("create_room_button").addEventListener("click", createRoom);
document.getElementById("join_room_button").addEventListener("click", joinRoom);
var closeButtons = document.getElementsByClassName("close");
for(var i = 0; i < closeButtons.length; i++){
    closeButtons[i].addEventListener("click", closeModal, false);
}

//Extra
//For EnterSubmit in textarea
// function submitOnEnter(evt){
//     console.log(evt.key);
//     if(evt.key === "Enter"){
//         form.onsubmit();
//         //Set cursor back to textarea
//         messageBox.focus();
//         messageBox.setSelectionRange(0,0);
//     }
//     // if ( (window.event ? e.key : e.which) == 13) { 
//     //     // If it has been so, manually submit the <form>
//     //     form.submit();
//     // }
// }