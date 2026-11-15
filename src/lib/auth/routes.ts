/** ログインしていなくても開けるパス。 */
const publicPaths = ["/login", "/signup", "/forgot-password"];
/** ログイン済みなら開く必要のないパス（トップへ戻す）。 */
const guestOnlyPaths = ["/login", "/signup", "/forgot-password"];

function isPublicPath(pathname: string): boolean {
  return publicPaths.includes(pathname) || pathname.startsWith("/auth/");
}

/**
 * ログイン状態とパスから、リダイレクト先を決める。リダイレクト不要なら null。
 * - 未ログインで公開パス以外 → /login
 * - ログイン済みでログイン・新規登録・再設定の申請画面 → /
 * /reset-password は再設定リンクでログインした状態で開くため、公開パスにしない。
 */
export function getAuthRedirect(pathname: string, isSignedIn: boolean): string | null {
  if (!isSignedIn && !isPublicPath(pathname)) return "/login";
  if (isSignedIn && guestOnlyPaths.includes(pathname)) return "/";
  return null;
}
