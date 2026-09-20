
        const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const ADMIN_USERNAME = "Ax3chu";
const ADMIN_PASSWORD = "AchuthrajAx3chu@123";

const ADMIN_SECRET = "Ax3chu-panel-7x9k";

const sessions = new Map();

app.use(express.json());


// ===============================
// BLOCK DIRECT ADMIN PAGE ACCESS
// ===============================

app.use((req, res, next) => {

    if (req.path === "/admin.html") {
        return res.status(404).send("Not found");
    }

    next();
});


// ===============================
// NORMAL WEBSITE FILES
// ===============================

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});


// ===============================
// ADMIN AUTHENTICATION
// ===============================

function getSession(req) {

    const cookie = req.headers.cookie || "";

    const match = cookie.match(/admin_session=([^;]+)/);

    if (!match) {
        return null;
    }

    return sessions.get(match[1]) || null;
}


// Secret admin URL

app.get("/" + ADMIN_SECRET, (req, res) => {

    if (!getSession(req)) {

        return res.sendFile(
            path.join(__dirname, "public", "admin.html")
        );
    }

    res.sendFile(
        path.join(__dirname, "public", "admin.html")
    );
});


// Login

app.post("/" + ADMIN_SECRET + "/login", (req, res) => {

    const { username, password } = req.body;

    if (
        username !== ADMIN_USERNAME ||
        password !== ADMIN_PASSWORD
    ) {
        return res.status(401).json({
            success: false,
            message: "Invalid username or password"
        });
    }

    const token = crypto.randomBytes(32).toString("hex");

    sessions.set(token, {
        username: ADMIN_USERNAME,
        created: Date.now()
    });

    res.setHeader(
        "Set-Cookie",
        `admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`
    );

    res.json({
        success: true
    });
});


// Logout

app.post("/" + ADMIN_SECRET + "/logout", (req, res) => {

    const cookie = req.headers.cookie || "";
    const match = cookie.match(/admin_session=([^;]+)/);

    if (match) {
        sessions.delete(match[1]);
    }

    res.setHeader(
        "Set-Cookie",
        "admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
    );

    res.json({
        success: true
    });
});


// Check login

app.get("/" + ADMIN_SECRET + "/auth", (req, res) => {

    const session = getSession(req);

    res.json({
        loggedIn: !!session
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
// ADMIN STATISTICS
// ===============================

function getStats() {

    const onlineUsers =
        io.sockets.sockets.size;

    const waitingUsers =
        waitingUser ? 1 : 0;

    let activeChats = 0;

    io.sockets.sockets.forEach((socket) => {

        if (socket.partner) {
            activeChats++;
        }

    });

    activeChats =
        Math.floor(activeChats / 2);

    return {
        onlineUsers,
        waitingUsers,
        activeChats
    };
}


function sendStats() {

    io.emit("adminStats", getStats());
}


// Protected statistics endpoint

app.get("/" + ADMIN_SECRET + "/stats", (req, res) => {

    if (!getSession(req)) {

        return res.status(401).json({
            error: "Unauthorized"
        });
    }

    res.json(getStats());
});


// ===============================
// SERVER
// ===============================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log(
        "StrangerChat server running on port " + PORT
    );

});
