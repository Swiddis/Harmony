/*
    SOCKET AND SERVER COMMUNICATION SCRIPT
*/
const rooms_container = document.getElementById("rooms_container");
const messages_container = document.getElementById(
    "display_messages_container"
);
const message_box = document.getElementById("my_message");
const menu = document.getElementById("context_menu");

let username = document.getElementById("username_label").innerText;
let nicknames;
let joined_rooms = [];
let room_titles = {};
let currentRoomId; //Is assigned whenever in renderRoomContent() is called (meaning onLoad or when clicking on bubble)
let currentContextRoomId; //Assigned whenever right clicked bubble
let prev_sender = undefined;
let prev_timestamp = -1000;
const FIVE_MINS = 5 * 60 * 1000;

async function fetchUser(username) {
    let response = await fetch(`/user/${username}`);
    let data = await response.text();
    return JSON.parse(data).data;
}

//Does not include messages
async function fetchRoomData(roomid) {
    let response = await fetch(`/room/${roomid}`);
    let data = await response.text();
    return JSON.parse(data).data;
}

async function fetchRoomMessages(roomid) {
    let response = await fetch(`/messages/${roomid}`);
    let data = await response.text();
    return JSON.parse(data).data;
}

window.onload = function () {
    fetchUser(username).then(function (user) {
        console.log(user);
        if (user.joined_rooms.length > 0) {
            renderRoomList();
            //Currently when first loading in, will just load the first room in the list
            console.log("JOINED_ROOMS:" + user.joined_rooms[0]);
            renderRoomContent(user.joined_rooms[0]);
        }
    });
};

const socket = io.connect(document.location.host, {
    query: `username=${username}`,
});

//Standard Communication Functions
const sendMessage = () => {
    const processFile = () => {
        // Check if they have a pending file upload and send it.
        let upload = document.getElementById("my_file");
        if (upload.files.length > 0) {
            console.log("Uploading file.");
            sendFile();
        }
    };

    const processMessage = () => {
        if (message_box.innerText.length == 0) {
            //The message doesn't have any contents
            return;
        }
        if (message_box.innerText.length > 2000) {
            //TODO: Display to user message is to long!
            console.log("Message To Long!");
            alert("You're message is too long! Max of 2000 characters");
            return;
        }
        console.log("Sending message: " + message_box.innerText);
        socket.emit("message", {
            username: username,
            message: message_box.innerText,
            room_id: currentRoomId,
        });
        message_box.innerText = "";
    };

    processMessage();
    processFile();
    return false;
};

const sendFile = (callback) => {
    var form = document.forms.namedItem("send_media");
    var formData = new FormData(form);

    formData.append("sender", username);
    formData.append("room_id", currentRoomId);

    var request = new XMLHttpRequest();
    request.open("POST", "/media");
    request.onload = function () {
        console.log(request.status);
        if (request.status === 200) {
            console.log(request.response);

            socket.emit("message", {
                username: username,
                message: JSON.parse(request.response).path,
                room_id: currentRoomId,
                is_file: true,
            });
            document.getElementById("img_preview").innerHTML = "";
            document.getElementById("my_file").value = "";
            closeModals();
            if (callback)
                callback();
        }
    };
    request.send(formData);
};

