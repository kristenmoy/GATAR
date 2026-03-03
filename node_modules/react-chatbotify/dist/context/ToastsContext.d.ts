import { Dispatch, SetStateAction, MutableRefObject } from "react";
import { Toast } from "../types/Toast";
/**
 * Creates the useToastsContext() hook to manage toasts.
 */
type ToastsContextType = {
    toasts: Toast[];
    setSyncedToasts: Dispatch<SetStateAction<Toast[]>>;
    syncedToastsRef: MutableRefObject<Toast[]>;
};
declare const useToastsContext: () => ToastsContextType;
/**
 * Creates provider to wrap the chatbot container.
 */
declare const ToastsProvider: ({ children }: {
    children: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export { useToastsContext, ToastsProvider };
//# sourceMappingURL=ToastsContext.d.ts.map