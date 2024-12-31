import { Elysia } from "elysia";
import { Client } from "discord.js";
import cors from "@elysiajs/cors";

interface User {
  id: string;
  amount: number;
  avatar: string;
  username: string;
}

interface Player {
  id: string;
  bet: Bet;
  amount: number;
}

type Bet = "cua" | "bau" | "tom" | "ca" | "ga" | "nai";
export const bets: Bet[] = ["cua", "bau", "tom", "ca", "ga", "nai"];

const db = {
  users: {} as Record<string, User>,
  bet: {
    players: {} as Record<string, Player>,
  }
}

function roll() {
  return bets[Math.floor(Math.random() * bets.length)];
}
const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .use(cors())
  .ws("/ws", {
    open: (ws) => {
      ws.send({
        type: "connected", data: db
      });
      setInterval(() => {
        ws.send({
          type: "update",
          data: db
        });
      }, 1000);
    }

  })
  .get("/roll", async (ctx) => {
    const totalAmount = Object.values(db.bet.players).reduce(
      (acc, player) => acc + player.amount,
      0
    );

    const eachBetAmount = {
      cua: 0,
      bau: 0,
      tom: 0,
      ca: 0,
      ga: 0,
      nai: 0,
    }
    for (const player of Object.values(db.bet.players)) {
      eachBetAmount[player.bet] += player.amount;
    }
    const result = [roll(), roll(), roll()];
    if (totalAmount === 0) {
      return {
        result,
        db,
        error: "No one bet"
      };
    }
    for (const player of Object.values(db.bet.players)) {
      if (result.includes(player.bet)) {
        db.users[player.id].amount += (player.amount / eachBetAmount[player.bet]) * totalAmount;
      }
    }
    for (const user of Object.values(db.users)) {
      if (user.amount <= 0) {
        user.amount = 10;
      }
    }
    db.bet.players = {};
    return {
      result,
      db
    };
  })
  .get("/dbs", () => db)
  .listen(3000);

const client = new Client({
  intents: ["Guilds", "GuildMessages", "MessageContent"],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on("messageCreate", (message) => {
  if (message.content === "ping") {
    message.reply("pong");
  }
  if (message.content.startsWith("!pick")) {
    const [_, ...args] = message.content.split(" ");
    const bet = args[0];
    if (!bets.includes(bet as Bet)) {
      message.reply(
        `Invalid bet! Please pick one of the following: ${bets.join(", ")}`
      );
      return;
    }
    const amount = Number(args[1]);
    db.users[message.author.id] = {
      id: message.author.id,
      amount: (db.users[message.author.id]?.amount || 10),
      avatar: message.author.displayAvatarURL() || "",
      username: message.author.username,
    };
    if (amount <= 0) {
      message.reply("Invalid amount!");
      return;
    }
    if (db.bet.players[`${message.author.id}-${bet}`]) {
      // Return the money to the user
      db.users[message.author.id].amount += db.bet.players[`${message.author.id}-${bet}`].amount;
      // Delete the player from the bet
      delete db.bet.players[`${message.author.id}-${bet}`];
      message.reply(`You already bet ${bet} ${db.bet.players[`${message.author.id}-${bet}`].amount}! The change will be overwritten.`);
    }
    if (db.users[message.author.id].amount < amount) {
      message.reply("You don't have enough money!");
      return;
    }
    db.users[message.author.id].amount -= amount;
    db.bet.players[`${message.author.id}-${bet}`] = {
      id: message.author.id,
      bet: bet as Bet,
      amount,
    };
    message.reply(`You bet ${bet} ${amount}!`);
  } else if (message.content === "!balance") {
    if (!db.users[message.author.id]) {
      db.users[message.author.id] = {
        id: message.author.id,
        amount: 10,
        avatar: message.author.displayAvatarURL() || "",
        username: message.author.username,
      };
    }
    return message.reply(`Your balance is ${db.users[message.author.id].amount}`);
  }
});

client.login(process.env.DISCORD_TOKEN);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
