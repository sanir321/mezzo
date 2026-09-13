import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { hashPassword } from "better-auth/crypto";

export const POST: RequestHandler = async ({ request, platform }) => {
	const db =
		platform?.env?.DB ??
		(typeof globalThis !== "undefined" && typeof (globalThis as any).env !== "undefined"
			? (globalThis as any).env.DB
			: undefined);

	if (!db) {
		throw error(500, "Database binding unavailable");
	}

	let body: { email?: string; name?: string; newPassword?: string };
	try {
		body = await request.json();
	} catch {
		throw error(400, "Invalid JSON body");
	}

	const email = body.email?.trim().toLowerCase();
	const name = body.name?.trim().toLowerCase();
	const newPassword = body.newPassword;

	if (!email || !name || !newPassword) {
		throw error(400, "Email, profile name, and new password are required");
	}

	if (newPassword.length < 6) {
		throw error(400, "Password must be at least 6 characters long");
	}

	// 1. Find user by email
	const userResult = (await db
		.prepare("SELECT id, name, email FROM user WHERE lower(email) = ?1")
		.bind(email)
		.first()) as { id: string; name: string; email: string } | null;

	if (!userResult) {
		throw error(404, "No account found with this email address");
	}

	// 2. Validate profile name matches (case-insensitive)
	if (userResult.name.trim().toLowerCase() !== name) {
		throw error(400, "Profile name does not match the account record");
	}

	// 3. Hash the new password using better-auth's secure hasher
	const hashedPassword = await hashPassword(newPassword);
	const now = Math.floor(Date.now() / 1000);

	// 4. Check if a credential account already exists
	const existingAccount = (await db
		.prepare("SELECT id FROM account WHERE userId = ?1 AND providerId = 'credential'")
		.bind(userResult.id)
		.first()) as { id: string } | null;

	if (existingAccount) {
		await db
			.prepare("UPDATE account SET password = ?1, updatedAt = ?2 WHERE id = ?3")
			.bind(hashedPassword, now, existingAccount.id)
			.run();
	} else {
		const accountId = crypto.randomUUID();
		await db
			.prepare(
				"INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt) VALUES (?1, ?2, 'credential', ?3, ?4, ?5, ?5)"
			)
			.bind(accountId, email, userResult.id, hashedPassword, now)
			.run();
	}

	return json({ ok: true, message: "Password updated successfully" });
};
