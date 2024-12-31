import { useEffect, useState } from "react";
import logoDark from "./logo-dark.svg";
import logoLight from "./logo-light.svg";

type Bet = "cua" | "bau" | "tom" | "ca" | "ga" | "nai";
export const bets: Bet[] = ["cua", "bau", "tom", "ca", "ga", "nai"];
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

const betsImage = {
  cua: "/images/crab.png",
  bau: "/images/calabash-bottle.png",
  tom: "/images/shrimp.png",
  ca: "/images/clown-fish.png",
  ga: "/images/chicken.png",
  nai: "/images/deer.png",
};

const mappingFormalBetName={
  bau: "Bầu",
  ca: "Cá",
  ga: "Gà",
  nai: "Nai",
  cua: "Cua",
  tom: "Tôm",
}

export function Welcome() {
  const [db, setDb] = useState({
    users: {} as Record<string, User>,
    bet: {
      players: {} as Record<string, Player>,
    },
  });
  const [rolledBet, setRolledBet] = useState<Bet[]>([]);
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const sortedBet = {} as Record<Bet, number>;
  Object.values(db.bet.players).forEach((player) => {
    if (!sortedBet[player.bet]) {
      sortedBet[player.bet] = 0;
    }
    sortedBet[player.bet] += player.amount;
  });
  function connect() {
    const ws = new WebSocket("ws://localhost:3000/ws");
    ws.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      setDb(data.data);
    });
    ws.addEventListener("close", () => {
      connect();
    });
    ws.addEventListener("error", () => {
      connect();
    });
    ws.addEventListener("open", () => {
      console.log("connected");
    });
  }
  useEffect(() => {
    connect();
  }, []);
  const roll = () => {
    if (intervalId) clearInterval(intervalId);
    const nowIntervalId = setInterval(() => {
      setRolledBet([
        bets[Math.floor(Math.random() * bets.length)],
        bets[Math.floor(Math.random() * bets.length)],
        bets[Math.floor(Math.random() * bets.length)],
      ]);
    }, 500);
    // @ts-ignore
    setIntervalId(nowIntervalId);
    console.log(nowIntervalId);
    setTimeout(async () => {
      if (intervalId) clearInterval(intervalId);
      if (nowIntervalId) clearInterval(nowIntervalId);
      setIntervalId(null);
      setRolledBet([]);
      const res = await fetch("http://localhost:3000/roll");
      const data = await res.json();
      setRolledBet([...data.result]);
      setDb(data.db);
    }, 5000);
  };
  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex justify-center gap-16 min-h-0">
        {/* leaderboard */}
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">
            Leaderboard
          </h1>
          <div className="flex flex-col items-center gap-4">
            {Object.values(db.users)
              .sort((a, b) => b.amount - a.amount)
              .map((user) => (
                <div
                  className="flex items-center gap-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-50 p-3 border rounded"
                  key={user.id}
                >
                  <img
                    className=" font-semibold py-2 px-4 rounded max-w-20 max-h-20"
                    src={user.avatar}
                    alt={user.username}
                  ></img>
                  <div className="flex flex-col items-center mx-5">
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {user.username}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {user.amount}
                    </p>
                  </div>
                </div>
              ))
              .slice(0, 5)}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="grid grid-cols-3 gap-4">
            {bets.map((bet) => (
              <div
                className={`flex flex-col items-center gap-4 ${
                  rolledBet.includes(bet) ? "animate-pulse duration-250" : ""
                }`}
              >
                <img
                  key={bet}
                  className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-50 font-semibold py-2 px-4 rounded w-52 h-52"
                  src={betsImage[bet]}
                  alt={bet}
                ></img>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 text-center">
                  {sortedBet[bet] || 0}
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center gap-4">
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 text-center">
                Rolled Result : {rolledBet.map((bet) => mappingFormalBetName[bet]).join(" ; ")}
              </p>
            </div>

            <button
              className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-50 font-semibold py-2 px-4 rounded"
              onClick={roll}
            >
              Roll
            </button>
          </div>
        </div>
        <div></div>
      </div>
    </main>
  );
}
