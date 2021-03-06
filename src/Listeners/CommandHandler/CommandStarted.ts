import { Listener, Command } from "discord-akairo";
import { Message, TextChannel } from "discord.js";

export default class CommandStarted extends Listener {
    constructor() {
        super("commandStarted", {
            event: "commandStarted",
            emitter: "commandHandler",
            category: "commandHandler"
        })
    }
    async exec(message: Message, command: Command): Promise<void> {
        console.log(
            `${message.author.tag} Using ${command.id} in channel ${(message.channel as TextChannel).name} server ${message.guild?.name}`
        )
    }
}