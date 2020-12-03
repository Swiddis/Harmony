const file_upload = document.getElementById("my_file");

document.onpaste = e => {
    if (e.clipboardData.items.length > 0) {
        let item = Array.from(e.clipboardData.items).find(x => /^image\//.test(x.type));
        if (item) {
            // let blob = item.getAsFile();
            file_upload.files = e.clipboardData.files;
            renderFile({target: file_upload});
        }
    }
};
document.getElementById("my_message").onpaste = evt => {
    if (evt.clipboardData.items.length > 0) {
        let item = Array.from(evt.clipboardData.items).find(x => /^image\//.test(x.type));
        if (item) {
            evt.preventDefault();
            return false;
        }
    }
    evt.preventDefault();
    document.execCommand('inserttext', false, evt.clipboardData.getData('text/plain'));
};

renderFile = evt => {
    console.log(evt.target.files[0]);
    if (evt.target.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            // get loaded data and render thumbnail.
            let prev = document.getElementById("img_preview");
            let img = new Image();
            prev.innerHTML = "";
            prev.append(img);
            if (/image\/.*/.test(evt.target.files[0].type))
                img.src = e.target.result;
            else {
                img.src = "/images/media.png";
                let title = document.createElement("div");
                title.classList = ["upload-name"];
                title.innerText = evt.target.files[0].name;
                prev.append(title);
            }

            let removeBtn = document.createElement("div");
            removeBtn.classList = "circle-button";
            removeBtn.innerText = "X";
            removeBtn.onclick = evt => {
                prev.innerHTML = "";
                file_upload.value = "";
            };
            prev.append(removeBtn);
        };

        // read the image file as a data URL.
        reader.readAsDataURL(evt.target.files[0]);
    } else {
        document.getElementById("img_preview").innerHTML = "";
    }
};

const dropHandler = evt => {
    // Prevent file from being opened
    evt.preventDefault();
    document.getElementById("drop_overlay").style.display = "none";

    let list = new DataTransfer();
    let blob;
    var imageUrl = evt.dataTransfer.getData('Text');
    if (!imageUrl) {
        if (evt.dataTransfer.items) {
            blob = evt.dataTransfer.items[0].getAsFile();
        } else {
            blob = evt.dataTransfer.files[0];
        }

        list.items.add(blob);
        file_upload.files = list.files;
        renderFile({target: file_upload});
    } else {
        document.getElementById("my_message").innerHTML += imageUrl;
    }
}

const dragEnter = evt => {
    evt.stopPropagation();
    evt.preventDefault();
    document.getElementById("drop_overlay").style.display = "flex";
    evt.dataTransfer.dropEffect = 'copy';
};

window.ondragover = dragEnter;
document.getElementById("drop_overlay").ondragleave = evt => {
    document.getElementById("drop_overlay").style.display = "none";
    evt.preventDefault();
}
window.ondrop = dropHandler;
file_upload.onchange = renderFile;