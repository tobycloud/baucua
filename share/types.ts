export interface ServerToClientEvents {
    roll: (bet: [number, number, number], result: {
        win: string[];
        amountAddToUser: Map<string, number>;
    }) => void;
    noBet: () => void;
    newBet: (bet: number, userId: string, amount: number, avatar: string) => void;
    pong: () => void;
}

export interface ClientToServerEvents {
    hello: () => void;
}

export interface InterServerEvents {
    ping: () => void;
}

