// @vitest-environment node
import { webcrypto } from "crypto";
// Node 18 doesn't expose globalThis.crypto by default; jose requires it
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", { value: webcrypto });
}

import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("next/server", () => ({
  NextRequest: class {},
}));

import { createSession, getSession, deleteSession, verifySession } from "@/lib/auth";
import { NextRequest } from "next/server";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createSession", () => {
  test("sets an httpOnly cookie with a JWT token", async () => {
    await createSession("user-1", "test@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const [name, token, options] = mockCookieStore.set.mock.calls[0];
    expect(name).toBe("auth-token");
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // JWT format
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.expires).toBeInstanceOf(Date);
  });

  test("sets expiry approximately 7 days from now", async () => {
    const before = Date.now();
    await createSession("user-1", "test@example.com");
    const after = Date.now();

    const [, , options] = mockCookieStore.set.mock.calls[0];
    const expiresMs = options.expires.getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDays - 1000);
    expect(expiresMs).toBeLessThanOrEqual(after + sevenDays + 1000);
  });
});

describe("getSession", () => {
  test("returns null when no cookie is present", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const session = await getSession();
    expect(session).toBeNull();
  });

  test("returns null for an invalid/tampered token", async () => {
    mockCookieStore.get.mockReturnValue({ value: "not.a.valid.jwt" });
    const session = await getSession();
    expect(session).toBeNull();
  });

  test("returns session payload for a valid token created by createSession", async () => {
    // Capture the token written by createSession
    let capturedToken: string;
    mockCookieStore.set.mockImplementation((_name: string, token: string) => {
      capturedToken = token;
    });

    await createSession("user-42", "alice@example.com");

    // Now simulate reading it back
    mockCookieStore.get.mockReturnValue({ value: capturedToken! });

    const session = await getSession();
    expect(session).not.toBeNull();
    expect(session!.userId).toBe("user-42");
    expect(session!.email).toBe("alice@example.com");
  });
});

describe("deleteSession", () => {
  test("deletes the auth-token cookie", async () => {
    await deleteSession();
    expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
  });
});

describe("verifySession", () => {
  function makeRequest(token?: string): NextRequest {
    return {
      cookies: {
        get: (_name: string) => (token ? { value: token } : undefined),
      },
    } as unknown as NextRequest;
  }

  test("returns null when no cookie is present", async () => {
    const result = await verifySession(makeRequest());
    expect(result).toBeNull();
  });

  test("returns null for an invalid token", async () => {
    const result = await verifySession(makeRequest("bad.token.value"));
    expect(result).toBeNull();
  });

  test("returns session payload for a valid token", async () => {
    let capturedToken: string;
    mockCookieStore.set.mockImplementation((_name: string, token: string) => {
      capturedToken = token;
    });

    await createSession("user-99", "bob@example.com");

    const result = await verifySession(makeRequest(capturedToken!));
    expect(result).not.toBeNull();
    expect(result!.userId).toBe("user-99");
    expect(result!.email).toBe("bob@example.com");
  });
});
