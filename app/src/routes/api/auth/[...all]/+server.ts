import { toSvelteKitHandler } from "better-auth/svelte-kit";
import { createAuth, getBaseUrl } from "$lib/server/auth";
import type { RequestHandler } from "./$types";

const getPlatform = ({ platform }: { platform: any }) => {
	return {
		env: {
			...platform?.env,
			DB: platform?.env?.DB ?? (typeof globalThis !== "undefined" && typeof (globalThis as any).env !== "undefined" ? (globalThis as any).env.DB : undefined),
		}
	};
};

export const GET: RequestHandler = ({ request, url, platform }) => {
	const auth = createAuth(getPlatform({ platform }), getBaseUrl(url.origin, platform));
	return toSvelteKitHandler(auth)({ request });
};

export const POST: RequestHandler = ({ request, url, platform }) => {
	const auth = createAuth(getPlatform({ platform }), getBaseUrl(url.origin, platform));
	return toSvelteKitHandler(auth)({ request });
};
