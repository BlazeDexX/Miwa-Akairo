import MiwaClient from "../Structures/MiwaClient";
import prettyMilliseconds from "pretty-ms";

export default class UtilHandler {
    constructor(public client: MiwaClient) {}
    async parseMs(value: number): Promise<any> {
        return prettyMilliseconds(value, { verbose: true, compact: false, secondsDecimalDigits: 0 })
    }
    async progressbar(total: number, current: number, size = 40, line = '▬', slider = '🔘'): Promise<any> {
        let bar
        if (current > total) {
            bar = line.repeat(size + 2);
        } else {
            const percentage = current / total;
            const progress = Math.round((size * percentage));
            const emptyProgress = size - progress;
            const progressText = line.repeat(progress).replace(/.$/, slider);
            const emptyProgressText = line.repeat(emptyProgress);
            bar = progressText + emptyProgressText;
        }
        return bar
    }
}