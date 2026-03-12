import { Block } from "../../types/Block";
import { Params } from "../../types/Params";
/**
 * Handles processing of is sensitive in current block.
 *
 * @param block current block being processed
 * @param params contains parameters that can be used/passed into attributes
 * @param setSyncedTextAreaSensitiveMode sets the sensitive mode of the textarea for user input
 */
export declare const processIsSensitive: (block: Block, params: Params, setSyncedTextAreaSensitiveMode: (inputDisabled: boolean) => void) => Promise<void>;
//# sourceMappingURL=IsSensitiveProcessor.d.ts.map