const openUserInfo = user => {
    closeModals();
    console.log("Opening user info for " + user);

    fetch(`/user/${user}`)
        .then(response => response.json())
        .then(data => {
            let userData = data.data;
            console.log(userData);
            let modal = document.createElement("div");
            modal.id = "user_modal";
            modal.classList = ["modal"];

            let content = document.createElement("div");
            content.classList = ["modal_content"];
            modal.append(content);

            let avatar = document.createElement("span");
            avatar.classList = ["avatar"];
            let img = new Image();
            img.src = userData.avatar;
            img.onerror = loadDefault;
            avatar.append(img);
            content.append(avatar);

            let close = document.createElement("span");
            close.classList = ["close"];
            close.onclick = evt => {
                modal.remove();
                closeModals();
            }
            close.innerHTML = "&times;"
            content.append(close);
            //TODO Load in user info like avatar.

            let name = document.createElement("div");
            name.classList = ["name"];
            name.innerHTML = user;
            content.append(name);

            if (user != username) {
                //Only display DM button if it's not YOU.
                let dmButton = document.createElement("button");
                dmButton.classList = ["button"];
                dmButton.innerText = "Start DM";
                content.append(dmButton);
                dmButton.onclick = evt => {
                    fetch(`/dm/${username}/${user}`,
                        {
                            method: "POST"
                        })
                        .then(response => {
                            return response.json();
                        })
                        .then(data => {
                            closeModals();
                            renderRoomList();
                            renderRoomContent(data.data.room_id);
                        });
                };
            }

            let clear = document.createElement("div");
            clear.classList = ["clear"];
            content.append(clear);

            let mutual = document.createElement("div");
            mutual.id = "mutual";
            mutual.innerHTML = "<div class='title'>Mutual Rooms</div>";
            content.append(mutual);

            let foundRoom = false;
            userData.joined_rooms.forEach(room => {
                if (joined_rooms.includes(room)) {
                    foundRoom = true;
                    let roomLink = document.createElement("div");
                    roomLink.classList = ["room-link"];
                    roomLink.innerHTML = "- " + room_titles[room];

                    mutual.append(roomLink);

                    roomLink.onclick = evt => {
                        closeModals();
                        renderRoomContent(room);
                    };
                }
            });

            if (!foundRoom)
                content.innerHTML += "<div class='room-link'>No mutual rooms</div>";

            document.getElementById("modal_background").style.display = "flex";
            modal.style.display = "block";
            document.getElementById("modal_background").append(modal);
        });
};

socket.on("message", (msg) => {
    console.log(msg);
    //for now if msg recieved is from currentroomid display
    if (msg.nickname) {
        let set = false;
        for (let obj of nicknames) {
            if (obj.name == msg.username) {
                obj.nick = msg.nickname;
                set = true;
            }
        }
        if (!set) {
            nicknames.push({name: msg.username, nick: msg.nickname});
        }
    }

    if (msg.room_id === currentRoomId) {
        // messages_container.innerHTML += formatRoomMessage(
        //     msg.avatar,
        //     msg.username,
        //     msg.message,
        //     msg.is_file,
        //     msg.timestamp
        // );
        renderGroupedMessages(msg);

        if (msg.username != username) {
            let notif = document.getElementById("notif");
            notif.volume = 0.5;
            notif.play();
        }
        //TODO make scroll to bottom every message only when already scrolled down
        messages_container.scrollTop = messages_container.scrollHeight;
    }
});

socket.on("custom", data => {
    if (data.action) {
        if (data.action == "rerender") {
            console.log("Re-rendering room list.");
            renderRoomList();
        }
    }
});

const createRoom = () => {
    const room_id = document.getElementById("create_id").value;
    const room_title = document.getElementById("create_title").value;
    const password = document.getElementById("create_password").value;

    const room = {
        room_id: room_id,
        room_title: room_title,
        owner: username,
        password: password,
        roomAvatar: "./images/room.png",
    };

    fetch("/room", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(room),
    }).then((response) => {
        console.log(response.status);
        if (response.status === 201) {
            console.log("CREATED ROOM SUCCESSFULLy!");
            //TODO Quick Fix so you don't have to manually join the room after making it
            document.getElementById("join_id").value = room_id;
            document.getElementById("join_password").value = password;
            joinRoom();
            closeModals();
        }
    });
};

const joinRoom = () => {
    const room_id = document.getElementById("join_id").value;
    const password = document.getElementById("join_password").value;

    fetch(`/room/authorize/${room_id}`, {
        headers: new Headers({
            Authorization: "Basic " + btoa(username + ":" + password),
        }),
    }).then((response) => {
        if (response.status === 200) {
            console.log("JOINED ROOM: " + room_id);
            renderRoomList();
            renderRoomContent(room_id);
            closeModals();
        }
    });
};

const leaveRoom = () => {
    //TODO
    //currentContextRoomId;
    //Allow leaving rooms
};

const loadDefault = img => {
    if (img.target)
        img = img.target;
    img.src = "/images/user_icon_blue.png";
};
const loadDefaultRoom = img => {

};

