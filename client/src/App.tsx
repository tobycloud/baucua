import { ClientToServerEvents, ServerToClientEvents } from "../../share/types";
import "./App.css";
import { io, Socket } from "socket.io-client";

function App() {
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
    "http://localhost:8080"
  );
  socket.on("connect", () => {
    console.log(socket.id);
    socket.on("newBet", (data, userId, amount, avatar) => {
      console.log(data);
      console.log(userId);
      console.log(amount);
      console.log(avatar);
    });
    socket.on("noBet", () => {
      console.log("no bet to roll");
    });
    socket.on("roll", (data, result) => {
      console.log(data, result);
    });
  });
}

export default App;
