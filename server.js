            const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// ADMIN SETTINGS
// ===============================

const ADMIN_USERNAME = "Ax3chu";
const ADMIN_PASSWORD = "AchuthrajAx3chu@123";
const ADMIN_SECRET = "Ax3chu-panel-7x9k";

// ===============================
// MAIN WEBSITE
// ===============================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===============================
// ADMIN PAGE
// ===============================

app.get("/" + ADMIN_SECRET, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ===============================
// ADMIN LOGIN
// ===============================

app.post("/admin-login", (req, res) => {

    const { username, password } = req.body;

    if (
        username === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD
    ) {
        return res.json({
            success: true
        });
    }

    res.status(401).json({
        success: false,
        message: "Invalid username or password"
    });
});

// ===============================
// CHAT SYSTEM
// ===============================

let waitingUser = null;

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    socket.on("joinChat", () => {

        if (waitingUser && waitingUser !== socket.id) {

            const stranger = waitingUser;

            waitingUser = null;

            socket.partner = stranger;

            const strangerSocket =
                io.sockets.sockets.get(stranger);

            if (strangerSocket) {
                strangerSocket.partner = socket.id;
            }

            io.to(socket.id).emit("matched");
            io.to(stranger).emit("matched");

        } else {

            waitingUser = socket.id;

            socket.emit("waiting");
        }

        sendStats();
    });


    socket.on("message", (message) => {

        const partner = socket.partner;

        if (partner) {
            io.to(partner).emit("message", message);
        }
    });


    socket.on("next", () => {

        const partner = socket.partner;

        if (partner) {

            io.to(partner).emit("partnerLeft");

            const partnerSocket =
                io.sockets.sockets.get(partner);

            if (partnerSocket) {
                partnerSocket.partner = null;
            }
        }

        socket.partner = null;

        waitingUser = socket.id;

        socket.emit("waiting");

        sendStats();
    });


    socket.on("disconnect", () => {

        if (socket.partner) {

            io.to(socket.partner)
                .emit("partnerLeft");

            const partnerSocket =
                io.sockets.sockets.get(socket.partner);

            if (partnerSocket) {
                partnerSocket.partner = null;
            }
        }

        if (waitingUser === socket.id) {
            waitingUser = null;
        }

        console.log("User disconnected:", socket.id);

        sendStats();
    });

});

// ===============================
// ADMIN LIVE STATISTICS
// ===============================

function sendStats() {

    let onlineUsers =
        io.sockets.sockets.size;

    let waitingUsers =
        waitingUser ? 1 : 0;

    let activeChats = 0;

    io.sockets.sockets.forEach((socket) => {

        if (socket.partner) {
            activeChats++;
        }

    });

    // Each chat has two users
    activeChats = Math.floor(activeChats / 2);

    io.emit("adminStats", {
        onlineUsers,
        waitingUsers,
        activeChats
    });
}

// ===============================
// SERVER
// ===============================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log(
        "StrangerChat server running on port " + PORT
    );

});
