const WebSocket = require("ws");

const SPEED = 8;
const BOOST = 16;

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  let nextClientId = 0; // Initialize a counter for client IDs
  const clients = new Map();

  const RATE_LIMIT_INTERVAL = 20; // Rate limit interval in milliseconds (approximately 60 updates per second)

  wss.on("connection", (ws) => {
    let speed = SPEED;

    // Assign clientId and clientData to new connection
    const clientId = nextClientId++;
    const clientData = {
      ws,
      position: { x: 200, y: 200 },
      lastUpdate: Date.now(),
    };

    // Add new connection to clients map
    clients.set(clientId, clientData); // Store the WebSocket connection with its ID
    console.log("a user connected");
    console.log(clients);

    sendPosition(ws, "initial position");
    broadcastPositions();

    ws.on("message", (message) => {
      const msg = JSON.parse(message);
      const now = Date.now();
      try {
        if (msg.type === "move") {
          const clientData = clients.get(clientId);
          if (clientData) {
            // Throttle updates based on RATE_LIMIT_INTERVAL
            if (now - clientData.lastUpdate >= RATE_LIMIT_INTERVAL) {
              for (const direction of msg.data) {
                switch (direction) {
                  case "ArrowLeft":
                    clientData.position.x -= speed;
                    break;
                  case "ArrowRight":
                    clientData.position.x += speed;
                    break;
                  case "ArrowUp":
                    clientData.position.y -= speed;
                    break;
                  case "ArrowDown":
                    clientData.position.y += speed;
                    break;
                }
              }

              clientData.lastUpdate = now;
            }
          }
        }

        if (msg.type === "boost") {
          if (msg.data === true) {
            speed = BOOST;
          } else {
            speed = SPEED;
          }
        }

        broadcastPositions();
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });
    ws.on("close", () => {
      console.log("user disconnected");
      clients.delete(clientId);
      console.log(clients);
    });

    // Broadcast the updated position to all clients
    function broadcastPositions() {
      wss.clients.forEach((client) => {
        sendPosition(client, "position");
      });
    }

    // Broadcast the updated position to a specific client
    function sendPosition(client, type) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: type,
            data: {
              position: clientData.position,
              clientId: clientId,
              allPositions: Array.from(clients.entries()).map(([id, data]) => ({
                clientId: id,
                position: data.position,
              })),
            },
          })
        );
      }
    }
  });

  return wss;
}

module.exports = setupWebSocket;
