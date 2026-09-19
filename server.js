const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const path = require("path");

app.use(express.static(path.join(__dirname, "public")));;
app.get("/", (req, res) => {
    res.send("StrangerChat server is working!");
});
let waitingUser = null;

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    socket.on("joinChat", () => {

        if (waitingUser && waitingUser !== socket.id) {

            const stranger = waitingUser;

            waitingUser = null;

            socket.partner = stranger;
            io.sockets.sockets.get(stranger).partner = socket.id;

            io.to(socket.id).emit("matched");

            io.to(stranger).emit("matched");

        } else {

            waitingUser = socket.id;

            socket.emit("waiting");

        }

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

    });


    socket.on("disconnect", () => {

        if (socket.partner) {

            io.to(socket.partner)
                .emit("partnerLeft");

        }

        if (waitingUser === socket.id) {

            waitingUser = null;

        }

        console.log("User disconnected:", socket.id);

    });

});


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log(
        "StrangerChat server running on port 3000"
    );

});
