/*
    FOR GENERIC JAVASCRIPT (NOT TO CONNECT TO BACKEND OR USE SOCKETS)
*/
const modal_background = document.getElementById("modal_background");
const room_modal = document.getElementById("room_modal")
const create_modal = document.getElementById("create_room_modal");
const join_modal = document.getElementById("join_room_modal");
const nickname_modal = document.getElementById("nickname_modal");
const avatar_modal = document.getElementById("avatar_modal");
const file_modal = document.getElementById("file_modal");
const view_image_modal = document.getElementById("view_image_modal");
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
        modal_background.style.display = "block";
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

const displayFileModal = () => {
    if(!background_activated){
        modal_background.style.display = "block";
        background_activated = true;
    }

    file_modal.style.display = "block";
}

const displayAvatarModal = () => {
    if(!background_activated){
        modal_background.style.display = "block";
        background_activated = true;
    }

    avatar_modal.style.display = "block";
}

const displayNicknameModal = () => {
    if(!background_activated){
        modal_background.style.display = "block";
        background_activated = true;
    }

    nickname_modal.style.display = "block";
};

const displayModal = () => {
    if(!background_activated){
        modal_background.style.display = "block";
        background_activated = true;
    }
    room_modal.style.display = "block";
};
const displayCreateModal = () => {
    create_modal.style.display = "block";
};
const displayJoinModal = () => {
    join_modal.style.display = "block";
};
const closeModals = () => {
    background_activated = false;
    modal_background.style.display = "none";

    room_modal.style.display = "none";
    create_modal.style.display = "none";
    join_modal.style.display = "none";
    nickname_modal.style.display = "none";
    avatar_modal.style.display = "none";
    file_modal.style.display = "none";
    view_image_modal.style.display = "none";

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
        message_box.value = "";
        evt.preventDefault();
    }
}

document.getElementById("new_room").addEventListener("click", displayModal);
document.getElementById("create_room_option").addEventListener("click", displayCreateModal);
document.getElementById("join_room_option").addEventListener("click", displayJoinModal);
document.getElementById("username_label").addEventListener("click", displayNicknameModal);
document.getElementById("avatarImg").addEventListener("click", displayAvatarModal);

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
