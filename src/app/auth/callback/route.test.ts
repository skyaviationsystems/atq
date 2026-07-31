import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./route";

const callbackUrl = new URL("https://atq.example.test/auth/callback");

describe("safeRedirectPath", () => {
    it("preserves same-origin application paths", () => {
        expect(safeRedirectPath(callbackUrl, "/records?person=SYN-1001#timeline")).toBe("/records?person=SYN-1001#timeline");
    });

    it.each([null, "", "https://evil.example", "//evil.example", "/\\evil.example", "/%5Cevil.example"])("falls back for unsafe candidate %s", (candidate) => {
        expect(safeRedirectPath(callbackUrl, candidate)).toBe("/operations");
    });
});
