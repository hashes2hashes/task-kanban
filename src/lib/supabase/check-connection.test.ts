import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkSupabaseConnection } from "./check-connection";

const testUrl = "https://example.supabase.co";
const testKey = "sb_publishable_test";

describe("checkSupabaseConnection", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", testUrl);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", testKey);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("ヘルスチェックが 200 を返すと、接続成功として URL を返す", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSupabaseConnection();

    expect(result).toEqual({ ok: true, url: testUrl });
    const [requestUrl, init] = fetchMock.mock.calls[0];
    expect(String(requestUrl)).toBe(`${testUrl}/auth/v1/health`);
    expect(init.headers).toEqual({ apikey: testKey });
  });

  it("API キーが不正で 401 が返ると、接続失敗としてステータスを理由に含める", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("", { status: 401, statusText: "Unauthorized" }),
      ),
    );

    const result = await checkSupabaseConnection();

    expect(result).toEqual({ ok: false, reason: "HTTP 401 Unauthorized" });
  });

  it("ネットワークエラーが起きると、接続失敗としてエラーメッセージを理由に含める", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));

    const result = await checkSupabaseConnection();

    expect(result).toEqual({ ok: false, reason: "fetch failed" });
  });

  it("URL が未設定だと、通信せずに未設定の変数名を理由として返す", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSupabaseConnection();

    expect(result).toEqual({
      ok: false,
      reason: "Supabase の環境変数が未設定です: NEXT_PUBLIC_SUPABASE_URL",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("URL とキーの両方が未設定だと、両方の変数名を理由として返す", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const result = await checkSupabaseConnection();

    expect(result).toEqual({
      ok: false,
      reason:
        "Supabase の環境変数が未設定です: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    });
  });
});
