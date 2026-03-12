import { Dispatch, SetStateAction, MutableRefObject } from "react";
import { Message } from "../types/Message";
/**
 * Creates the useMessagesContext() hook to manage messages.
 */
type MessagesContextType = {
    messages: Message[];
    setSyncedMessages: Dispatch<SetStateAction<Message[]>>;
    syncedMessagesRef: MutableRefObject<Message[]>;
};
declare const useMessagesContext: () => MessagesContextType;
/**
 * Creates provider to wrap the chatbot container.
 */
declare const MessagesProvider: ({ children }: {
    children: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export { useMessagesContext, MessagesProvider };
//# sourceMappingURL=MessagesContext.d.ts.map