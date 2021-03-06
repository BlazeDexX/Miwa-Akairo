import "dotenv/config";
import app from "express";
import { ShardingManager } from "discord.js";
import moment from "moment";
import { resolve } from "path";

/* Build Server */
app().get("/", (_: any, res: any) => {
    res.sendStatus(200);
});
app().listen(3000);

const shard = new ShardingManager(resolve(__dirname, "MiwaBase.js"), {
    totalShards: "auto",
    mode: "process",
    respawn: true,
    token: process.env.DISCORD_TOKEN
})

shard.spawn(shard.totalShards, undefined, -1).catch((x) => {
    console.log(`[SHARD] SHARD_SPAWN_ERROR : ${x}`)
});

shard.once("shardCreate", (x) => {
    x.on("spawn", () => {
        console.log(`[ShardManager] [${moment(new Date()).format('MMMM Do YYYY, h:mm:ss a')}] Shard #${x.id} has spawned`)
    })
    x.on("ready", () => {
        console.log(`[ShardManager] [${moment(new Date()).format('MMMM Do YYYY, h:mm:ss a')}] Shard #${x.id} ready`)
    });
    x.on("death", () => {
        console.log(`[ShardManager] [${moment(new Date()).format('MMMM Do YYYY, h:mm:ss a')}] Shard #${x.id} has death`)
    });
    x.on("disconnect", () => {
        console.log(`[ShardManager] [${moment(new Date()).format('MMMM Do YYYY, h:mm:ss a')}] Shard #${x.id} has disconnected`);
    });
    x.on("reconnecting", () => {
        console.log(`[ShardManager] [${moment(new Date()).format('MMMM Do YYYY, h:mm:ss a')}] Shard #${x.id} has reconnected.`);
    });
})