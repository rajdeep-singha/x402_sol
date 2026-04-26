import {
  ParsedTransactionWithMeta,
  ParsedInstruction,
  PartiallyDecodedInstruction,
} from "@solana/web3.js";
import { ParsedTransaction } from "../types";
import { logger } from "./logger";

const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";

/**
 * Classify a transaction type from its instructions.
 */
function classifyTransaction(
  tx: ParsedTransactionWithMeta
): ParsedTransaction["type"] {
  const instructions =
    tx.transaction.message.instructions as (
      | ParsedInstruction
      | PartiallyDecodedInstruction
    )[];

  for (const ix of instructions) {
    if (!("parsed" in ix)) continue;
    const parsed = ix as ParsedInstruction;

    if (parsed.program === "system" && parsed.parsed?.type === "transfer") {
      return "transfer";
    }
    if (
      parsed.program === "spl-token" &&
      parsed.parsed?.type === "transferChecked"
    ) {
      return "transfer";
    }
    if (
      parsed.program === "spl-token" &&
      parsed.parsed?.type === "mintTo"
    ) {
      return "mint";
    }
    if (parsed.program === "spl-token" && parsed.parsed?.type === "burn") {
      return "burn";
    }
  }

  // Heuristic: multiple programs = likely a swap
  const programs = new Set(
    instructions.map((ix) =>
      "programId" in ix ? ix.programId.toBase58() : (ix as ParsedInstruction).program
    )
  );
  if (
    programs.size > 2 &&
    !programs.has(SYSTEM_PROGRAM_ID) &&
    !programs.has(TOKEN_PROGRAM_ID)
  ) {
    return "swap";
  }

  return "other";
}

/**
 * Extract transfer details (from/to/amount) from a parsed transaction.
 */
function extractTransferDetails(tx: ParsedTransactionWithMeta): {
  fromAddress?: string;
  toAddress?: string;
  amount?: number;
  tokenMint?: string;
} {
  const instructions =
    tx.transaction.message.instructions as (
      | ParsedInstruction
      | PartiallyDecodedInstruction
    )[];

  for (const ix of instructions) {
    if (!("parsed" in ix)) continue;
    const parsed = ix as ParsedInstruction;

    if (parsed.program === "system" && parsed.parsed?.type === "transfer") {
      return {
        fromAddress: parsed.parsed.info?.source,
        toAddress: parsed.parsed.info?.destination,
        amount: parsed.parsed.info?.lamports,
      };
    }

    if (
      parsed.program === "spl-token" &&
      parsed.parsed?.type === "transferChecked"
    ) {
      return {
        fromAddress: parsed.parsed.info?.source,
        toAddress: parsed.parsed.info?.destination,
        amount: parsed.parsed.info?.tokenAmount?.uiAmount,
        tokenMint: parsed.parsed.info?.mint,
      };
    }
  }

  return {};
}

/**
 * Convert a raw Solana ParsedTransactionWithMeta into a clean ParsedTransaction.
 */
export function parseSolanaTransaction(
  raw: ParsedTransactionWithMeta,
  signature: string
): ParsedTransaction | null {
  try {
    const { fromAddress, toAddress, amount, tokenMint } =
      extractTransferDetails(raw);

    return {
      signature,
      blockTime: raw.blockTime ?? 0,
      slot: raw.slot,
      fee: raw.meta?.fee ?? 0,
      status: raw.meta?.err ? "failed" : "success",
      type: classifyTransaction(raw),
      fromAddress,
      toAddress,
      amount,
      tokenMint,
    };
  } catch (err) {
    logger.warn(`Failed to parse transaction ${signature}:`, err);
    return null;
  }
}

/**
 * Parse a batch of raw transactions, silently dropping unparseable ones.
 */
export function parseSolanaTransactions(
  raws: (ParsedTransactionWithMeta | null)[],
  signatures: string[]
): ParsedTransaction[] {
  return raws
    .map((raw, i) =>
      raw ? parseSolanaTransaction(raw, signatures[i]) : null
    )
    .filter((tx): tx is ParsedTransaction => tx !== null);
}
