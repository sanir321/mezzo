import { createAuth, getBaseUrl } from "$lib/server/auth";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url, platform, request }) => {
	const provider = (url.searchParams.get("provider") || "google") as "google" | "github";
	const native = url.searchParams.get("native") === "1";

	const callbackURL = native
		? `${url.origin}/oauth/google-callback?native=1`
		: `${url.origin}/`;

	try {
		const auth = createAuth(platform as never, getBaseUrl(url.origin));
		const res = await auth.api.signInSocial({
			body: {
				provider,
				callbackURL,
			},
			asResponse: true,
		});

		const location = res.headers.get("location");
		if (location) {
			const headers = new Headers();
			headers.set("Location", location);

			// Forward all Set-Cookie headers so OAuth state & verifier cookies are stored directly in Chrome
			const cookies = res.headers.getSetCookie?.() ?? [];
			if (cookies.length > 0) {
				for (const cookie of cookies) {
					headers.append("Set-Cookie", cookie);
				}
			} else {
				const singleCookie = res.headers.get("set-cookie");
				if (singleCookie) {
					headers.set("Set-Cookie", singleCookie);
				}
			}

			return new Response(null, {
				status: 302,
				headers,
			});
		}

		const data = (await res.json().catch(() => null)) as any;
		if (data?.url) {
			return Response.redirect(data.url, 302);
		}

		return new Response("Unable to generate social login URL", { status: 500 });
	} catch (err: any) {
		return new Response(err?.message || "Social login initiation failed", { status: 500 });
	}
};
