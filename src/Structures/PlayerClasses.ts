import { Message, Util, User } from "discord.js";
import convert from "pretty-ms";

export class ServerQueue {
    constructor(public message: Message) { }
    public textChannel = this.message.channel;
    public voiceChannel = this.message.member?.voice.channel
    public guild = this.message.guild;
    public player = null;
    public songs = [];
    public volume = 100;
    public _repeat = 0;
    public _playing = true;
    public _lastMusicMessageID = null;
}

export class SongsData {
    constructor(public song: any | null, public message: User) { }
    public title = Util.escapeMarkdown(this.song.title as string);
    public identifier = this.song.identifier;
    public author = this.song.author;
    public duration = this.song.length;
    public formatted = convert(this.song.length, { colonNotation: true, secondsDecimalDigits: 0 });
    public url = this.song.uri;
    public thumbnail = `https://i.ytimg.com/vi/${this.identifier}/hq720.jpg`;
    public requester = this.message
}

export class TrackData {
    constructor(public data: any | null) {}
    public title = this.data.title;
    public identifier = this.data.videoId;
    public uri = `https://youtube.com/watch?v=${this.data.videoId}`;
    public length = this.data.duration.seconds * 1000;
    public author = this.data.author.name;
}