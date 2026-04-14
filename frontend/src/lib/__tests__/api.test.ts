import { authAPI, clearTokens, loadTokens, setTokens } from "@/lib/api";

describe("api auth client", () => {
  beforeEach(() => {
    clearTokens();
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  it("persists and reloads tokens from sessionStorage", () => {
    setTokens({ access: "a1", refresh: "r1" });
    clearTokens();

    expect(sessionStorage.getItem("cq_access")).toBeNull();
    expect(sessionStorage.getItem("cq_refresh")).toBeNull();

    setTokens({ access: "a2", refresh: "r2" });
    loadTokens();

    expect(sessionStorage.getItem("cq_access")).toBe("a2");
    expect(sessionStorage.getItem("cq_refresh")).toBe("r2");
  });

  it("sends bearer token for authenticated requests", async () => {
    setTokens({ access: "access-token", refresh: "refresh-token" });

    const fetchMock = jest
      .spyOn(global, "fetch" as never)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 1,
          username: "alice",
          email: "alice@example.com",
          avatar_url: "",
          favorite_genres: [],
          country_code: "US",
          date_joined: "2026-01-01T00:00:00Z",
        }),
      } as Response);

    await authAPI.getProfile();

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>).Authorization).toBe(
      "Bearer access-token"
    );
  });

  it("refreshes token and retries once on 401", async () => {
    setTokens({ access: "expired-access", refresh: "valid-refresh" });

    const fetchMock = jest
      .spyOn(global, "fetch" as never)
      .mockResolvedValueOnce({ ok: false, status: 401 } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access: "new-access" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 1,
          username: "alice",
          email: "alice@example.com",
          avatar_url: "",
          favorite_genres: [],
          country_code: "US",
          date_joined: "2026-01-01T00:00:00Z",
        }),
      } as Response);

    const profile = await authAPI.getProfile();

    expect(profile.username).toBe("alice");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sessionStorage.getItem("cq_access")).toBe("new-access");
  });
});
