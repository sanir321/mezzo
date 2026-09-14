import { authClient } from "$lib/auth-client";
import { getCachedUser, setCachedUser } from "$lib/auth-token";

let sharedSession: any = null;

export function useSharedSession() {
  if (typeof window === "undefined") {
    return {
      subscribe: (fn: (val: any) => void) => {
        fn({ data: null, isPending: false, error: null });
        return () => {};
      },
      get: () => ({ data: null, isPending: false, error: null }),
    };
  }

  if (!sharedSession) {
    const rawSession = authClient.useSession();
    const subscribers = new Set<(val: any) => void>();

    window.addEventListener("mezzo:auth-changed", (e: any) => {
      if (e.detail?.user === null || (e.detail?.token === null && e.detail?.user === null)) {
        const nullVal = { data: null, isPending: false, error: null };
        for (const sub of subscribers) {
          sub(nullVal);
        }
      }
    });

    sharedSession = {
      subscribe: (subscriber: (val: any) => void) => {
        subscribers.add(subscriber);
        const unsub = rawSession.subscribe((val: any) => {
          if (val?.data?.user) {
            setCachedUser(val.data.user);
            subscriber(val);
          } else {
            const cached = getCachedUser();
            if (cached && (val?.error || !val?.isPending || (typeof navigator !== "undefined" && !navigator.onLine))) {
              subscriber({
                data: { user: cached, session: { user: cached } },
                isPending: false,
                error: null,
              });
            } else {
              subscriber(val);
            }
          }
        });
        return () => {
          subscribers.delete(subscriber);
          unsub();
        };
      },
      get: () => {
        const cached = getCachedUser();
        if (!cached) {
          return { data: null, isPending: false, error: null };
        }
        const val = rawSession.get() as any;
        if (val?.data?.user) return val;
        return {
          data: { user: cached, session: { user: cached } },
          isPending: false,
          error: null,
        };
      },
    };
  }

  return sharedSession;
}
