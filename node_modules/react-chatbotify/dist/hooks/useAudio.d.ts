/**
 * External custom hook for managing audio.
 */
export declare const useAudio: () => {
    audioToggledOn: boolean;
    speakAudio: (text: string) => Promise<void>;
    toggleAudio: (active?: boolean) => Promise<void>;
};
//# sourceMappingURL=useAudio.d.ts.map