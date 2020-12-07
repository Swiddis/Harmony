/*
    FOR GENERIC JAVASCRIPT (NOT TO CONNECT TO BACKEND OR USE SOCKETS)
*/
const modal_background = document.getElementById("modal_background");
const room_modal = document.getElementById("room_modal")
const create_modal = document.getElementById("create_room_modal");
const join_modal = document.getElementById("join_room_modal");
const nickname_modal = document.getElementById("nickname_modal");
const password_modal = document.getElementById("password_modal");
const avatar_modal = document.getElementById("avatar_modal");
const file_modal = document.getElementById("file_modal");
const view_image_modal = document.getElementById("view_image_modal");
const room_icon_modal = document.getElementById("room_icon_modal");
const room_leave_modal = document.getElementById("leave_room_modal");
var background_activated = false;

const toggleDarkMode = () => {
    let theme = document.body.getAttribute("data-theme");
    if (theme == "dark") {
        //Set the theme to light
        document.body.setAttribute("data-theme", "light");
        sendToggle(username, "light");
    } else {
        //Set the theme to dark
        document.body.setAttribute("data-theme", "dark");
        sendToggle(username, "dark");
    }
};
document.getElementById("dark_toggle").onclick = toggleDarkMode;

//For Modal Displays (Popup Windows)
const displayViewImageModal = (imgUrl, imgName) => {
    closeModals();
    activateBackground();

    view_image_modal.innerHTML = "";
    let img = document.createElement('img');
    img.src = imgUrl;
    img.setAttribute("class", "view_image");
    view_image_modal.appendChild(img);
    let download = document.createElement('a');
    //<a href='${fileStr[0]}' download='${fileStr[1]}'>
    download.setAttribute("class", "image_link");
    download.setAttribute("href", imgUrl);
    download.setAttribute("download", imgName);
    download.innerText = "Download";
    view_image_modal.appendChild(download);
    view_image_modal.style.display = "block";
}

const activateBackground = () => {
    if (!background_activated) {
        modal_background.style.display = "flex";
        background_activated = true;
    }
}

const displayFileModal = () => {
    closeModals();
    activateBackground();
    file_modal.style.display = "block";
}

const displayAvatarModal = () => {
    closeModals();
    activateBackground();
    avatar_modal.style.display = "block";
}

const displayRoomIconModal = () => {
    closeModals();
    activateBackground();
    room_icon_modal.style.display = "block";
    menu.style.display = "none";
}

const displayLeaveRoomModal = () => {
    closeModals();
    activateBackground();
    room_leave_modal.style.display = "block";
    //Just id for now
    document.getElementById("leave_header").innerText = `Leave '${currentContextRoomId}'`;
    menu.style.display = "none";
};

const displayNicknameModal = () => {
    closeModals();
    activateBackground();
    nickname_modal.style.display = "block";
};

const displayPasswordModal = () => {
    closeModals();
    activateBackground();
    password_modal.style.display = "block";
}

const logOut = () => {
    document.location.href = "/logout"
}

const displayModal = () => {
    closeModals();
    activateBackground();
    room_modal.style.display = "block";
};
const displayCreateModal = () => {
    closeModals();
    activateBackground();
    create_modal.style.display = "block";
};
const displayJoinModal = () => {
    closeModals();
    activateBackground();
    join_modal.style.display = "block";
};
const closeModals = () => {
    let modals = document.getElementsByClassName("modal");
    for (let modal of modals) {
        modal.style.display = "none";
    }
    background_activated = false;
    modal_background.style.display = "none";

    //EMPTIES INPUT FIELDS (TODO REDUNDANT)
    let elements = create_modal.getElementsByTagName("input");
    for (let i = 0; i < elements.length; i++) {
        elements[i].value = "";
    }
    elements = join_modal.getElementsByTagName("input");
    for (let i = 0; i < elements.length; i++) {
        elements[i].value = "";
    }
    elements = nickname_modal.getElementsByTagName("input");
    for (let i = 0; i < elements.length; i++) {
        elements[i].value = "";
    }

    document.getElementById("my_file").value = "";
    document.getElementById("room_icon_upload").value = "";
};

const goBackModal = () => {
    closeModals();
    activateBackground();
    room_modal.style.display = "flex";
}
//When user clicks out of modal close it
window.onclick = function (event) {
    if (event.target == modal_background) {
        closeModals();
    }
}

const mobileCheck = () => {
    let check = false;
    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

//On Enter Submit Message
function submitOnEnter(evt) {
    if (evt.key === "Enter" && (mobileCheck() || evt.shiftKey === false)) {
        sendMessage();
        message_box.innerText = "";
        evt.preventDefault();
    }
}

document.getElementById("new_room").addEventListener("click", displayModal);
document.getElementById("create_room_option").addEventListener("click", displayCreateModal);
document.getElementById("join_room_option").addEventListener("click", displayJoinModal);
document.getElementById("username_label").addEventListener("click", displayNicknameModal);
document.getElementById("changepass").addEventListener("click", displayPasswordModal);
document.getElementById("avatarImg").addEventListener("click", displayAvatarModal);
document.getElementById("menu_icon").addEventListener("click", displayRoomIconModal);
document.getElementById("menu_leave").addEventListener("click", displayLeaveRoomModal);
document.getElementById("cancel_leave").addEventListener("click", closeModals);
document.getElementById("logout").addEventListener("click", logOut);

document.getElementById("my_file").onchange = evt => {
    validateFileSize(evt);
    let file = this.files[0];
    if (file) {
        displayFileModal();
        document.getElementById("upload_name").innerHTML = file.name;
    }
};

var closeButtons = document.getElementsByClassName("close");
for (var i = 0; i < closeButtons.length; i++) {
    closeButtons[i].addEventListener("click", closeModals, false);
}
var backButtons = document.getElementsByClassName("back_modal");
for (var i = 0; i < backButtons.length; i++) {
    backButtons[i].addEventListener("click", goBackModal, false);
}

//If you click out of modal(when popped up) make it gone
modal_background.onclick = evt => {
    if (evt.target == modal_background) {
        closeModals();
    }
}

//If you click out of context-menu make it gone
document.onclick = evt => {
    if (evt.target != menu) {
        menu.style.display = "none";
    }
}