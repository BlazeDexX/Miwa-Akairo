import { Command } from "discord-akairo";
import { Message, GuildMember, TextChannel, Guild, User } from "discord.js";
import { CreateEmbed } from "../Utils/CreateEmbed";
import MiwaClient from "../Structures/MiwaClient";
import { ServerQueue, SongsData } from "../Structures/PlayerClasses";

export default class PlayCommand extends Command {
    constructor() {
        super("PlayCommand", {
            aliases: ["play", "p"],
            description: {
                content: "Youtube? Spotify? i can play it",
                usage: "Play [youtube|spotify]"
            },
            args: [
                {
                    id: "song",
                    type: "string",
                    match: "content",
                    prompt: {
                        start: (message: Message) => {
                            const e = CreateEmbed("info")
                                .setDescription(
                                    `**Please input title or url the song\n` +
                                    `You have \`30 Second\` to input the song**`
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
                    id: "search",
                    match: "flag",
                    flag: "--search"
                }
            ],
            channel: "guild",
            ownerOnly: true,
            editable: true,
            typing: true,
            quoted: false
        })
    }
    async exec(message: Message, { song, search }: { song: string, search: boolean }): Promise<any> {
        const { channel } = (message.member as GuildMember).voice;
        if (!channel) return (message.channel as TextChannel).send(
            CreateEmbed(
                "info",
                "Please Join Voice Channel First"
            )
        ).then((x: Message) => x.delete({ timeout: 10000 }));
        const queue = message.guild?.queue;
        const data = await (this.client as MiwaClient).player.getSongs(song.replace("--search", "").trim());
        if (!data || data.tracks.length === 0) return message.channel.send(
            CreateEmbed(
                "error",
                "Cannot get song match the title"
            )
        ).then((x: Message) => x.delete({ timeout: 10000 }));

        const queueContruct = new ServerQueue(message);
        
        if ((data.type === "playlist" || data.type === "album")) {
            const trackpl = await data.tracks.slice(0, 50);
            if (queue) {
                for (let i = 0; i < data.tracks.length; i++) {
                    const totrack = new SongsData(trackpl[i], message.author);
                    queue.songs.push(totrack)
                }
            } else {
                for (let i = 0; i < data.tracks.length; i++) {
                    const totrack = new SongsData(trackpl[i], message.author) as never;
                    queueContruct.songs.push(totrack)
                }
            }
        } else {
            let song;
            try {
                if (search) {
                    let video
                    let i = 1;
                    const map = await data.tracks.slice(0, 5).map((x: any) => `**[${i++}]• [\`${x.title}\`](${x.uri})**`);
                    const e = CreateEmbed("info")
                    .setAuthor(`${(this.client.user as User).username} Searching Songs`)
                    .setDescription(map)
                    .setFooter("Type `cancel` to cancel the song request")
                    const embed = await message.channel.send(e);
                    try {
                        const regex = new RegExp(`^(?:[1-${map.length === 1 ? map.length : map.length - 1}]|${map.length}|cancel|c)$`, "i");
                        const response = await message.channel.awaitMessages((x) => {
                            return regex.test(x.content) && x.author.id === message.author.id;
                        }, {
                            max: 1,
                            time: 30000,
                            errors: ["time"]
                        }
                        );
                        const input = (response.first() as Message).content.substr(0, 6).toLowerCase()
                        if (input === 'cancel' || input === 'c') {
                            return embed.edit(CreateEmbed("info", "Song request has been canceled")).then(x => x.delete({ timeout: 10000 }));
                        }
                        embed.delete()
                        const videoIndex = parseInt((response.first() as Message).content);
                        video = await data.tracks[videoIndex - 1];
                    } catch (e) {
                        console.log(`[PLAYCOMMAND] PLAYCOMMAND_ERROR: ${e}`)
                        return message.channel.send(
                            CreateEmbed(
                                "info", 
                                "The request has been canceled because no respond!"
                            )
                        ).then(x => x.delete({ timeout: 10000 }));
                    }
                    song = new SongsData(video, message.author) as never;
                } else {
                    try {
                        const track = data.tracks.shift();
                        song = new SongsData(track, message.author) as never;
                    } catch(e) {
                        console.log(`[PLAYCOMMAND] PLAYCOMMAND_ERROR: ${e}`);
                        return message.channel.send(
                            CreateEmbed(
                                "error",
                                "Sorry i got the error when trying to get songs data"
                            )
                        ).then((x: Message) => x.delete({ timeout: 10000 }));
                    }
                }

                message.util?.send(
                    CreateEmbed(
                        "info",
                        `**${(song as any).title} has been added to queue**`
                    )
                        .setThumbnail((song as any).thumbnail)
                )
                if (queue) {
                    queue.songs.push(song);
                } else {
                    queueContruct.songs.push(song);
                }
            } catch (e) {
                console.log(`[PLAYCOMMAND] PLAYCOMMAD_ERROR: ${e}`)
                message.channel.send(
                    CreateEmbed(
                        "error",
                        `Sorry i can't get song data because ${e}`
                    )
                ).then((x: Message) => x.delete({ timeout: 10000 }));
            }
        }
        if (!queue) {
            try {
                const player = await channel.join();
                queueContruct.player = player as any;
                message.guild?.me?.voice.setSelfDeaf(true);
                (message.guild as Guild).queue = queueContruct;
                await (this.client as MiwaClient).player.play(queueContruct.songs[0], message);
            } catch (e) {
                console.log(`[PLAYCOMMAD] PLAYCOMMAND_ERROR: ${e}`)
                if (message.guild?.me?.voice.channel) {
                    message.guild.queue = null;
                    message.guild.me.voice.channel.leave();
                }
                (message.guild as Guild).queue = null;
                return message.channel.send(
                    CreateEmbed(
                        "error",
                        `Cannot play song right now because: ${e.message}`
                    )
                );
            }
        }
    }
}