import fetch from "node-fetch";
import { decodePaymentResponseHeader } from "@x402/fetch";
import { GoldRushClient } from "@covalenthq/client-sdk";
import { WalletAdapter } from "../client/x402Client";

export const goldrushClient = new GoldRushClient(process.env.GOLDRUSH_API_KEY!);
const GOLDRUSH_X402_BASE = "https://x402.goldrush.dev";

export async function goldrushX402Fetch(path: string, wallet: WalletAdapter) {
  // First attempt — will get 402
  let res = await fetch(`${GOLDRUSH_X402_BASE}${path}`);

  if (res.status === 402) {
    // Decode payment requirements from response header
    const paymentHeader = res.headers.get("x-payment-required");
    if (paymentHeader) {
      const paymentData = decodePaymentResponseHeader(paymentHeader);
      // TODO: Implement payment signing with wallet
      // For now, return the payment data to client
      console.log("Payment required:", paymentData);
    }
  }

  return res.json();
}