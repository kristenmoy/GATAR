import { Settings } from "../types/Settings";
/**
 * Handles reading out of messages sent by the bot.
 *
 * @param message message to read out
 * @param language language to listen for
 * @param voiceNames list of voice names to use
 * @param rate speech rate
 * @param volume play volume
 */
export declare const speak: (message: string, language: string, voiceNames: string[], rate: number, volume: number) => void;
/**
 * Handles logic for reading out a bot message.
 *
 * @param settings settings provided to the bot
 * @param textToRead text to read out
 */
export declare const processAudio: (settings: Settings, textToRead: string) => void;
//# sourceMappingURL=AudioService.d.ts.map