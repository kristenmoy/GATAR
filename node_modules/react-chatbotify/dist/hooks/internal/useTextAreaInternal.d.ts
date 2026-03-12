/**
 * Internal custom hook for managing input text area.
 */
export declare const useTextAreaInternal: () => {
    textAreaDisabled: boolean;
    setSyncedTextAreaDisabled: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    textAreaSensitiveMode: boolean;
    setSyncedTextAreaSensitiveMode: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    inputLength: number;
    setInputLength: import("react").Dispatch<import("react").SetStateAction<number>>;
    getTextAreaValue: () => string;
    setTextAreaValue: (value: string) => Promise<void>;
    updateTextAreaFocus: (currPath: string) => void;
    focusTextArea: () => void;
    blurTextArea: () => void;
    toggleTextAreaDisabled: (active?: boolean) => void;
    toggleTextAreaSensitiveMode: (active?: boolean) => void;
};
//# sourceMappingURL=useTextAreaInternal.d.ts.map