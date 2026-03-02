import { MutableRefObject } from "react";
import { Params } from "../../types/Params";
import { Block } from "../../types/Block";
/**
 * Handles processing of transition in current block.
 *
 * @param block current block to transition for
 * @param params contains parameters that can be used/passed into attributes
 * @param timeoutIdRef ref to the timeout id for transition attribute
 * @param firePostProcessBlockEvent handles post processing block for transition attribute
 */
export declare const processTransition: (block: Block, params: Params, timeoutIdRef: MutableRefObject<ReturnType<typeof setTimeout> | null>, firePostProcessBlockEvent: (block: Block) => Promise<Block | null>) => Promise<void>;
//# sourceMappingURL=TransitionProcessor.d.ts.map