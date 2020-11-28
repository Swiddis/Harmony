/*
    FOR GENERIC JAVASCRIPT (NOT TO CONNECT TO BACKEND OR USE SOCKETS)
*/


//For Modal Displays (Popup Windows)
const displayNicknameModal = () => {
    closeModals();
    nickname_modal.style.display = "block";
};

const displayModal = () => {
    closeModals();
    modal.style.display = "block";
};
const displayCreateModal = () => {
    create_modal.style.display = "block";
};
const displayJoinModal = () => {
    join_modal.style.display = "block";
};
const closeModals = () => {
    modal.style.display = "none";
    create_modal.style.display = "none";
    join_modal.style.display = "none";
    nickname_modal.style.display = "none";

    //EMPTIES INPUT FIELDS (TODO REDUNDANT)
    let elements = create_modal.getElementsByTagName("input");
    for (let i = 0; i < elements.length; i++) {
        elements[i].value = "";
    }
    elements = join_modal.getElementsByTagName("input");
    for (let i = 0; i < elements.length; i++) {
        elements[i].value = "";
    }
};

//On Enter Submit Message
function submitOnEnter(evt) {
    if (evt.key === "Enter") {
        sendMessage();
        message_box.value = "";
        evt.preventDefault();
    }
}

document.getElementById("new_room").addEventListener("click", displayModal);
document.getElementById("create_room_option").addEventListener("click", displayCreateModal);
document.getElementById("join_room_option").addEventListener("click", displayJoinModal);
document.getElementById("nickname_button").addEventListener("click", displayNicknameModal);
var closeButtons = document.getElementsByClassName("close");
for (var i = 0; i < closeButtons.length; i++) {
    closeButtons[i].addEventListener("click", closeModals, false);
}