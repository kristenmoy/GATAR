import { Dispatch, SetStateAction, MutableRefObject } from "react";
import { Settings } from "../types/Settings";
/**
 * Creates the useBotStatesContext() hook to manage common states.
 */
export type BotStatesContextType = {
    isBotTyping: boolean;
    setSyncedIsBotTyping: Dispatch<SetStateAction<boolean>>;
    syncedIsBotTypingRef: MutableRefObject<boolean>;
    isChatWindowOpen: boolean;
    setSyncedIsChatWindowOpen: Dispatch<SetStateAction<boolean>>;
    syncedIsChatWindowOpenRef: MutableRefObject<boolean>;
    audioToggledOn: boolean;
    setSyncedAudioToggledOn: Dispatch<SetStateAction<boolean>>;
    syncedAudioToggledOnRef: MutableRefObject<boolean>;
    voiceToggledOn: boolean;
    setSyncedVoiceToggledOn: Dispatch<SetStateAction<boolean>>;
    syncedVoiceToggledOnRef: MutableRefObject<boolean>;
    notificationsToggledOn: boolean;
    setSyncedNotificationsToggledOn: Dispatch<SetStateAction<boolean>>;
    syncedNotificationsToggledOnRef: MutableRefObject<boolean>;
    isLoadingChatHistory: boolean;
    setIsLoadingChatHistory: Dispatch<SetStateAction<boolean>>;
    hasChatHistoryLoaded: boolean;
    setHasChatHistoryLoaded: Dispatch<SetStateAction<boolean>>;
    isScrolling: boolean;
    setSyncedIsScrolling: Dispatch<SetStateAction<boolean>>;
    syncedIsScrollingRef: MutableRefObject<boolean>;
    textAreaDisabled: boolean;
    setSyncedTextAreaDisabled: Dispatch<SetStateAction<boolean>>;
    syncedTextAreaDisabledRef: MutableRefObject<boolean>;
    textAreaSensitiveMode: boolean;
    setSyncedTextAreaSensitiveMode: Dispatch<SetStateAction<boolean>>;
    syncedTextAreaSensitiveModeRef: MutableRefObject<boolean>;
    hasInteractedPage: boolean;
    setHasInteractedPage: Dispatch<SetStateAction<boolean>>;
    hasFlowStarted: boolean;
    setHasFlowStarted: Dispatch<SetStateAction<boolean>>;
    unreadCount: number;
    setUnreadCount: Dispatch<SetStateAction<number>>;
    inputLength: number;
    setInputLength: Dispatch<SetStateAction<number>>;
    blockAllowsAttachment: boolean;
    setBlockAllowsAttachment: Dispatch<SetStateAction<boolean>>;
    viewportHeight: number;
    setViewportHeight: Dispatch<SetStateAction<number>>;
    viewportWidth: number;
    setViewportWidth: Dispatch<SetStateAction<number>>;
};
declare const useBotStatesContext: () => BotStatesContextType;
/**
 * Creates provider to wrap the chatbot container.
 */
declare const BotStatesProvider: ({ children, settings }: {
    children: React.ReactNode;
    settings?: Settings;
}) => import("react/jsx-runtime").JSX.Element;
export { useBotStatesContext, BotStatesProvider };
//# sourceMappingURL=BotStatesContext.d.ts.map