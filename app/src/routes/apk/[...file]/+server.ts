import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const GITHUB_RELEASE_APK_URL =
  "https://github.com/sanir321/mezzo/releases/download/v1.0.0/Mezzo-1.0.apk";

export const GET: RequestHandler = async () => {
  throw redirect(302, GITHUB_RELEASE_APK_URL);
};
