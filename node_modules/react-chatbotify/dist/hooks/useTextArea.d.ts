/**
 * External custom hook for managing input text area.
 */
export declare const useTextArea: () => {
    textAreaDisabled: boolean;
    toggleTextAreaDisabled: (active?: boolean) => void;
    textAreaSensitiveMode: boolean;
    toggleTextAreaSensitiveMode: (active?: boolean) => void;
    getTextAreaValue: () => string;
    setTextAreaValue: (value: string) => Promise<void>;
    focusTextArea: () => void;
    blurTextArea: () => void;
};
//# sourceMappingURL=useTextArea.d.ts.map