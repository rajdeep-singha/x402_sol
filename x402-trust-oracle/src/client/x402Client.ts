/**
 * x402 Trust Oracle — Client SDK
 *
 * Implements the full x402 payment flow (Image 2):
 *
 *   Sign up → API Request → Server
 *                ↓ (402 Payment Required)
 *            Client sends Solana TX (USDC/SOL)
 *                ↓ (retries with txSignature)
 *            Server verifies TX → Returns Data
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  SendOptions,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
  getMint,
} from "@solana/spl-token";
import axios, { AxiosInstance, AxiosError } from "axios";
import { TrustScore, X402PaymentRequiredResponse, PaymentToken } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WalletAdapter {
  publicKey: PublicKey;
  signTransaction(tx: Transaction): Promise<Transaction>;
}

export interface X402ClientConfig {
  serverUrl: string;
  solanaRpcUrl: string;
  wallet: WalletAdapter;
  preferredToken?: PaymentToken; // default: USDC
}

export interface X402ClientResult<T> {
  data: T;
  txSignature: string;
  token: PaymentToken;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class X402Client {
  private readonly http: AxiosInstance;
  private readonly connection: Connection;
  private readonly wallet: WalletAdapter;
  private readonly preferredToken: PaymentToken;

  constructor(config: X402ClientConfig) {
    this.http = axios.create({ baseURL: config.serverUrl, timeout: 30_000 });
    this.connection = new Connection(config.solanaRpcUrl, "confirmed");
    this.wallet = config.wallet;
    this.preferredToken = config.preferredToken ?? "USDC";
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Fetch trust score for a single wallet.
   * Automatically handles the 402 → pay → retry flow.
   */
  async getTrustScore(
    walletAddress: string
  ): Promise<X402ClientResult<TrustScore>> {
    return this._x402Request<TrustScore>(`/trust/${walletAddress}`);
  }

  /**
   * Fetch trust scores for multiple wallets in one paid request.
   */
  async getBatchTrustScores(
    walletAddresses: string[]
  ): Promise<X402ClientResult<TrustScore[]>> {
    return this._x402Request<TrustScore[]>("/trust/batch", "POST", {
      wallets: walletAddresses,
    });
  }

  // ─── Core x402 Flow ─────────────────────────────────────────────────────────

  /**
   * Executes the full x402 flow:
   *  1. Make initial request → expect 402
   *  2. Parse payment instructions from 402 body
   *  3. Send Solana transaction (SOL or USDC)
   *  4. Retry original request with txSignature header
   */
  private async _x402Request<T>(
    path: string,
    method: "GET" | "POST" = "GET",
    body?: unknown
  ): Promise<X402ClientResult<T>> {
    // ── Step 1: Initial request (expect 402) ──────────────────────────────
    let paymentInstructions: X402PaymentRequiredResponse;

    try {
      const res = await this.http.request({ method, url: path, data: body });
      // If it somehow returns 200 without payment (e.g., dev bypass), return it
      return { data: res.data.data, txSignature: "bypassed", token: this.preferredToken };
    } catch (err) {
      const axiosErr = err as AxiosError<X402PaymentRequiredResponse>;

      if (axiosErr.response?.status !== 402) {
        throw new Error(
          `Unexpected error from server: ${axiosErr.response?.status} ${axiosErr.message}`
        );
      }

      paymentInstructions = axiosErr.response.data;
    }

    // ── Step 2: Determine which token to pay with ─────────────────────────
    const token = this._chooseToken(paymentInstructions);
    const receiver = new PublicKey(paymentInstructions.payment.receiver);

    // ── Step 3: Send Solana transaction ───────────────────────────────────
    const txSignature = await (token === "SOL"
      ? this._sendSol(receiver, paymentInstructions.payment.amount.SOL ?? 0.001)
      : this._sendUsdc(
          receiver,
          paymentInstructions.payment.amount.USDC ?? 1,
          new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
        ));

    // ── Step 4: Retry with txSignature header ─────────────────────────────
    const retryRes = await this.http.request<{ success: boolean; data: T }>({
      method,
      url: path,
      data: body,
      headers: {
        "x-payment-tx": txSignature,
        "x-payment-token": token,
      },
    });

    return { data: retryRes.data.data, txSignature, token };
  }

  // ─── Payment Helpers ────────────────────────────────────────────────────────

  private _chooseToken(instructions: X402PaymentRequiredResponse): PaymentToken {
    const accepted = instructions.payment.token;
    if (accepted.includes(this.preferredToken)) return this.preferredToken;
    return accepted[0]; // fallback to first accepted
  }

  /**
   * Send SOL to receiver and return the confirmed tx signature.
   */
  private async _sendSol(
    receiver: PublicKey,
    amount: number
  ): Promise<string> {
    const lamports = Math.round(amount * LAMPORTS_PER_SOL);
    const { blockhash } = await this.connection.getLatestBlockhash();

    const tx = new Transaction({
      recentBlockhash: blockhash,
      feePayer: this.wallet.publicKey,
    }).add(
      SystemProgram.transfer({
        fromPubkey: this.wallet.publicKey,
        toPubkey: receiver,
        lamports,
      })
    );

    return this._signAndSend(tx);
  }

  /**
   * Send USDC (SPL token) to receiver and return the confirmed tx signature.
   */
  private async _sendUsdc(
    receiver: PublicKey,
    amount: number,
    usdcMint: PublicKey
  ): Promise<string> {
    const mintInfo = await getMint(this.connection, usdcMint);
    const rawAmount = BigInt(Math.round(amount * 10 ** mintInfo.decimals));

    const senderAta = await getAssociatedTokenAddress(
      usdcMint,
      this.wallet.publicKey
    );
    const receiverAta = await getAssociatedTokenAddress(usdcMint, receiver);

    const { blockhash } = await this.connection.getLatestBlockhash();

    const tx = new Transaction({
      recentBlockhash: blockhash,
      feePayer: this.wallet.publicKey,
    }).add(
      createTransferCheckedInstruction(
        senderAta,
        usdcMint,
        receiverAta,
        this.wallet.publicKey,
        rawAmount,
        mintInfo.decimals
      )
    );

    return this._signAndSend(tx);
  }

  /**
   * Sign a transaction with the wallet adapter and broadcast it.
   */
  private async _signAndSend(tx: Transaction): Promise<string> {
    const signed = await this.wallet.signTransaction(tx);
    const opts: SendOptions = { skipPreflight: false };
    const signature = await this.connection.sendRawTransaction(
      signed.serialize(),
      opts
    );

    // Wait for confirmation before retrying the API
    await this.connection.confirmTransaction(signature, "confirmed");
    return signature;
  }
}
