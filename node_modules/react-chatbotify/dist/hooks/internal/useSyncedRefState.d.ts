import { SetStateAction, MutableRefObject } from "react";
/**
 * Internal custom hook for creating synced ref and state.
 */
export declare const useSyncedRefState: <T>(initialValue: T) => [T, (value: SetStateAction<T>) => void, MutableRefObject<T>];
//# sourceMappingURL=useSyncedRefState.d.ts.map