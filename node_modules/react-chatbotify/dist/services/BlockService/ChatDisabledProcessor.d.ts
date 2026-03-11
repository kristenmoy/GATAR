import { Block } from "../../types/Block";
import { Params } from "../../types/Params";
/**
 * Handles processing of chat disabled in current block.
 *
 * @param block current block being processed
 * @param params contains parameters that can be used/passed into attributes
 * @param setSyncedTextAreaDisabled sets the state of the textarea for user input
 */
export declare const processChatDisabled: (block: Block, params: Params, setSyncedTextAreaDisabled: (inputDisabled: boolean) => void) => Promise<void>;
//# sourceMappingURL=ChatDisabledProcessor.d.ts.map