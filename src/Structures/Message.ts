import { APIMessage, Structures } from "discord.js";

class Message extends Structures.get("Message") {
    public async inlineReply(content: any, options?: any): Promise<any> { // eslint-disable-line
        const mentionRepliedUser = typeof ((options || content || {}).allowedMentions || {}).repliedUser === "undefined" ? true : ((options || content).allowedMentions).repliedUser;
        delete ((options || content || {}).allowedMentions || {}).repliedUser;

        const apiMessage = content instanceof APIMessage ? content.resolveData() : APIMessage.create(this.channel, content, options).resolveData();
        Object.assign(apiMessage.data, { message_reference: { message_id: this.id } });

        // @ts-expect-error 2339
        if (!apiMessage.data.allowed_mentions || Object.keys(apiMessage.data.allowed_mentions).length === 0) apiMessage.data.allowed_mentions = { parse: ["users", "roles", "everyone"] };
        // @ts-expect-error 2339
        if (typeof apiMessage.data.allowed_mentions.replied_user === "undefined") Object.assign(apiMessage.data.allowed_mentions, { replied_user: mentionRepliedUser });

        // @ts-expect-error 2339
        if (Array.isArray(apiMessage.data.content)) {
            return Promise.all(apiMessage.split().map(x => {
                // @ts-expect-error 2339
                x.data.allowed_mentions = apiMessage.data.allowed_mentions;
                return x;
            }).map(this.inlineReply.bind(this)));
        }

        const { data, files } = await apiMessage.resolveFiles();
        // @ts-expect-error 2339
        return this.client.api.channels[this.channel.id].messages.post({ data, files }).then(d => this.client.actions.MessageCreate.handle(d).message);
    }
}

declare module "discord.js" {
    export interface MessageMentionOptions {
        repliedUser?: boolean;
    }
    export interface Message {
        inlineReply(content: APIMessageContentResolvable | (MessageOptions & { split?: false }) | MessageAdditions): Promise<Message>;
        inlineReply(options: MessageOptions & { split: true | SplitOptions }): Promise<Message[]>;
        inlineReply(options: MessageOptions | APIMessage): Promise<Message | Message[]>;
        inlineReply(content: StringResolvable, options: (MessageOptions & { split?: false }) | MessageAdditions): Promise<Message>;
        inlineReply(content: StringResolvable, options: MessageOptions & { split: true | SplitOptions }): Promise<Message[]>;
        inlineReply(content: StringResolvable, options: MessageOptions): Promise<Message | Message[]>;
    }
}

Structures.extend("Message", () => Message);