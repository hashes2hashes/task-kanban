import type { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type SignedInUser = { id: string; email: string | null };

/**
 * ログイン中のユーザーを返す。未ログイン・トークンが無効なら null。
 * getClaims() はトークンの署名を検証するので、Cookie の改ざんでは通らない。
 */
export async function getSignedInUser(
  supabase: ServerSupabaseClient,
): Promise<SignedInUser | null> {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  const { sub, email } = data.claims;
  return { id: sub, email: typeof email === "string" ? email : null };
}
