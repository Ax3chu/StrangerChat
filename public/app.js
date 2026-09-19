// StrangerChat client
// Real-time connection will be connected to the online server later.

let nickname = "";

function startChat() {
    nickname = document.getElementById("nickname").value.trim();

    if (!nickname) {
        alert("Please enter a nickname");
        return;
    }

    document.getElementById("homeScreen").style.display = "none";
    document.getElementById("chatScreen").style.display = "flex";

    document.getElementById("status").textContent =
        "Waiting for a stranger...";

    document.getElementById("messages").innerHTML =
        '<div class="systemMessage">Waiting for a stranger...</div>';
}

function sendMessage() {
    const input = document.getElementById("messageInput");
    const text = input.value.trim();

    if (!text) return;

    addMessage(text, true);
    input.value = "";
}

function addMessage(text, mine) {
    const messages = document.getElementById("messages");

    const message = document.createElement("div");

    message.className = mine
        ? "myMessage"
        : "theirMessage";

    message.textContent = text;

    messages.appendChild(message);

    messages.scrollTop = messages.scrollHeight;
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
}