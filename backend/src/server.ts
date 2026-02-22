import http from "http";
import app from "./app.js";
import { initSocket } from "./utils/socket.js";

const PORT: number = Number(process.env.PORT) || 5000;

const server = http.createServer(app);
const io = initSocket(server);

app.set("io", io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});