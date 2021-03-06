import { Structures } from "discord.js";
Structures.extend("Guild", Guild => {
    return class GuildManager extends Guild {
        public queue: any = null
    }
});

declare module 'discord.js' {
    export interface Guild {
        queue: any
    }
}