import { RcbEvent } from '../constants/RcbEvent';
import { RcbBaseEvent } from '../types/internal/events/RcbBaseEvent';
/**
 * External custom hook for listening to RcbEvents with built-in filter by bot id.
 *
 * @param eventName name of the rcb event to listen to
 * @param handler callback that receives the event with `detail` containing botId and path info
 */
export declare const useOnRcbEvent: (eventName: RcbEvent, handler: (event: RcbBaseEvent) => void) => void;
//# sourceMappingURL=useOnRcbEvent.d.ts.map