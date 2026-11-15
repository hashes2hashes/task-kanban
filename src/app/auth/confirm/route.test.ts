// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

// 外部依存（Supabase）だけをモックする。
const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

function createFakeAuth(error: { message: string } | null = null) {
  const auth = {
    exchangeCodeForSession: vi.fn().mockResolvedValue({ data: {}, error }),
    verifyOtp: vi.fn().mockResolvedValue({ data: {}, error }),
  };
  createClientMock.mockResolvedValue({ auth });
  return auth;
}

function requestTo(query: string) {
  return new NextRequest(`http://localhost:3000/auth/confirm${query}`);
}

function redirectedTo(response: Response) {
  return response.headers.get("location");
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("GET /auth/confirm", () => {
  it("既定テンプレートのリンク（code 付き）だと、セッションに交換してトップへリダイレクトする", async () => {
    const auth = createFakeAuth();

    const response = await GET(requestTo("?code=abc"));

    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(redirectedTo(response)).toBe("http://localhost:3000/");
  });

  it("code の交換に失敗すると、ログイン画面へ確認エラー付きでリダイレクトする", async () => {
    createFakeAuth({ message: "invalid flow state" });

    const response = await GET(requestTo("?code=abc"));

    expect(redirectedTo(response)).toBe("http://localhost:3000/login?error=confirm");
  });

  it("token_hash と type 付きだと、verifyOtp で確認してトップへリダイレクトする", async () => {
    const auth = createFakeAuth();

    const response = await GET(requestTo("?token_hash=hash&type=email"));

    expect(auth.verifyOtp).toHaveBeenCalledWith({ type: "email", token_hash: "hash" });
    expect(redirectedTo(response)).toBe("http://localhost:3000/");
  });

  it("verifyOtp に失敗すると、ログイン画面へ確認エラー付きでリダイレクトする", async () => {
    createFakeAuth({ message: "Token has expired or is invalid" });

    const response = await GET(requestTo("?token_hash=hash&type=email"));

    expect(redirectedTo(response)).toBe("http://localhost:3000/login?error=confirm");
  });

  it("token_hash だけで type がないと、Supabase を呼ばずにログイン画面へリダイレクトする", async () => {
    const response = await GET(requestTo("?token_hash=hash"));

    expect(createClientMock).not.toHaveBeenCalled();
    expect(redirectedTo(response)).toBe("http://localhost:3000/login?error=confirm");
  });

  it("Supabase からエラー付きで戻されると、Supabase を呼ばずにログイン画面へリダイレクトする", async () => {
    const response = await GET(
      requestTo("?error=access_denied&error_code=otp_expired&error_description=expired"),
    );

    expect(createClientMock).not.toHaveBeenCalled();
    expect(redirectedTo(response)).toBe("http://localhost:3000/login?error=confirm");
  });
});
