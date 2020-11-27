// Change avatar function
const myAvatars = () => {
    const avatarOption = document.getElementById("avatarSelection");
    const theAvatar = avatarOption.options[avatarOption.selectedIndex].value;
    return theAvatar;
}

const tryAvatarBtn = document.getElementById("tryAvatar");
tryAvatarBtn.addEventListener("click", function(evt) {
    evt.preventDefault();
    const avatar = document.getElementById("changeAvatar");
    const url = `./images/${myAvatars()}.jpg`;
    console.log("Avatar imagen" + url);
    avatar.src = url;
})