export interface ServerToClientEvents {
    roll: (bet: [number, number, number], result: {
        win: string[];
        amountAddToUser: Map<string, number>;
    }) => void;
    noBet: () => void;
    newBet: (bet: number, userId: string, amount: number, avatar: string) => void;
    pong: () => void;
    error: (message: string) => void;
    mappingBet: (mapping: { [key: string]: number }) => void;
}

export interface ClientToServerEvents {
    hello: () => void;
    roll: (token:string) => void;
}

export interface InterServerEvents {
    ping: () => void;
}

