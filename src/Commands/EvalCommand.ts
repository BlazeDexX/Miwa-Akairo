import { Command } from "discord-akairo";
import { Message, MessageEmbed, MessageAttachment, Collection, Util } from 'discord.js'; // eslint-disable-line
import req from 'node-superfetch';
import util from 'util';
import { CreateEmbed } from "../Utils/CreateEmbed";

export default class EvalCommand extends Command {
    constructor() {
        super("EvalCommand", {
            aliases: ["eval", "ev"],
            description: {
                content: "Run code snippet",
                usage: "eval <code>"
            },
            args: [
                {
                    id: "code",
                    type: "string",
                    match: "content",
                    prompt: {
                        start: (message: Message) => {
                            const e = CreateEmbed("info")
                                .setDescription(
                                    `**Please input the code who want to evaluated\n` +
                                    `You have \`30 Second\`**`
                                )
                                .setFooter(`type 'canel' to cancel`);
                            message.util?.send(e);
                        },
                        cancel: (message: Message) => {
                            const e = CreateEmbed("info")
                                .setDescription(
                                    "**Command Canceled**"
                                );
                            message.util?.send(e).then((x: Message) => x.delete({ timeout: 10000 }));
                        },
                        timeout: (message: Message) => {
                            const e = CreateEmbed("error")
                                .setDescription("**Timeout**");
                            message.util?.send(e).then((x: Message) => x.delete({ timeout: 10000 }));
                        },
                        time: 30000,
                    }
                },
                {
                    id: "async",
                    match: "flag",
                    flag: "--async"
                },
                {
                    id: "silent",
                    match: "flag",
                    flag: "--silent"
                },
                {
                    id: "asilent",
                    match: "flag",
                    flag: "--async --silent"
                }
            ],
            channel: "guild",
            ownerOnly: true,
            editable: true,
            typing: true,
            quoted: false
        })
    }
    async exec(message: Message, { code, async, silent, asilent }: { code: string, async: boolean, silent: boolean, asilent: boolean }): Promise<void> {
        let coder;
        try {
            if (asilent) {
                code = code.replace(/```/g, "").trim().replace('--async', '').replace('--silent', '');
                await eval(
                    `(async () => {` +
                    `${code}` +
                    `})()`
                )
                return;
            } else if (async) {
                code = code.replace('--async', '')
                coder = await eval(
                    `(async () => {` +
                    `${code.replace(/```/g, "").trim()}` +
                    `})()`
                )
            } else if (silent) {
                code = code.replace(/```/g, "").trim().replace('--silent', '')
                await eval(code)
                return;
            } else {
                coder = await eval(code.replace(/```/g, "").trim())
            }

            const outputcode = util.inspect(coder, { depth: 0 });
            if (outputcode.length > 1024) {
                const { body } = await req.post('https://paste.mod.gg/documents').send(outputcode)
                await message.channel.send([
                    `**Output**\nhttps://paste.mod.gg/${(body as any).key}`,
                ])
            } else {
                await message.util?.send([
                    `**Output**\n\`\`\`js\n${clean(outputcode).replace(this.client.token as string, " [SECRET] ")}\n\`\`\``,
                ])
            }
        } catch (error) {
            if (error.length > 1024) {
                const { body } = await req.post('https://paste.mod.gg/documents').send(error)
                await message.channel.send([
                    `**Error**\nhttps://paste.mod.gg/${(body as any).key}.js`
                ])
            } else {
                await message.util?.send([
                    `**Error**\n\`\`\`js\n${error.stack}\n\`\`\``
                ])
            }
        }
    }
}
function clean(text: string) {
    if (typeof text === "string")
        return text
            .replace(/`/g, "`" + String.fromCharCode(8203))
            .replace(/@/g, "@" + String.fromCharCode(8203));
    else return text;
}