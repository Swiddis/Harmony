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

let USER;

const PLACEHOLDER = document.createElement("div");
PLACEHOLDER.innerHTML = "<span class='message_box'><span class='message'>No messages yet...</span></span>";

const load = document.getElementById("load-container");
const displayLoad = () => {
    load.style.display = "flex";
}
const hideLoad = () => {
    load.style.display = "none";
}

async function fetchUser(username) {
    let response = await fetch(`/user/${username}`);
    let data = await response.text();
    return JSON.parse(data).data;
}

//Does not include messages
async function fetchRoomData(roomid) {
    for (let room of USER.rooms) {
        if (room.room_id == roomid)
            return room;
    }

    let response = await fetch(`/room/${roomid}`);
    let data = await response.text();
    return JSON.parse(data).data;
}

async function fetchRoomMessages(roomid) {
    let response = await fetch(`/messages/${roomid}`);
    let data = await response.text();
    return JSON.parse(data).data;
}

let activeNotif;
const sendNotification = (data) => {
    let notify = () => {

        if (data.room_id != currentRoomId || !document.hasFocus()) { //Only send notification if in different room.

            let notification = new Notification(data.title, {
                icon: data.icon,
                body: data.body,
                silent: true
            });
            activeNotif = notification;

            notification.onclick = () => {
                window.focus();
                renderRoomContent(data.room_id);
            };

            setTimeout(notification.close.bind(notification), 6000);

        }

    };

    if (!("Notification" in window)) { //Browser supports notifications
    } else {
        if (Notification.permission === "granted") { //Notifications allowed
            //Build notification
            notify();
        } else if (Notification.permission !== "denied") { //Not denied, but not granted yet.
            Notification.requestPermission().then(result => {
                notify();
            });
        }
    }

    //Regardless, we'll play sound here.
    let audio = document.getElementById("notif");
    audio.volume = 0.5;
    audio.play();
};
document.onvisibilitychange = evt => {
    if (activeNotif)
        activeNotif.close();
};

window.onload = async function () {
    fetchUser(username).then(function (user) {
        USER = user;
        if (user.joined_rooms.length > 0) {
            renderRoomList(user.rooms);
            const params = new URLSearchParams(window.location.search);
            const loadRoom = params.get('room');
            //If room is specified in query parameters, load that one.
            if (loadRoom && user.joined_rooms.includes(loadRoom)) {
                renderRoomContent(loadRoom);
            } else {
                // just load the first room in the list
                renderRoomContent(user.joined_rooms[0]);
            }
        }
    });
};

const loadImages = () => {
    let elms = document.querySelectorAll("img[lazysrc]");
    if (elms) {
        elms.forEach(elm => {
            elm.src = elm.getAttribute("lazysrc");
            elm.removeAttribute("lazysrc");
        });
    }
};

const socket = io.connect(document.location.host, {
    secure: true,
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
    let form = document.forms.namedItem("send_media");
    let formData = new FormData(form);

    formData.append("sender", username);
    formData.append("room_id", currentRoomId);

    displayLoad();
    let request = new XMLHttpRequest();
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
            hideLoad();
            if (callback)
                callback();
        }
    };
    request.send(formData);
};

const openUserInfo = user => {
    closeModals();
    console.log("Opening user info for " + user);

    displayLoad();
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
                    displayLoad();
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
                            hideLoad();
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
            modal.style.display = "flex";
            document.getElementById("modal_background").append(modal);
            hideLoad();
        });
};

socket.on("message", (msg) => {
    //for now if msg recieved is from currentroomid display
    if (msg.nickname) {
        let set = false;
        if (!nicknames)
            nicknames = [];
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

    if (msg.room_id && joined_rooms.includes(msg.room_id)) {
        if (msg.room_id === currentRoomId) {
            // messages_container.innerHTML += formatRoomMessage(
            //     msg.avatar,
            //     msg.username,
            //     msg.message,
            //     msg.is_file,
            //     msg.timestamp
            // );
            renderGroupedMessages(msg);
            loadImages();
            let child = messages_container.lastChild;
            let bounds = messages_container.scrollHeight - child.scrollHeight - messages_container.getBoundingClientRect().height - 150;
            if (msg.username == username || messages_container.scrollTop > bounds)
                child.scrollIntoView({behavior: "smooth", block: "start"});
        } else {
            if (document.getElementById(msg.room_id))
                document.getElementById(msg.room_id).getElementsByClassName("badge")[0]
                    .style.display = "block";
        }

        if (msg.username != username) {
            sendNotification({
                title: msg.username + " - " + room_titles[msg.room_id],
                icon: msg.avatar,
                body: msg.message,
                room_id: msg.room_id
            });
        }
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

    if (room_id.length > 40 || room_title.length > 40) {
        alert("Title or ID too long! (>40 characters)");
        return;
    }

    const room = {
        room_id: room_id,
        room_title: room_title,
        owner: username,
        password: password,
        roomAvatar: "./images/room.png",
    };

    displayLoad();
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
            document.getElementById("join_id").value = room_id;
            document.getElementById("join_password").value = password;
            joinRoom();
            closeModals();
        }
        hideLoad();
    });
};

