import { createAuth, getBaseUrl } from "$lib/server/auth";
import type { PageServerLoad } from "./$types";

export const prerender = false;

export const load: PageServerLoad = async ({ request, platform, url }) => {
	try {
		const auth = createAuth(platform as never, getBaseUrl(url.origin));
		const session = await auth.api.getSession({ headers: request.headers });
		return {
			token: session?.session?.token || "",
			user: session?.user || null,
		};
	} catch {
		return {
			token: "",
			user: null,
		};
	}
};
