const socketIO = (server)=>{
    const io = require("socket.io")(server, {
        pingTimeout: 60000,
        cors: {
          origin: process.env.FRONTEND,
          // credentials: true,
        },
      });


      
const adminSocket = io.of('/admin');
adminSocket.setMaxListeners(20);
adminSocket.on('connection', (socket) => {
  console.log('Admin connected with socket id:', socket.id);
  
  adminSocket.on('disconnect', () => {
    console.log('Admin disconnected with socket id:', socket.id);
  });
});

// Merchant Socket
const merchantSocket = io.of('/merchant');
merchantSocket.setMaxListeners(20);
merchantSocket.on('connection', (socket) => {
  console.log('Merchant connected with socket id:', socket.id);
  socket.on("new message", (newMessageReceived) => {
        console.log('Received notification:', newMessageReceived);
        adminSocket.emit("poonam",newMessageReceived)
      });

  merchantSocket.on('disconnect', () => {
    console.log('Merchant disconnected with socket id:', socket.id);
  });
});


}

module.exports =socketIO;