const joinRoom = () => {
    const room_id = document.getElementById("join_id").value;
    const password = document.getElementById("join_password").value;

    displayLoad();
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
        hideLoad();
    });
};

const leaveRoom = () => {
    let body = {
        user: {
            username: username
        },
        room: {
            room_id: currentContextRoomId
        }
    };

    displayLoad();
    fetch(`/leaveroom/${currentContextRoomId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    }).then((response) => {
        if (response.status === 200) {
            closeModals();
            renderRoomList();
            if (currentRoomId == currentContextRoomId) {
                renderRoomContent(joined_rooms[0]);
            }
        }
        hideLoad();
    });
};

const loadDefault = img => {
    if (img.target)
        img = img.target;
    img.src = "/images/user_icon_blue.png";
};
const loadDefaultRoom = img => {
    if (img.target)
        img = img.target;
    img.src = "/images/user_icon_green.png";
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
        ret += `<img lazysrc='${fileStr[0]}' alt='${fileStr[1]}' title='${fileStr[1]}' class='message_image' onclick="displayViewImageModal('${fileStr[0]}', '${fileStr[1]}')"/>`;
    } else {
        ret += `<img lazysrc='/images/media.png' alt='${fileStr[1]}' title='${fileStr[1]}' class='message_image'/><div>${fileStr[1]}</div>`;
    }
    if (!isImage) {
        ret += `</a>`;
    }
    return ret;
};

const escapeRegex = str => {
    return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
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
            `<div class='message_body'><span onclick='openUserInfo("${username}")' class='name'>` +
            name +
            "</span>" +
            "<span class='message'>";

        formattedMessage += formatImage(message);

        formattedMessage += "<div class='timestamp'>" +
            (now.toLocaleDateString() != date.toLocaleDateString() ? date.toLocaleDateString() + "<br>" : "") +
            date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) +
            "</div>" +
            "</span></div></span>";
    } else {
        //CURRENTLY WORKING HERE
        if (hasUrl(message)) {
            base_urls = getAllUrls(message);
            let urls = [];
            //Remove duplicate urls (cause will change all instances for each url)
            base_urls.forEach((url) => {
                if (!urls.includes(url)) {
                    urls.push(url);
                }
            });

            if (urls != null) {
                let newVideos = "";
                urls.forEach(url => {
                    let newMsg = `<a href='${url}' target="_blank">${url}</a>`;
                    //Need to change all rather than first instance
                    if (isYoutubeVideo(url)) {
                        let videoId = getYoutubeVideoId(url);
                        newVideos += `<br><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                    }
                    let regex = new RegExp(escapeRegex(url), "g");
                    message = message.replace(regex, newMsg);
                });
                message += newVideos;
            }
        }

        formattedMessage =
            "<span class='message_box'>" +
            `<div onclick='openUserInfo("${username}")' class='msgAvatar'><span class='avatar'><img onerror="loadDefault(this)" src="${avatar}" alt="${username}_avatar"/></span></div>` +
            `<div class='message_body'><span onclick='openUserInfo("${username}")' class='name'>` +
            name +
            "</span>" +
            "<span class='message'>" +
            message +
            "<div class='timestamp'>" +
            (now.toLocaleDateString() != date.toLocaleDateString() ? date.toLocaleDateString() + "<br>" : "") +
            date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) +
            "</div>" +
            "</span>" +
            "</span></div>";
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
        if (hasUrl(message)) {
            base_urls = getAllUrls(message);
            let urls = [];
            //Remove duplicate urls (cause will change all instances for each url)
            base_urls.forEach((url) => {
                if (!urls.includes(url)) {
                    urls.push(url);
                }
            });

            if (urls != null) {
                let newVideos = "";
                urls.forEach(url => {
                    console.log(url);
                    let newMsg = `<a href='${url}' target="_blank">${url}</a>`;
                    //Need to change all rather than first instance
                    if (isYoutubeVideo(url)) {
                        let videoId = getYoutubeVideoId(url);
                        newVideos += `<br><iframe width="560" height="315" style="margin-top:0.8em" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                    }
                    let regex = new RegExp(escapeRegex(url), "g");
                    message = message.replace(regex, newMsg);
                });
                message += newVideos;
            }
        }

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
    if (messages_container.innerHTML == PLACEHOLDER.innerHTML)
        messages_container.innerHTML = "";

    if (!msg.sender && msg.username)
        msg.sender = msg.username;
    if (!messages_container.lastChild || msg.sender != prev_sender || Math.abs(new Date(msg.timestamp) - prev_timestamp) > FIVE_MINS) {
        prev_sender = msg.sender;

        let formatted = formatRoomMessage(
            msg.avatar,
            msg.sender,
            msg.content ? msg.content : msg.message,
            msg.is_file,
            msg.timestamp
        );
        let elm = document.createElement("div");
        elm.innerHTML = formatted;
        messages_container.append(elm.firstChild);
    } else {
        //Let's double up messages a bit so it's not as spread out.
        // Just with an extra line break between.
        let prev_message = messages_container.lastChild.lastChild;
        prev_message.innerHTML += formatRoomMessagePartial(
            msg.content ? msg.content : msg.message,
            msg.is_file,
            msg.timestamp
        );
    }
    prev_timestamp = new Date(msg.timestamp);
};

const renderRoomContent = async (roomid, forceRender = false) => {
    //So the room doesn't rerender the same room if clicked again
    if (currentRoomId === roomid && !forceRender) {
        return;
    }

    displayLoad();
    messages_container.innerHTML = "";

    fetchRoomData(roomid).then(function (room) {
        if (!room) return;
        nicknames = room.nicknames;
        //RoomName Label (Right bar)
        document.title = "Harmony \u2022 " + room.room_title;
        document.getElementById("header-title").innerText = room.room_title;
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
            if (!messages || messages.length == 0) {
                //Placeholder.
                messages_container.innerHTML = PLACEHOLDER.innerHTML;
            }
            for (let i = messages.length - 1; i >= 0; i--) {
                let msg = messages[i];
                renderGroupedMessages(msg);
            }

            //Attempts to wait until all imgs either rendered or errored out before scrolling.
            let imgs = messages_container.querySelectorAll(".message img");

            let incr = () => {
                messages_container.lastChild.scrollIntoView({behavior: "smooth", block: "start"});
            }

            let counted = [];
            for (let img of imgs) {
                if (img.complete) {
                    incr();
                }
                img.onload = () => {
                    incr();
                };
                img.addEventListener("error", () => {
                    if (!img.onerror) {
                        if (!counted.includes(img)) {
                            counted.push(img);
                            incr();
                        }
                    }
                });
            }

            if (document.getElementById(roomid))
                document.getElementById(roomid).getElementsByClassName("badge")[0]
                    .style.display = "";
            messages_container.lastChild.scrollIntoView({block: "start"});
            if (history.pushState) {
                let history = window.location.origin + window.location.pathname + `?room=${currentRoomId}`;
                window.history.replaceState({path: history}, document.title, history);
            }
            loadImages();
            hideLoad();
        });
    });
};

const showRoomTip = (parent, id) => {
    tipId = id + "_tip";
    let tip = document.getElementById(tipId);
    tip.style.display = "block";
    let tipRect = tip.getBoundingClientRect();
    let rect = parent.getBoundingClientRect();
    tip.style.top = (rect.y + (rect.height / 2) - (tipRect.height / 2)) + "px";
    tip.style.left = rect.left + rect.width + 10 + "px";
    tip.style.pointerEvents = "none";
};
const hideRoomTip = (id) => {
    tipId = id + "_tip";
    let tip = document.getElementById(tipId);
    tip.style.display = "none";
};

const renderRoomList = async (roomList) => {

    let user = USER;
    let elements = [];
    let iterated = 0;

    const buildMenu = elements => {
        elements.sort((a, b) => {
            let one = room_titles[a.id];
            let two = room_titles[b.id];
            if (one < two) return -1;
            else if (two < one) return 1;
            else return 0;
        });
        rooms_container.innerHTML = "";
        elements.forEach(roomElm => rooms_container.appendChild(roomElm));
    };

    const buildRoomMenuItem = room => {
        iterated++;
        if (!room) return;

        room_titles[room.room_id] = room.room_title;

        let touchTimeout;
        let startTouch = (evt) => {
            touchTimeout = window.setTimeout(function () {
                hideRoomTip(user.joined_rooms[i]);
                menu.style.display = "block";
                menu.style.top = evt.touches[0].screenY + "px";
                menu.style.left = evt.touches[0].screenX + "px";
                evt.preventDefault();
                currentContextRoomId = roomElm.id;
            }.bind(this), 500);
        };

        let cancelTouch = () => {
            hideRoomTip(room.room_id);
            if (touchTimeout)
                window.clearTimeout(touchTimeout);
        }

        let roomElm = document.createElement("span");
        roomElm.className = "room";
        roomElm.id = room.room_id;
        roomElm.addEventListener("click",
            evt => {
                renderRoomContent(room.room_id);
                hideRoomTip(room.room_id);
            });
        roomElm.addEventListener("mouseover", evt => {
            if (!mobileCheck()) //Don't show the tooltip on hover on mobile.
                showRoomTip(roomElm, room.room_id);
        });
        roomElm.addEventListener("mouseout",
            evt => hideRoomTip(room.room_id));

        roomElm.ontouchstart = //Use touch events on mobile!
            evt => {
                startTouch(evt);
                showRoomTip(roomElm, room.room_id);
            };
        roomElm.addEventListener("touchend", cancelTouch);
        roomElm.addEventListener("touchcancel", cancelTouch);

        roomElm.addEventListener("contextmenu", function (e) {
            menu.style.display = "block";
            menu.style.top = e.y + "px";
            menu.style.left = e.x + "px";
            e.preventDefault();
            currentContextRoomId = roomElm.id;
        });

        let badge = document.createElement("span");
        badge.classList = ["badge"];
        roomElm.append(badge);


        let url;
        if (room.roomAvatar) {
            url = room.roomAvatar;
        } else {
            url = "./images/room.png";
        }
        roomElm.style.backgroundImage = `url('${url}')`;
        const checkImage = async add => {
            await fetch(add)
                .then(response => {
                    if (response.status == 404) {
                        roomElm.style.backgroundImage = "url('/images/user_icon_green.png')";
                    }
                });
        };
        checkImage(url).then();


        let tip = document.createElement("span");
        tip.id = room.room_id + "_tip";
        tip.className = "tooltiptext";
        tip.innerText = room.room_title;

        document.getElementById("tooltips").appendChild(tip);
        elements.push(roomElm);
        if (iterated == joined_rooms.length) {
            buildMenu(elements);
        }
    };

    if (roomList) {
        joined_rooms = roomList.map(room => room.room_id);
        roomList.forEach(room => buildRoomMenuItem(room));
    } else {
        fetchUser(username).then(function (us) {
            console.log(us);
            USER = us;
            user = us;
            joined_rooms = us.joined_rooms;
            room_titles = {};

            for (let i = 0; i < joined_rooms.length; i++) {
                let rm = joined_rooms[i];

                fetchRoomData(rm).then(function (room) {
                    buildRoomMenuItem(room);
                });
            }
        });
    }
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
        alert("Nickname too long!");
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

const hasUrl = (message) => {
    let urlRegex = /https?:\/\/.{2,}/;
    return urlRegex.test(message);
};

const getAllUrls = (message) => {
    let allUrls = [];
    let urlRegex = /(https?:\/\/\S*)/ig;
    allUrls = message.match(urlRegex);
    return allUrls;
};

const isYoutubeVideo = (url) => {
    //need either form at:
    //youtube.com/watch?v=Us6VsyGsC4o
    //youtu.be/Us6VsyGsC4o
    let youtubeRegex = /(youtube\.com\/watch\?v=.{11})|(youtu\.be\/.{11})/;
    return youtubeRegex.test(url);
};

const getYoutubeVideoId = (url) => {
    //id is always 11 characters long
    let youtubeRegex = /(youtube\.com\/watch\?v=.{11})|(youtu\.be\/.{11})/;
    let match = url.match(youtubeRegex);
    return match[0].substring(match[0].length - 11);
};

//TODO Come back to make downloading files more fancy
const downloadFile = (file) => {
    let element = document.createElement("a");
};

// Change Avatar\
const myAvatars = () => {
    const avatarOption = document.getElementById("avatarSelection");
    const theAvatar = avatarOption.options[avatarOption.selectedIndex].value;
    return theAvatar;
};

document.getElementById("avatarSelection").onchange = evt => {
    let upload = document.getElementById("avatar_upload");
    upload.value = "";
    previewAvatar();
}

const previewAvatar = evt => {
    let preview = document.getElementById("changeAvatar");
    let sel = myAvatars();
    if (sel != "0") {
        preview.src = "/images/" + myAvatars() + ".jpg";
    } else {
        let upload = document.getElementById("avatar_upload");
        let reader = new FileReader();
        reader.onload = e => preview.src = e.target.result;
        // read the image file as a data URL.
        reader.readAsDataURL(upload.files[0]);
    }

};

const useStaticAvatar = (evt) => {
    evt.preventDefault();
    const avatar = document.getElementById("changeAvatar");
    let av = myAvatars();
    if (av == 0) return;
    const url = `./images/${av}.jpg`;
    avatar.src = url;

    let data = {
        avatar: url
    };
    fetch(`/user/${username}`, {
        method: "PATCH",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(response => {
        console.log(response);
        document.getElementById("avatarSelection").selectedIndex = 0;
        document.getElementById("avatarImg").src = `./images/${av}.jpg`
        closeModals();
        //TODO Tell the user it was a success
    });
};

// const tryAvatarBtn = document.getElementById("tryAvatar");
// tryAvatarBtn.addEventListener("click", useStaticAvatar);

const uploadAvatar = () => {
    let form = document.forms.namedItem("choose_avatar");
    let formData = new FormData(form);

    formData.append("sender", username);

    displayLoad();
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
                document.getElementById("avatar_upload").value = "";
                closeModals();
                hideLoad();
            })
        }
    }
    request.send(formData);
    return false;
};

const uploadRoomIcon = () => {
    // let form = document.forms.namedItem("choose_room_icon");
    // let formData = new FormData(form);

    // formData.append("user", username);
    let icon = (document.getElementById("room_icon_upload")).files[0];

    // let body = {
    //     user: {
    //         username: username
    //     },
    //     room: {
    //         room_id: currentContextRoomId,
    //         roomAvatar: icon
    //     }
    // };

    //I need to send media -> save it then use thing to set room

    let form = document.forms.namedItem("choose_room_icon");
    let formData = new FormData(form);
    formData.append("sender", username);

    displayLoad();
    let request = new XMLHttpRequest();
    request.open('POST', "/media");
    request.onload = function () {
        console.log(request.status);
        if (request.status === 200) {
            console.log(request.response);
            let data = JSON.parse(request.response);
            let url = data.path.split("::")[0];

            fetch(`/room`, {
                method: "PATCH",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user: {
                        username: username
                    },
                    room: {
                        room_id: currentContextRoomId,
                        roomAvatar: url
                    }
                })
            }).then(response => {
                closeModals();
                renderRoomList();
                hideLoad();
            })
        }
        ;
    };
    request.send(formData);
    return false;

};

const changePassword = () => {
    let newPassword = document.getElementById("change_new_password").value;

    displayLoad();
    fetch(`/user/${username}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: newPassword
        })
    }).then(response => {
        closeModals();
        hideLoad();
    });
}

