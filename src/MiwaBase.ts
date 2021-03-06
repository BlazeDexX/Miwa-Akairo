import MiwaClient from "./Structures/MiwaClient";
new MiwaClient().start().catch((e: Error) => {
    console.log(`[CLIENT] CLIENT_START_ERROR: ${e}`)
})