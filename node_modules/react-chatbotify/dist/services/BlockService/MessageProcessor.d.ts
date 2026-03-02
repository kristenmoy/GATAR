import { Block } from "../../types/Block";
import { Params } from "../../types/Params";
/**
 * Handles processing of message in current block.
 *
 * @param block current block being processed
 * @param params contains parameters that can be used/passed into attributes
 * @param botSimulateStreamEnabled boolean indicating whether to simulate stream message for bot
 */
export declare const processMessage: (block: Block, params: Params, botSimulateStreamEnabled: boolean) => Promise<void>;
//# sourceMappingURL=MessageProcessor.d.ts.map