const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: process.env.PORT });

let clients = [];

wss.on("connection", ws => {
  clients.push(ws);

  ws.on("message", msg => {
    clients.forEach(c => {
      if (c !== ws) c.send(msg.toString());
    });
  });

  ws.on("close", () => {
    clients = clients.filter(c => c !== ws);
  });
});

console.log("Servidor WebRTC ativo");
