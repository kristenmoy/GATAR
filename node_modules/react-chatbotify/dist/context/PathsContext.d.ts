import { Dispatch, SetStateAction, MutableRefObject } from "react";
import { Flow } from "../types/Flow";
/**
 * Creates the usePathsContext() context hook to manage user paths.
 */
type PathsContextType = {
    paths: (keyof Flow)[];
    setSyncedPaths: Dispatch<SetStateAction<string[]>>;
    syncedPathsRef: MutableRefObject<string[]>;
};
declare const usePathsContext: () => PathsContextType;
/**
 * Creates provider to wrap the chatbot container.
 */
declare const PathsProvider: ({ children }: {
    children: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export { usePathsContext, PathsProvider };
//# sourceMappingURL=PathsContext.d.ts.map