const validateFileSize = evt => {
    let elm = evt.target; //This should be the <input type="file"> element
    let file = elm.files[0];
    if (file) {
        if (file.size >= 104857600) {
            elm.value = "";
            alert("That file is too large (>100MB)");
            return false;
        }
    }
    return true;
};

const sendToggle = (username, theme) => {
    fetch(`/settheme/${username}/${theme}`, {
        method: "POST"
    }).then();
}

document.getElementById("useAvatar").onclick = evt => {
    let upload = document.getElementById("avatar_upload");
    let sel = myAvatars();
    if (upload.files.length > 0) {
        console.log("Uploading file");
        uploadAvatar(evt);
    } else if (sel != 0) {
        console.log("Using static");
        useStaticAvatar(evt);
    }
}
document.getElementById("avatar_upload").onchange = evt => {
    if (validateFileSize(evt)) {
        document.getElementById("avatarSelection").selectedIndex = 0;
        previewAvatar();
    }
}
document.getElementById("room_icon_upload").onchange = evt => {
    if (validateFileSize(evt)) {
        let upload = evt.target;
        let preview = document.getElementById("room_icon_preview");
        let reader = new FileReader();
        reader.onload = e => preview.src = e.target.result;
        // read the image file as a data URL.
        reader.readAsDataURL(upload.files[0]);
    }
}

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

document.getElementById("leave_room_button").addEventListener("click", leaveRoom);

document.getElementById("delete").onclick = evt => {
    console.log(`/delete/${username}`);
    fetch(`/delete/${username}`, {
        method: "DELETE"
    }).then(res => {
        if (res.status == 200) {
            console.log("Deleted.");
            console.log(document.location);
            // location.href = document.location.originalUrl;
        }
    });
};