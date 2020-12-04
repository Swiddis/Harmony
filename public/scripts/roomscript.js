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
    console.log(theme);
    if (theme == "dark") {
        //Set the theme to light
        document.body.setAttribute("data-theme", "light");
    } else {
        //Set the theme to dark
        document.body.setAttribute("data-theme", "dark");
    }
};
document.getElementById("dark_toggle").onclick = toggleDarkMode;

//For Modal Displays (Popup Windows)
const displayViewImageModal = (imgUrl, imgName) => {
    if(!background_activated){
        modal_background.style.display = "flex";
        background_activated = true;
    }
    
    view_image_modal.innerHTML = "";
    let img = document.createElement('img'); 
    img.src =  imgUrl; 
    img.setAttribute("class", "view_image");
    view_image_modal.appendChild(img); 
    let download = document.createElement('a');
    //<a href='${fileStr[0]}' download='${fileStr[1]}'>
    download.setAttribute("class", "image_link");
    download.setAttribute("href", imgUrl);
    download.setAttribute("download", imgName);
    download.innerText="Download";
    view_image_modal.appendChild(download);
    view_image_modal.style.display = "block";
}

const activateBackground = () => {
    if(!background_activated){
        modal_background.style.display = "flex";
        background_activated = true;
    }
}

const displayFileModal = () => {
    activateBackground()
    file_modal.style.display = "block";
}

const displayAvatarModal = () => {
    activateBackground()
    avatar_modal.style.display = "block";
}

const displayRoomIconModal = () => {
    activateBackground();
    room_icon_modal.style.display = "block";
    menu.style.display = "none";
}

const displayLeaveRoomModal = () => {
    activateBackground();
    room_leave_modal.style.display = "block";
    menu.style.display = "none";
};

const displayNicknameModal = () => {
    activateBackground()
    nickname_modal.style.display = "block";
};

const displayPasswordModal = () => {
    activateBackground();
    password_modal.style.display = "block";
}

const logOut = () => {
    document.location.href = "/logout"
}

const displayModal = () => {
    activateBackground()
    room_modal.style.display = "block";
};
const displayCreateModal = () => {
    create_modal.style.display = "block";
};
const displayJoinModal = () => {
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
    for(let i = 0; i < elements.length; i++){
        elements[i].value = "";
    }

    document.getElementById("my_file").value = "";
    document.getElementById("room_icon_upload").value = "";
};

const goBackModal = () => {
    create_modal.style.display = "none";
    join_modal.style.display="none";
}
//When user clicks out of modal close it
window.onclick = function(event) {
    if (event.target == modal_background) {
      closeModals();
    }
  }

//On Enter Submit Message
function submitOnEnter(evt) {
    if (evt.key === "Enter" && evt.shiftKey === false) {
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
document.getElementById("logout").addEventListener("click", logOut);

document.getElementById("my_file").onchange = function() {
    let file = this.files[0];
    if(file){
        displayFileModal();
        document.getElementById("upload_name").innerHTML = file.name;
    }
};

var closeButtons = document.getElementsByClassName("close");
for (var i = 0; i < closeButtons.length; i++) {
    closeButtons[i].addEventListener("click", closeModals, false);
}
var backButtons = document.getElementsByClassName("back_modal");
for(var i = 0; i < backButtons.length; i++){
    backButtons[i].addEventListener("click", goBackModal, false);
}

//If you click out of modal(when popped up) make it gone
modal_background.onclick = evt => {
    if(evt.target == modal_background) {
        closeModals();
    }
}

//If you click out of context-menu make it gone
document.onclick = evt => {
    if(evt.target != menu){
        menu.style.display = "none";
    }
}
