const cors = require("cors");
const express = require("express");
const http = require("http");
const setupWebSocket = require("../src/utils/webSocket");
const { Engine } = require("matter-js");

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Initialize Matter.js engine and world
const engine = Engine.create();
const world = engine.world;
console.log(engine);
console.log(world);

// Export for use in other modules
module.exports = { engine, world };

setupWebSocket(server, world);
// setupSocketIo(server, corsOptions);

server.listen(3000, () => {
  console.log("Listening at :3000...");
});
