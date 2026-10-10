import { describe, expect, it } from "vitest";
import { GET as getResend } from "./auth/resend/route";
import { GET as getSignup } from "./auth/signup/route";
import { GET as getVerifyOtp } from "./auth/verify-otp/route";
import { GET as getViajes } from "./viajes/route";

/** Los 405 informan el método permitido (RFC 9110 §15.5.6). */
describe("405 — cabecera Allow", () => {
  it("resend/signup/verify-otp/viajes responden 405 + Allow: POST", async () => {
    for (const get of [getResend, getSignup, getVerifyOtp, getViajes]) {
      const res = await get();
      expect(res.status).toBe(405);
      expect(res.headers.get("Allow")).toBe("POST");
    }
  });
});
