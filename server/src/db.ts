import { Low } from 'lowdb/lib'
import { JSONFilePreset } from 'lowdb/node'

export const Bets = {
    "bầu": 0,
    "cua": 1,
    "cá": 2,
    "cộp": 3,
    "tôm": 4,
    "gà": 5
}


export interface IDefaultData {
    user: {
        [id: string]: {
            balance: number
        }
    }
    bet: {
        [key in keyof typeof Bets]: {
            users: {
                [id: string]: {
                    amount: number
                }
            }
        }
    }
}
export class Database {
    db: Low<typeof this.defaultData>
    constructor(public defaultData: IDefaultData) {
        this.setup()
    }
    async setup() {
        this.db = await JSONFilePreset('db.json', this.defaultData)

        setInterval(() => {
            this.db.write()
        }, 5000)
        process.on('beforeExit', () => {
            this.db.write()
        })
    }
    async setBet(key: keyof typeof Bets, id: string, amount: number) {
        this.db.data.bet[key].users[id] = {
            amount
        }
        if (!this.db.data.user[id]) {
            this.db.data.user[id] = {
                balance: 5
            }
        }
        this.db.data.user[id].balance -= amount
        await this.db.write()
    }
    async getUser(id: string) {
        if (this.db.data.user[id]) return this.db.data.user[id]
        else return undefined
    }

    async updateAfterRoll(...bet: [number, number, number]) {
        const winBetKeys = [Object.keys(Bets)[bet[0]], Object.keys(Bets)[bet[1]], Object.keys(Bets)[bet[2]]]
        const loseBets = []
        for (const keys in Bets) {
            if (!winBetKeys.includes(keys)) {
                loseBets.push(keys)
            }
        }
        const result = {
            win: winBetKeys,
            amountAddToUser: new Map<string, number>(),
        }
        const totalLoseBetAmount = loseBets.reduce((a, b) => a + Object.values(this.db.data.bet[b as keyof typeof Bets].users).reduce((a, b) => a + b.amount, 0), 0)
        const totalWinBetAmount = winBetKeys.reduce((a, b) => a + Object.values(this.db.data.bet[b as keyof typeof Bets].users).reduce((a, b) => a + b.amount, 0), 0)
        for (const win of winBetKeys) {
            for (const users in this.db.data.bet[win as keyof typeof Bets].users) {
                // calculate reward by % of total bet amount
                const reward = this.db.data.bet[win as keyof typeof Bets].users[users].amount / totalWinBetAmount * totalLoseBetAmount
                result.amountAddToUser.set(users, reward)
                this.db.data.user[users].balance += reward
            }
        }
        // reset bet
        this.db.data.bet = {
            "bầu": { users: {} },
            "cua": { users: {} },
            "cá": { users: {} },
            "cộp": { users: {} },
            "tôm": { users: {} },
            "gà": { users: {} }
        };
        // give 5 money to each user have balance equal to 0
        for (const users in this.db.data.user) {
            if (this.db.data.user[users].balance === 0) {
                this.db.data.user[users].balance = 5
            }
        }
        await this.db.write()
        return result
    }
    isBetEmpty() {
        for (const key in this.db.data.bet) {
            if (Object.keys(this.db.data.bet[key as keyof typeof Bets].users).length > 0) {
                return false
            }
        }
        return true
    }
    async createUser(id: string) {
        if (!this.db.data.user[id]) {
            this.db.data.user[id] = {
                balance: 5
            }
            await this.db.write()
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.db.data.user[id]
    }
}
