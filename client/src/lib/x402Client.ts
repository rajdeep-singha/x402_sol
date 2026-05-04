
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
  getMint,
} from "@solana/spl-token";
import axios, { AxiosError } from "axios";
import type {
  TrustScore,
  TrustQueryResponse,
  X402PaymentRequiredResponse,
  PaymentToken,
  PaymentFlowState,
} from "@/types";
import { CONFIG } from "./constants";

// ─── Wallet Adapter interface (subset we need) ────────────────────────────────
export interface WalletAdapter {
  publicKey: PublicKey | null;
  signTransaction: ((tx: Transaction) => Promise<Transaction>) | undefined;
}

// ─── Step callback so the UI can react to each phase ─────────────────────────
type OnStep = (state: PaymentFlowState) => void;

export class X402Client {
  private readonly connection: Connection;

  constructor() {
    this.connection = new Connection(CONFIG.SOLANA_RPC_URL, "confirmed");
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  async getTrustScore(
    walletAddress: string,
    wallet: WalletAdapter,
    token: PaymentToken,
    onStep: OnStep
  ): Promise<TrustScore> {
    return this._x402Flow(`/trust/${walletAddress}`, "GET", undefined, wallet, token, onStep);
  }

  async getBatchTrustScores(
    walletAddresses: string[],
    wallet: WalletAdapter,
    token: PaymentToken,
    onStep: OnStep
  ): Promise<TrustScore[]> {
    return this._x402Flow(
      "/trust/batch",
      "POST",
      { wallets: walletAddresses },
      wallet,
      token,
      onStep
    );
  }

  // ─── Core x402 Flow ─────────────────────────────────────────────────────────

  private async _x402Flow<T>(
    path: string,
    method: "GET" | "POST",
    body: unknown,
    wallet: WalletAdapter,
    token: PaymentToken,
    onStep: OnStep
  ): Promise<T> {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error("Wallet not connected");
    }

    // ── Step 1: Initial request → expect 402 ─────────────────────────────
    onStep({ step: "requesting" });

    let paymentInstructions: X402PaymentRequiredResponse;

    try {
      const res = await axios.request<TrustQueryResponse>({
        method,
        url: `${CONFIG.API_BASE_URL}${path}`,
        data: body,
      });
      // Dev bypass or cached — returned 200 directly
      return (res.data as unknown as { data: T }).data;
    } catch (err) {
      const axiosErr = err as AxiosError<X402PaymentRequiredResponse>;
      if (axiosErr.response?.status !== 402) {
        throw new Error(axiosErr.response?.data?.error ?? axiosErr.message);
      }
      paymentInstructions = axiosErr.response.data;
    }

    // ── Step 2: Show payment required ─────────────────────────────────────
    onStep({ step: "payment_required", paymentInstructions, token });

    const receiver = new PublicKey(paymentInstructions.payment.receiver);

    // ── Step 3: Send Solana transaction ───────────────────────────────────
    onStep({ step: "sending_tx", token });

    const txSignature = await (token === "SOL"
      ? this._sendSol(receiver, paymentInstructions.payment.amount.SOL ?? 0.001, wallet)
      : this._sendUsdc(
          receiver,
          paymentInstructions.payment.amount.USDC ?? 1,
          new PublicKey(CONFIG.USDC_MINT_DEVNET),
          wallet
        ));

    // ── Step 4: Wait for confirmation ─────────────────────────────────────
    onStep({ step: "confirming_tx", txSignature, token });
    await this.connection.confirmTransaction(txSignature, "confirmed");

    // ── Step 5: Retry with payment proof ─────────────────────────────────
    onStep({ step: "verifying", txSignature, token });

    const retryRes = await axios.request<TrustQueryResponse>({
      method,
      url: `${CONFIG.API_BASE_URL}${path}`,
      data: body,
      headers: {
        [CONFIG.PAYMENT_HEADERS.TX]:    txSignature,
        [CONFIG.PAYMENT_HEADERS.TOKEN]: token,
      },
    });

    onStep({ step: "success", txSignature, token });
    return (retryRes.data as unknown as { data: T }).data;
  }

  // ─── Payment helpers ──────────────────────────────────────────────────────

  private async _sendSol(
    receiver: PublicKey,
    amount: number,
    wallet: WalletAdapter
  ): Promise<string> {
    const lamports = Math.round(amount * LAMPORTS_PER_SOL);
    const { blockhash } = await this.connection.getLatestBlockhash();

    const tx = new Transaction({ recentBlockhash: blockhash, feePayer: wallet.publicKey! }).add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey!,
        toPubkey: receiver,
        lamports,
      })
    );

    return this._signAndSend(tx, wallet);
  }

  private async _sendUsdc(
    receiver: PublicKey,
    amount: number,
    usdcMint: PublicKey,
    wallet: WalletAdapter
  ): Promise<string> {
    const mintInfo = await getMint(this.connection, usdcMint);
    const rawAmount = BigInt(Math.round(amount * 10 ** mintInfo.decimals));

    const senderAta  = await getAssociatedTokenAddress(usdcMint, wallet.publicKey!);
    const receiverAta = await getAssociatedTokenAddress(usdcMint, receiver);
    const { blockhash } = await this.connection.getLatestBlockhash();

    const tx = new Transaction({ recentBlockhash: blockhash, feePayer: wallet.publicKey! }).add(
      createTransferCheckedInstruction(
        senderAta, usdcMint, receiverAta,
        wallet.publicKey!, rawAmount, mintInfo.decimals
      )
    );

    return this._signAndSend(tx, wallet);
  }

  private async _signAndSend(tx: Transaction, wallet: WalletAdapter): Promise<string> {
    const signed = await wallet.signTransaction!(tx);
    return this.connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  }
}

// Singleton
export const x402Client = new X402Client();