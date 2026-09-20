const socket = io();

let nickname = "";

function startChat() {

    nickname =
        document.getElementById("nickname").value.trim();

    if (!nickname) {
        alert("Please enter a nickname");
        return;
    }

    document.getElementById("homeScreen").style.display = "none";

    document.getElementById("chatScreen").style.display = "flex";

    document.getElementById("messages").innerHTML =
        '<div class="systemMessage">Finding a stranger...</div>';

    document.getElementById("status").textContent =
        "Finding stranger...";

    // Send nickname to server
    socket.emit("joinChat", nickname);
}


socket.on("waiting", () => {

    document.getElementById("status").textContent =
        "Waiting for a stranger...";

    document.getElementById("messages").innerHTML =
        '<div class="systemMessage">Waiting for a stranger...</div>';

});


socket.on("matched", () => {

    document.getElementById("status").textContent =
        "Connected to a stranger";

    document.getElementById("messages").innerHTML =
        '<div class="systemMessage">You are now connected! 👋</div>';

});


function sendMessage() {

    const input =
        document.getElementById("messageInput");

    const text =
        input.value.trim();

    if (!text) return;

    socket.emit("message", text);

    addMessage(text, true);

    input.value = "";

    // Keep keyboard open
    input.focus();

}


socket.on("message", (message) => {

    addMessage(message, false);

});


function addMessage(text, mine) {

    const messages =
        document.getElementById("messages");

    const message =
        document.createElement("div");

    message.className =
        mine
            ? "myMessage"
            : "theirMessage";

    message.textContent = text;

    messages.appendChild(message);

    messages.scrollTop =
        messages.scrollHeight;

}


function handleEnter(event) {

    if (event.key === "Enter") {

        sendMessage();

    }

}


function nextStranger() {

    document.getElementById("messages").innerHTML =
        '<div class="systemMessage">Finding a new stranger...</div>';

    document.getElementById("status").textContent =
        "Finding stranger...";

    socket.emit("next", nickname);

}


socket.on("partnerLeft", () => {

    document.getElementById("status").textContent =
        "Stranger disconnected";

    document.getElementById("messages").innerHTML =
        '<div class="systemMessage">The stranger left.</div>';

});
