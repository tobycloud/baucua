import http from "http"
import express from "express"
import cors from "cors"
import { Server } from "socket.io"
import uuid from "uuid"
import { Client } from "discord.js"
import { Bets, Database } from "./db"
import { ClientToServerEvents, InterServerEvents, ServerToClientEvents } from "../../share/types"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.resolve(__dirname, "../.env") })

const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
const httpServer = http.createServer(app)
const discordClient = new Client({ intents: ["Guilds"] })
const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents
>(httpServer,
    {
        cors: {
            origin: "*"
        }
    })

app.use(cors({
    origin: "*",
}))
const database = new Database({
    user: {},
    bet: {
        "bầu": {
            users: {},
        },
        "cua": {
            users: {},
        },
        "cá": {
            users: {},
        },
        "cộp": {
            users: {},
        },
        "tôm": {
            users: {},
        },
        "gà": {
            users: {},
        }
    },
})
io.engine.generateId = (_req) => {
    return uuid.v4(); // must be unique across all Socket.IO servers
}

io.on("connection", (socket) => {
    console.log("a user connected");
    io.emit("mappingBet", Bets)
    socket.on("hello", () => {
        socket.emit("pong")
    })
    socket.on("roll", async (token) => {
        if (token !== process.env.MASTER_TOKEN) {
            socket.emit("error", "Invalid token")
            return
        }
        if (!database.isBetEmpty()) {
            io.emit("noBet")
            return
        }
        const result = [Math.floor(Math.random() * 6), Math.floor(Math.random() * 6), Math.floor(Math.random() * 6)] as [number, number, number]
        const databaseUpdate = await database.updateAfterRoll(...result)
        io.emit("roll", result, databaseUpdate)
    })
    socket.on("disconnect", () => {
        console.log("user disconnected");
    })
})

discordClient.on("messageCreate", async (message) => {
    if (message.content === "!bet") {
        const args = message.content.split(" ")
        if (args.length > 1) {
            const bet = args[1]
            if (!Bets[bet as keyof typeof Bets]) {
                message.reply("Invalid bet")
                return
            }
            const amount = parseInt(args[2])
            let userInfo = (await database.getUser(message.author.id))
            if (!userInfo) {
                userInfo = await database.createUser(message.author.id, message.author.defaultAvatarURL, message.author.username)
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            if (userInfo!.balance - amount < 0) {
                message.reply("Not enough money")
                return
            }
            await database.setBet(bet as keyof typeof Bets, message.author.id, amount, message.author.defaultAvatarURL, message.author.username)
            io.emit("newBet", Bets[bet as keyof typeof Bets], message.author.id, amount, message.author.defaultAvatarURL)
        }
    }
})

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Server is running on address http://localhost:${PORT}`))
discordClient.login(process.env.DISCORD_BOT_TOKEN)
discordClient.on("ready", () => {
    console.log("Discord bot is ready")
})