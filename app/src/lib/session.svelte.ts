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
    
    sharedSession = {
      subscribe: (subscriber: (val: any) => void) => {
        return rawSession.subscribe((val: any) => {
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
      },
      get: () => {
        const val = rawSession.get() as any;
        if (val?.data?.user) return val;
        const cached = getCachedUser();
        if (cached) {
          return {
            data: { user: cached, session: { user: cached } },
            isPending: false,
            error: null,
          };
        }
        return val;
      },
    };
  }

  return sharedSession;
}
