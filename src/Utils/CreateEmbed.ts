import { MessageEmbed } from 'discord.js';

type colortype = "success" | "info" | "warn" | "error";
const color: Record<colortype, string> = {
    success: "#18d869",
    info: "#88d6ff",
    warn: "#FFFF00",
    error: "#FF0000"
};

export function CreateEmbed(type?: colortype, message?: string): MessageEmbed {
    const embed: MessageEmbed = new MessageEmbed()
    if (type) embed.setColor(color[type])
    if (message) embed.setDescription(message)
    return embed
}