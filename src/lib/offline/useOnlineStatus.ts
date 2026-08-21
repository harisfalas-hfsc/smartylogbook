import { useEffect, useState } from 'react';
import {
  connectivityState,
  isOnline,
  onConnectivityChange,
  subscribeConnectivityState,
  type ConnectivityState,
} from './connectivity';

/** Live online/offline flag, fed by the one connectivity source (web + native). */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    setOnline(isOnline());
    return onConnectivityChange(setOnline);
  }, []);

  return online;
}

/** The richer state, so messages can tell "no internet" from "backend down". */
export function useConnectivityState(): ConnectivityState {
  const [state, setState] = useState<ConnectivityState>(connectivityState());

  useEffect(() => {
    setState(connectivityState());
    return subscribeConnectivityState(setState);
  }, []);

  return state;
}

/** The single sentence we show whenever an action needs the internet. */
export const OFFLINE_NOTICE =
  "You're offline — you can view everything saved on this device. Creating new items needs an internet connection.";

/** Honest empty state for a list with no saved copy on this device. */
export const OFFLINE_EMPTY =
  "You're offline and this device has no saved copy yet. Connect once and it will be stored here.";