const formatImage = message => {
    //If message is an image (render it inline)
    let isImage = isFileImage(message);
    let fileStr = splitFileString(message);
    let ret = "";
    if (!isImage) {
        ret += `<a href='${fileStr[0]}' download='${fileStr[1]}'>`;
    }
    if (isImage) {
        ret += `<img src='${fileStr[0]}' alt='${fileStr[1]}' title='${fileStr[1]}' class='message_image' onclick="displayViewImageModal('${fileStr[0]}', '${fileStr[1]}')"/>`;
    } else {
        ret += `<img src='/images/media.png' alt='${fileStr[1]}' title='${fileStr[1]}' class='message_image'/><div>${fileStr[1]}</div>`;
    }
    if (!isImage) {
        ret += `</a>`;
    }
    return ret;
};

//Render Functions
const formatRoomMessage = (avatar, username, message, isFile, timestamp) => {
    let formattedMessage = "";
    let name = getNickname(username);
    let date = new Date(timestamp);
    let now = new Date();

    //If Message is a file
    if (isFile) {
        formattedMessage =
            "<span class='message_box'>" +
            `<div onclick='openUserInfo("${username}")' class='msgAvatar'><span class='avatar'><img onerror="loadDefault(this)" src="${avatar}" alt="${username}_avatar"/></span></div>` +
            `<span onclick='openUserInfo("${username}")' class='name'>` +
            name +
            "</span>" +
            "<span class='message'>";

        formattedMessage += formatImage(message);

        formattedMessage += "<div class='timestamp'>" +
            (now.toLocaleDateString() != date.toLocaleDateString() ? date.toLocaleDateString() + "<br>" : "") +
            date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) +
            "</div>" +
            "</span></span>";
    } else {
        formattedMessage =
            "<span class='message_box'>" +
            `<div onclick='openUserInfo("${username}")' class='msgAvatar'><span class='avatar'><img onerror="loadDefault(this)" src="${avatar}" alt="${username}_avatar"/></span></div>` +
            `<span onclick='openUserInfo("${username}")' class='name'>` +
            name +
            "</span>" +
            "<span class='message'>" +
            message +
            "<div class='timestamp'>" +
            (now.toLocaleDateString() != date.toLocaleDateString() ? date.toLocaleDateString() + "<br>" : "") +
            date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) +
            "</div>" +
            "</span>" +
            "</span>";
    }

    return formattedMessage;
};

const formatRoomMessagePartial = (message, isFile, timestamp) => {
    let formattedMessage = "";
    let date = new Date(timestamp);
    let now = new Date();

    //If Message is a file
    if (isFile) {
        formattedMessage +=
            "<span class='message'>";

        formattedMessage += formatImage(message);

        formattedMessage += "<div class='timestamp'>" +
            (now.toLocaleDateString() != date.toLocaleDateString() ? date.toLocaleDateString() + "<br>" : "") +
            date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) +
            "</div>" +
            "</span>";
    } else {
        formattedMessage +=
            "<span class='message'>" +
            message +
            "<div class='timestamp'>" +
            (now.toLocaleDateString() != date.toLocaleDateString() ? date.toLocaleDateString() + "<br>" : "")
            + date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) +
            "</div>" +
            "</span>";
    }

    return formattedMessage;
};

const renderGroupedMessages = msg => {
    if (!msg.sender && msg.username)
        msg.sender = msg.username;
    if (!messages_container.lastChild || msg.sender != prev_sender || Math.abs(new Date(msg.timestamp) - prev_timestamp) > FIVE_MINS) {
        prev_sender = msg.sender;
        messages_container.innerHTML += formatRoomMessage(
            msg.avatar,
            msg.sender,
            msg.content ? msg.content : msg.message,
            msg.is_file,
            msg.timestamp
        );
    } else {
        //Let's double up messages a bit so it's not as spread out.
        // Just with an extra line break between.
        let prev_message = messages_container.lastChild;
        prev_message.innerHTML += formatRoomMessagePartial(
            msg.content ? msg.content : msg.message,
            msg.is_file,
            msg.timestamp
        );
    }
    prev_timestamp = new Date(msg.timestamp);
};

