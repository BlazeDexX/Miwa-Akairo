import { Listener, Command } from "discord-akairo";
import { CreateEmbed } from "../../Utils/CreateEmbed";
import { Message } from "discord.js";
import MunariClient from "../../Structures/MiwaClient"

export default class Cooldown extends Listener {
    constructor(public client: MunariClient) {
        super("cooldown", {
            event: "cooldown",
            emitter: "commandHandler",
            category: "commandHandler"
        })
    }
    async exec(message: Message, command: Command, remaining: number): Promise<void> {
        if (remaining < 0) return;
        message.inlineReply(
            CreateEmbed(
                "info",
                `Please wait **\`${ await this.client.utils.parseMs(remaining)}\`** before reusing **\`${command.id}\`** command`
            )
        ).then((x: Message) => x.delete({ timeout: 8000 }))
    }
}