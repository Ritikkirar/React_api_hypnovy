const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("./db");

const app = express();

http = require("http");

var server = http.createServer(app);

const io = require("socket.io")(server, {
  // maxHttpBufferSize: 1e8,
  // pingTimeout: 60000,
  cors: {
    origin: process.env.FRONTEND,
    methods: ["GET", "POST"],
  },
});

// app.set('io', io);

io.on("connection", (socket) => {
  socket.on("newMessage", async (data) => {
    console.log("data//////////////", data);
    try {
      const notification = new Notification({
        message: data.message,
        requester: data.requester,
        userid: data.ID,
        adminID: data.adminID,
        req_ID: data.req_ID,
      });
      const createNotification = await notification.save();
      io.emit("poonam", createNotification)
      console.log("Notification saved:", createNotification);
    } catch (error) {
      console.error("Error saving notification:", error);
    }
  });
})
app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io/client-dist'));

// Middleware to attach ‘io’ to the ‘app’ instance
app.use((req, res, next) => {
  req.io = io; // Attach ‘io’ to the request object
  next();
});

const adminRoute = require("./routes/adminRoute");
const userRoute = require("./routes/userRoute");
const merchantRoute = require("./routes/merchantRoute");
const requestRoute = require("./routes/requestRoute");
const truckRoute = require("./routes/truckRoute");
const notificationRoute = require("./routes/notificationRoute");
const Notification = require("./model/notificationModel");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

app.use(cookieParser());

app.use(cors());
app.use(express.json());

app.use("/images", express.static("images"));
app.get("/", (req, res) => {
  res.send(`<h1>Welcome To Platinum Security Project</h1>`);
});
app.use("/api/v1", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/merchant", merchantRoute);
app.use("/api/request", requestRoute);
app.use("/api/truck", truckRoute);
app.use("/api/notification", notificationRoute);

const PORT = process.env.NODE_PORT;


server.listen(PORT, () => {
  console.log(`server run on port Number ${PORT}`);
});

module.exports = { io }