/**
 * External custom hook for managing chat history.
 */
export declare const useChatHistory: () => {
    showChatHistory: () => Promise<void>;
    getHistoryMessages: () => import("..").Message[];
    setHistoryMessages: (messages: import("..").Message[]) => void;
    hasChatHistoryLoaded: boolean;
};
//# sourceMappingURL=useChatHistory.d.ts.map