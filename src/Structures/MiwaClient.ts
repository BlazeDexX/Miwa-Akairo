import "dotenv/config";
import "./Guild"
import "./Message"
import { AkairoClient, CommandHandler, ListenerHandler } from "discord-akairo";
import PlayerHandler from "../Utils/PlayerHandler";
import UtilHandler from "../Utils/UtilHandler";
import path from "path";

export default class MiwaClient extends AkairoClient {
    constructor() {
        super(
            {
                ownerID: process.env.OWNER_ID
            },
            {
                disableMentions: "everyone",
                messageCacheMaxSize: Infinity,
                messageCacheLifetime: 540,
                messageSweepInterval: 180,
                restTimeOffset: 0,
                ws: {
                    intents: [
                        "GUILDS",
                        "GUILD_BANS",
                        "GUILD_EMOJIS",
                        "GUILD_VOICE_STATES",
                        "GUILD_PRESENCES",
                        "GUILD_MESSAGES",
                        "GUILD_MESSAGE_REACTIONS",
                        "GUILD_MESSAGE_TYPING"
                    ]
                }
            }
        )
    }
    public commandHandler = new CommandHandler(this, {
        prefix: process.env.DISCORD_PREFIX,
        allowMention: true,
        blockClient: true,
        blockBots: true,
        handleEdits: true,
        commandUtil: true,
        commandUtilLifetime: 3e4,
        defaultCooldown: 10000,
        directory: path.join(__dirname, "..", "Commands")
    });
    public listenerHandler = new ListenerHandler(this, {
        directory: path.join(__dirname, "..", "Listeners")
    });
    public utils = new UtilHandler(this)
    public player = new PlayerHandler(this)

    async start(): Promise<void> {
        this.commandHandler.useListenerHandler(this.listenerHandler);
        this.listenerHandler.setEmitters({
            commandHandler: this.commandHandler,
            listenerHandler: this.listenerHandler
        })
        this.commandHandler.loadAll();
        this.listenerHandler.loadAll();

        super.login()
    }
    async totalGuilds(): Promise<void> {
        const guilds = await this.shard?.broadcastEval("this.guilds.cache.size");
        return guilds?.reduce((a, b) => a + b, 0)
    }
    async totalChannels(): Promise<void> {
        const channels = await this.shard?.broadcastEval("this.channels.cache.size");
        return channels?.reduce((a, b) => a + b, 0)
    }
    async totalUsers(): Promise<void> {
        const users = await this.shard?.broadcastEval("this.users.cache.size");
        return users?.reduce((a, b) => a + b, 0)
    }
    async totalPlaying(): Promise<void> {
        const playing = await this.shard?.broadcastEval("this.guilds.cache.filter((x) => x.queue !== null && x.queue.playing = true).size");
        return playing?.reduce((a, b) => a + b, 0)
    }
    async totalMemory(type: string): Promise<void> {
        const types = await this.shard?.broadcastEval(`process.memoryUsage()["${type}"]`);
        return types?.reduce((a, b) => a + b, 0)
    }
}