const renderRoomContent = (roomid, forceRender = false) => {
    //So the room doesn't rerender the same room if clicked again
    if (currentRoomId === roomid && !forceRender) {
        return;
    }

    console.log("RENDERING ROOM: " + roomid);
    messages_container.innerHTML = "";

    fetchRoomData(roomid).then(function (room) {
        if (!room) return;
        nicknames = room.nicknames;
        //RoomName Label (Right bar)
        document.getElementById("roomname_label").innerHTML = room.room_title;
        //Nickname User Label (Right bar)
        let nickname = getNickname(username);
        if (nickname !== username) {
            document.getElementById("username_label").innerHTML = username + ` ("${nickname}")`;
        } else {
            document.getElementById("username_label").innerHTML = username;
        }

        fetchRoomMessages(roomid).then(function (messages) {
            currentRoomId = roomid;
            //Currently the messages array is backwards so will do it this way
            for (let i = messages.length - 1; i >= 0; i--) {
                let msg = messages[i];
                renderGroupedMessages(msg);
            }
        });
    });
};

const showRoomTip = (id) => {
    tipId = id + "_tip";
    let tip = document.getElementById(tipId);
    tip.style.top = tip.parentElement.getBoundingClientRect().y + 6 + "px";
    tip.style.left = tip.parentElement.getBoundingClientRect().left + 72 + "px";
    tip.style.pointerEvents = "none";
    tip.style.display = "block";
};
const hideRoomTip = (id) => {
    tipId = id + "_tip";
    let tip = document.getElementById(tipId);
    tip.style.display = "none";
};

const renderRoomList = () => {
    rooms_container.innerHTML = "";

    fetchUser(username).then(function (user) {
        console.log(user);
        joined_rooms = user.joined_rooms;
        room_titles = {};
        for (let i = 0; i < user.joined_rooms.length; i++) {
            let rm = user.joined_rooms[i];

            fetchRoomData(rm).then(function (room) {
                if (!room) return;
                room_titles[room.room_id] = room.room_title;

                let roomElm = document.createElement("span");
                roomElm.className = "room";
                roomElm.id = user.joined_rooms[i];
                roomElm.setAttribute("onclick", `renderRoomContent('${user.joined_rooms[i]}')`);
                roomElm.setAttribute("onmouseover", `showRoomTip('${user.joined_rooms[i]}')`);
                roomElm.setAttribute("onmouseout", `hideRoomTip('${user.joined_rooms[i]}')`);

                //WORKING HERE
                roomElm.addEventListener("contextmenu", function (e) {
                    menu.style.display = "block";
                    menu.style.top = e.y + "px";
                    menu.style.left = e.x + "px";
                    e.preventDefault();
                    currentContextRoomId = roomElm.id;
                });

                let img = document.createElement("img");
                img.onerror = loadDefaultRoom(this);
                img.src = "./images/room.png";
                img.style = "margin: 0 1px; width: 50px; height: 50px;";

                let tip = document.createElement("span");
                tip.id = user.joined_rooms[i] + "_tip";
                tip.className = "tooltiptext";
                tip.innerText = room.room_title;

                rooms_container.appendChild(roomElm);
                roomElm.appendChild(img);
                roomElm.appendChild(tip);

                // rooms_container.innerHTML +=
                //     `<span class='room' style='text-align:center' id='${user.joined_rooms[i]}' onclick='renderRoomContent("${user.joined_rooms[i]}");' onmouseover='showRoomTip("${user.joined_rooms[i]}");' onmouseout='hideRoomTip("${user.joined_rooms[i]}");'>` +
                //     `<img onerror="loadDefaultRoom(this)" src=./images/room.png style='margin:0 1px; width:50px; height:50px;'>` +
                //     `<span id='${user.joined_rooms[i]}_tip' class='tooltiptext'>${room.room_title}</span>` +
                //     `</span>`;
            });
        }
    });
};
const makeRoomClickable = (roomElementId) => {
    document
        .getElementById(roomElementId)
        .addEventListener("click", console.log(roomElementId));
};

