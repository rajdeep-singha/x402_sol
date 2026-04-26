/**
 * Integration-style tests for paymentMiddleware.
 * Uses supertest + jest mocks.
 */

import express from "express";
import request from "supertest";
import { paymentMiddleware } from "../middleware/payment.middleware";
import * as paymentServiceModule from "../services/payment.service";

// ─── Mock paymentService ──────────────────────────────────────────────────────

jest.mock("../services/payment.service", () => ({
  paymentService: {
    validatePayment: jest.fn(),
  },
}));

const mockValidate = paymentServiceModule.paymentService
  .validatePayment as jest.MockedFunction<
  typeof paymentServiceModule.paymentService.validatePayment
>;

// ─── Test app ─────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.get("/protected", paymentMiddleware, (_req, res) => {
  res.status(200).json({ success: true, message: "Access granted" });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("paymentMiddleware", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns 402 when no payment header is present", async () => {
    const res = await request(app).get("/protected");
    expect(res.status).toBe(402);
    expect(res.body.error).toBe("Payment Required");
    expect(res.body.payment).toBeDefined();
  });

  it("returns 402 when token header is missing", async () => {
    const res = await request(app)
      .get("/protected")
      .set("x-payment-tx", "some_signature");

    expect(res.status).toBe(402);
  });

  it("returns 402 when payment validation fails", async () => {
    mockValidate.mockResolvedValueOnce({
      valid: false,
      reason: "Transaction not found on-chain",
    });

    const res = await request(app)
      .get("/protected")
      .set("x-payment-tx", "bad_sig")
      .set("x-payment-token", "USDC");

    expect(res.status).toBe(402);
    expect(res.body.message).toContain("Transaction not found");
  });

  it("calls next() and returns 200 when payment is valid", async () => {
    mockValidate.mockResolvedValueOnce({
      valid: true,
      txSignature: "valid_sig_abc",
      amount: 1,
      token: "USDC",
    });

    const res = await request(app)
      .get("/protected")
      .set("x-payment-tx", "valid_sig_abc")
      .set("x-payment-token", "USDC");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Access granted");
    expect(mockValidate).toHaveBeenCalledWith("valid_sig_abc", "USDC");
  });

  it("accepts SOL as a valid payment token", async () => {
    mockValidate.mockResolvedValueOnce({
      valid: true,
      txSignature: "sol_sig_xyz",
      amount: 0.001,
      token: "SOL",
    });

    const res = await request(app)
      .get("/protected")
      .set("x-payment-tx", "sol_sig_xyz")
      .set("x-payment-token", "sol"); // lowercase should be normalized

    expect(res.status).toBe(200);
  });
});
