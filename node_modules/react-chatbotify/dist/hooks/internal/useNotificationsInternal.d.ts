/**
 * Internal custom hook for managing notifications.
 */
export declare const useNotificationInternal: () => {
    unreadCount: number;
    setUnreadCount: import("react").Dispatch<import("react").SetStateAction<number>>;
    notificationsToggledOn: boolean;
    toggleNotifications: (active?: boolean) => Promise<void>;
    playNotificationSound: () => void;
    setUpNotifications: () => Promise<void>;
};
//# sourceMappingURL=useNotificationsInternal.d.ts.map