const updateNickname = () => {
    //TODO need to make if insert "" sets back to default username (but need an endpoint to delete room nicks)
    //Or could just set nick to username
    let name = document.getElementById("change_nickname").value;
    if (name.length > 20) {
        //TODO Display Nickname too long
        console.log("Nickname too long!");
        return;
    }

    const data = {
        room_id: currentRoomId,
        username: username,
        nickname: name,
    };

    fetch(`/room/nick/${currentRoomId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    }).then((response) => {
        console.log(response.status);
        //TODO
        if (response.status === 201 || response.status === 200) {
            console.log("CHANGED NICKNAME SUCCESSFULLY!");
            renderRoomContent(currentRoomId, true);
            closeModals();
        }
    });
};

//Helper Functions
const getNickname = (username) => {
    //Checks if nickname array
    // Returns either nickname for user or just username if no nickname
    if (nicknames) {
        for (let i = 0; i < nicknames.length; i++) {
            if (username === nicknames[i].name) {
                return nicknames[i].nick;
            }
        }
    }
    return username;
};

const isFileImage = (content) => {
    let imageRegex = /.+\.(gif|jpg|jpeg|png)/i;
    return imageRegex.test(content);
};

const splitFileString = (content) => {
    return content.split("::");
};

//TODO Come back to make downloading files more fancy
const downloadFile = (file) => {
    var element = document.createElement("a");
};

// Change Avatar\
const myAvatars = () => {
    const avatarOption = document.getElementById("avatarSelection");
    const theAvatar = avatarOption.options[avatarOption.selectedIndex].value;
    return theAvatar;
};

const tryAvatarBtn = document.getElementById("tryAvatar");
tryAvatarBtn.addEventListener("click", function (evt) {
    evt.preventDefault();
    const avatar = document.getElementById("changeAvatar");
    const url = `./images/${myAvatars()}.jpg`;
    console.log("Avatar: " + url);
    avatar.src = url;

    let data = {
        avatar: url
    };
    console.log(data);
    fetch(`/user/${username}`, {
        method: "PATCH",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(response => {
        console.log(response);
        //TODO Tell the user it was a success
    });
});

const uploadAvatar = () => {
    let form = document.forms.namedItem("choose_avatar");
    let formData = new FormData(form);

    formData.append("sender", username);

    let request = new XMLHttpRequest();
    request.open('POST', "/media");
    request.onload = function () {
        console.log(request.status);
        if (request.status === 200) {
            console.log(request.response);

            let data = JSON.parse(request.response);
            let avatarDisplay = document.getElementById("avatarImg");
            let avatar = document.getElementById("changeAvatar");
            let url = data.path.split("::")[0];
            console.log("Avatar: " + url);
            avatar.src = url;
            avatarDisplay.src = url;

            fetch(`/user/${username}`, {
                method: "PATCH",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    avatar: url
                })
            }).then(response => {
                closeModals();
            })
        }
    }
    request.send(formData);
    return false;
};

const uploadRoomIcon = () => {
    //TODO Upload Room Icon

};

const changePassword = () => {
    let newPassword = document.getElementById("change_new_password").value;

    fetch(`/user/${username}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username
        })
    }).then(response => {
        closeModals();
    });
}

const validateFileSize = evt => {
    let elm = evt.target; //This should be the <input type="file"> element
    console.log(elm.files);
    let file = elm.files[0];
    if (file) {
        if (file.size >= 104857600) {
            elm.value = "";
            alert("That file is too large (>100MB)");
        }
    }
};

const sendToggle = (username, theme) => {
    fetch(`/settheme/${username}/${theme}`, {
        method: "POST"
    }).then();
}

document.getElementById("useAvatar").onclick = uploadAvatar;
document.getElementById("avatar_upload").onchange = validateFileSize;

document.getElementById("change_password_button").onclick = changePassword;

document.getElementById("avatarImg").onerror = loadDefault;
document.getElementById("changeAvatar").onerror = loadDefault;

//Assign Buttons Functions
document
    .getElementById("create_room_button")
    .addEventListener("click", createRoom);
document.getElementById("join_room_button").addEventListener("click", joinRoom);
document
    .getElementById("submit_file_button")
    .addEventListener("click",
        evt => document.getElementById("my_file").click()
    );
document
    .getElementById("change_nickname_button")
    .addEventListener("click", updateNickname);

document
    .getElementById("submit_room_icon_button")
    .addEventListener("click", uploadRoomIcon);

//Copy to clipboard roomid
document.getElementById("menu_copy").addEventListener("click", function () {
    const temp = document.createElement('textarea');
    temp.value = currentContextRoomId;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
    menu.style.display = "none";
});

document.getElementById("menu_leave").addEventListener("click", leaveRoom);