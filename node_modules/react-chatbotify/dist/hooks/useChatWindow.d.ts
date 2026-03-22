/**
 * External custom hook for managing chat window.
 */
export declare const useChatWindow: () => {
    isChatWindowOpen: boolean;
    toggleChatWindow: (active?: boolean) => Promise<void>;
    toggleIsBotTyping: (active?: boolean) => Promise<void>;
    scrollToBottom: (duration?: number) => void;
    getIsChatBotVisible: () => boolean;
};
//# sourceMappingURL=useChatWindow.d.ts.map