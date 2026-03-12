/**
 * Internal custom hook for managing chat window logic.
 */
export declare const useChatWindowInternal: () => {
    isChatWindowOpen: boolean;
    setSyncedIsChatWindowOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    toggleChatWindow: (active?: boolean) => Promise<void>;
    viewportHeight: number;
    setViewportHeight: import("react").Dispatch<import("react").SetStateAction<number>>;
    viewportWidth: number;
    setViewportWidth: import("react").Dispatch<import("react").SetStateAction<number>>;
    toggleIsBotTyping: (active?: boolean) => Promise<void>;
    scrollToBottom: (duration?: number) => void;
    getIsChatBotVisible: () => boolean;
};
//# sourceMappingURL=useChatWindowInternal.d.ts.map