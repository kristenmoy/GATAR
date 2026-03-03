import { MutableRefObject } from "react";
import { Params } from "../../types/Params";
import { Block } from "../../types/Block";
/**
 * Handles the preprocessing within a block.
 *
 * @param block block to pre-process
 * @param params contains parameters that can be used/passed into attributes
 * @param botSimulateStreamEnabled indicates if bot simulating stream is enabled
 * @param timeoutIdRef ref to the timeout id for transition attribute
 * @param setSyncedTextAreaDisabled sets the state of the textarea for user input
 * @param setSyncedTextAreaSensitiveMode sets the sensitive mode of the textarea for user input
 * @param firePostProcessBlockEvent handles post processing block for transition attribute
 */
export declare const preProcessBlock: (block: Block, params: Params, botSimulateStreamEnabled: boolean, timeoutIdRef: MutableRefObject<ReturnType<typeof setTimeout> | null>, setSyncedTextAreaDisabled: (inputDisabled: boolean) => void, setSyncedTextAreaSensitiveMode: (inputDisabled: boolean) => void, firePostProcessBlockEvent: (block: Block) => Promise<Block | null>) => Promise<void>;
/**
 * Handles the postprocessing within a block.
 *
 * @param block block to post-process
 * @param params contains utilities that can be used/passed into attributes
 */
export declare const postProcessBlock: (block: Block, params: Params) => Promise<void>;
//# sourceMappingURL=BlockService.d.ts.map