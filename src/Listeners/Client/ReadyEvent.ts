import { Listener } from "discord-akairo";
import { User } from "discord.js"
import MunariClient from "../../Structures/MiwaClient";

export default class ReadyEvent extends Listener {
    constructor(public client: MunariClient) {
        super("ReadyEvent", {
            emitter: "client",
            event: "ready",
            category: "client"
        })
    }
    async exec(): Promise<void> {
        console.log(`[READY] ${(this.client.user as User).tag} Ready With ${await this.client.totalGuilds()} Servers`);
        this.client.user?.setPresence({
            activity: {
                name: `${process.env.DISCORD_PREFIX}help | ready to ${await this.client.totalGuilds()} Servers`, type: "LISTENING"
            },
            status: "idle"
        })
    }
}