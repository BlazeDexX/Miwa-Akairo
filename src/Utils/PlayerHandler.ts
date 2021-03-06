import "dotenv/config";
import { Message, Guild, User } from "discord.js";
import { CreateEmbed } from "./CreateEmbed";
import ytdlforplay from 'ytdl-core-discord';
import yts from 'yt-search';
import ytdl from "ytdl-core";
import MiwaClient from "../Structures/MiwaClient";
import { TrackData } from "../Structures/PlayerClasses";
const { getPreview, getTracks } = require('spotify-url-info');

export default class PlayerHandler {
    constructor(public client: MiwaClient) { }
    async leave(message: Message): Promise<void> {
        message.guild?.queue.voiceChannel.leave();
        (message.guild as Guild).queue = null;
    }
    async stop(message: Message): Promise<void> {
        (message.guild as Guild).queue.songs = [];
        message.guild?.queue.player.dispatcher.end();
    }
    async setVolume(message: Message, value: number): Promise<void> {
        (message.guild as Guild).queue.volume = value;
        message.guild?.queue.player.dispatcher.setVolume(value / Number(process.env.DEFAULT_VOLUME));
    }
    async skip(message: Message): Promise<void> {
        message.guild?.queue.player.dispatcher.end();
    }
    async pause(message: Message): Promise<void> {
        await message.guild?.queue.player.dispatcher.pause(true);
        (message.guild as Guild).queue._playing = false;
    }
    async resume(message: Message): Promise<void> {
        await message.guild?.queue.player.dispatcher.resume(true);
        (message.guild as Guild).queue._playing = true
    }
    async getSongs(data: string): Promise<any> {
        const ytregex = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-_]*)(&(amp;)?[\w?=]*)?/
        const plregex = /^((?:https?:)?\/\/)?((?:www|m)\.)?.*(youtu.be\/|list=)([^#&?]*).*/;
        const spregex = /^(?:https:\/\/open\.spotify\.com\/(?:user\/[A-Za-z0-9]+\/)?|spotify:)(album|playlist|track)(?:[/:])([A-Za-z0-9]+).*$/;

        const datasong = []
        let playlistName, albumName, type;

        if (ytregex.test(data)) {
            datasong.push(new TrackData((await yts((await ytdl.getInfo(data)).videoDetails.title)).all.filter((x) => x.type === "video")[0]));
            type = "track"
        } else if (plregex.test(data)) {
            playlistName = await yts.search({ listId: (data.match(plregex) as any)[4] }).then(x => { return x.title });
            const trackpl = (await yts.search({ listId: (data.match(plregex) as any)[4] })).videos;
            for (let i = 0; i < trackpl.length; i++) {
                datasong.push(new TrackData(trackpl[i]))
            }
            type = "playlist"
        } else if (spregex.test(data)) {
            const input = data.match(spregex) as any;
            if (input[1] === "track") {
                datasong.push(new TrackData((await yts.search(`${(await getPreview(data)).title}} - ${(await getPreview(data)).artist}`)).all.filter((x) => x.type === "video")[0]));
                type = "track";
            } else if (input[1] === "playlist") {
                playlistName = (await getPreview(data)).title;
                await getTracks(data).then(async (x: any) => {
                    const trackpl = await Promise.all(x.map(async (c: any) => (await yts(`${c.name} - ${c.artists[0].name}`)).all.filter((x) => x.type === "video")[0]));
                    for (let i = 0; i < trackpl.length; i++) {
                        datasong.push(new TrackData(trackpl[i]))
                    }
                });
                type = "playlist"
            } else {
                albumName = (await getPreview(data)).title;
                await getTracks(data).then(async (x: any) => {
                    const trackpl = await Promise.all(x.map(async (c: any) => (await yts(`${c.name} - ${c.artists[0].name}`)).all.filter((x) => x.type === "video")[0]));
                    for (let i = 0; i < trackpl.length; i++) {
                        datasong.push(new TrackData(trackpl[i]))
                    }
                });
                type = "album"
            }
        } else {
            const track = (await yts(data)).all.filter((x) => x.type === "video");
            for (let i = 0; i < track.length; i++) {
                datasong.push(new TrackData(track[i]))
            }
            type = "track"
        }
        return type !== "album" ? type === "playlist" ? { type: type, playlistName: playlistName, tracks: datasong } : { type: type, tracks: datasong } : { type: type, albumName: albumName, tracks: datasong };
    }
    async play(song: any | null, message: Message): Promise<void> {
        try {
            const dispatcher = await message.guild?.queue.player.play(
                await ytdlforplay(song.url, {
                    filter: "audioonly",
                    quality: "highestaudio",
                    highWaterMark: 1 << 25
                }),
                {
                    type: "opus"
                }
            );
            dispatcher.on("start", () => {
                const e = CreateEmbed("info")
                    .setAuthor(`${(this.client.user as User).username} - Nowplaying`)
                    .setImage(message.guild?.queue.songs[0].thumbnail)
                    .setDescription(
                        `**${message.guild?.queue.songs[0].title} - [\`${message.guild?.queue.songs[0].formatted}\`]**\n` +
                        `**From: \`${message.guild?.queue.songs[0].author}\`**`
                    );
                message.guild?.queue.textChannel.send(e).then((x: any) => {
                    (message.guild as Guild).queue._lastMusicMessageID = x.id
                })
            })
            dispatcher.on("finish", async () => {
                message.guild?.queue.textChannel.messages.fetch(message.guild.queue._lastMusicMessageID, false, true).then((x: Message) => x.delete())
                if (message.guild?.queue._repeat === 1) return this.play(message.guild.queue.songs[0], message);
                const lastSong = message.guild?.queue.songs.shift();
                if (message.guild?.queue._repeat === 2) {
                    message.guild.queue.songs.push(lastSong);
                    this.play(message.guild.queue.songs[0], message);
                } else if (!message.guild?.queue.songs[0]) {
                    await message.guild?.queue.textChannel.send(
                        CreateEmbed(
                            "info",
                            "**No more song in here. Thank you for using music service**"
                        )
                    ).then((x: Message) => x.delete({ timeout: 10000 }));
                    this.leave(message)
                } else {
                    this.play(message.guild.queue.songs[0], message);
                }
            });
            dispatcher.on("error", (e: Error) => {
                message.guild?.queue.songs.shift();
                console.log(`[PLAYER] PLAYER_HANDLER_ERROR: ${e}`);
                this.play(message.guild?.queue.songs[0], message);
            });
            dispatcher.setBitrate(128000)
            dispatcher.setVolumeLogarithmic(message.guild?.queue.volume / Number(process.env.DEFAULT_VOLUME));
        } catch (e) {
            console.log(`[PLAYER] PLAYER_HANDLER_ERROR: ${e}`);
            message.guild?.queue.textChannel.messages.fetch(message.guild.queue._lastMusicMessageID, false, true).then((x: Message) => x.delete());
            message.guild?.queue.textChannel.send(
                CreateEmbed(
                    "error",
                    `Sorry i got error when trying playing song`
                )
            ).then((x: Message) => x.delete({ timeout: 10000 }));
            return this.leave(message);
        }
    }
}