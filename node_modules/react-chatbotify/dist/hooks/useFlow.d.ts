/**
 * External custom hook for managing flow.
 */
export declare const useFlow: () => {
    hasFlowStarted: boolean;
    restartFlow: () => Promise<void>;
    getFlow: () => import("..").Flow;
};
//# sourceMappingURL=useFlow.d.ts.map