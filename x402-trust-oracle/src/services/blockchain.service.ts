import {
  PublicKey,
  ParsedTransactionWithMeta,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { getSolanaConnection } from "../libs/solana";
import {
  fetchHeliusTransactions,
  isHeliusEnabled,
  HeliusEnrichedTransaction,
} from "../libs/helius";
import { parseSolanaTransactions } from "../utils/parser";
import { logger } from "../utils/logger";
import { CONSTANTS } from "../config/constants";
import { WalletMetadata, ParsedTransaction, TokenAccount } from "../types";
import { goldrushClient } from "../libs/goldrush";

class BlockchainService {
 // Fetch wallet metadata: balance, token accounts, first-tx date.
   
  async getWalletMetadata(walletAddress: string): Promise<WalletMetadata> {
    const connection = getSolanaConnection();
    const pubkey = new PublicKey(walletAddress);

    logger.debug(`Fetching wallet metadata: ${walletAddress.slice(0, 8)}…`);

    const [lamportBalance, tokenAccountsRaw, signatures] = await Promise.all([
      connection.getBalance(pubkey),
      connection.getParsedTokenAccountsByOwner(pubkey, {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      }),
      connection.getSignaturesForAddress(pubkey, { limit: 1000 }),
    ]);

    const tokenAccounts: TokenAccount[] = tokenAccountsRaw.value.map((ta) => {
      const info = ta.account.data.parsed.info;
      return {
        mint: info.mint,
        balance: info.tokenAmount.uiAmount ?? 0,
        decimals: info.tokenAmount.decimals,
      };
    });

    // Oldest signature is last in the array
    const firstTx = signatures.at(-1);
    const firstTransactionAt = firstTx?.blockTime
      ? firstTx.blockTime * 1000
      : undefined;

    return {
      address: walletAddress,
      lamportBalance,
      solBalance: lamportBalance / LAMPORTS_PER_SOL,
      tokenAccounts,
      firstTransactionAt,
      totalTransactions: signatures.length,
    };
  }

  /**
   * Fetch and parse recent transactions for a wallet.
   * Uses Helius enriched API if available; falls back to raw RPC.
   */
  async getWalletTransactions(
    walletAddress: string,
    limit = CONSTANTS.TRUST.TX_HISTORY_LIMIT
  ): Promise<ParsedTransaction[]> {
    if (isHeliusEnabled()) {
      return this._fetchViaHelius(walletAddress, limit);
    }
    return this._fetchViaRpc(walletAddress, limit);
  }

  private async _fetchViaRpc(
    walletAddress: string,
    limit: number
  ): Promise<ParsedTransaction[]> {
    const connection = getSolanaConnection();
    const pubkey = new PublicKey(walletAddress);

    logger.debug(`Fetching ${limit} txs via RPC: ${walletAddress.slice(0, 8)}…`);

    const sigs = await connection.getSignaturesForAddress(pubkey, { limit });
    if (!sigs.length) return [];

    const signatures = sigs.map((s) => s.signature);

    // Fetch in batches of 10 to avoid RPC limits
    const batchSize = 10;
    const allRaw: (ParsedTransactionWithMeta | null)[] = [];

    for (let i = 0; i < signatures.length; i += batchSize) {
      const batch = signatures.slice(i, i + batchSize);
      const results = await connection.getParsedTransactions(batch, {
        maxSupportedTransactionVersion: 0,
      });
      allRaw.push(...results);
    }

    return parseSolanaTransactions(allRaw, signatures);
  }

  // Private Helpers 

  private async _fetchViaHelius(
    walletAddress: string,
    limit: number
  ): Promise<ParsedTransaction[]> {
    logger.debug(`Using Helius for tx fetch: ${walletAddress.slice(0, 8)}…`);
    const enriched = await fetchHeliusTransactions(walletAddress, limit);

    if (!enriched) {
      logger.warn("Helius returned null, falling back to RPC");
      return this._fetchViaRpc(walletAddress, limit);
    }

    return this._mapHeliusToParsed(enriched);
  } 



  private _mapHeliusToParsed(
    enriched: HeliusEnrichedTransaction[]
  ): ParsedTransaction[] {
    return enriched.map((tx) => {
      const nativeTransfer = tx.nativeTransfers?.[0];
      const tokenTransfer = tx.tokenTransfers?.[0];

      return {
        signature: tx.signature,
        blockTime: tx.timestamp,
        slot: 0, // Helius doesn't return slot directly
        fee: tx.fee,
        status: "success" as const,
        type: (tx.type?.toLowerCase() ?? "other") as ParsedTransaction["type"],
        fromAddress: nativeTransfer?.fromUserAccount ?? tokenTransfer?.fromUserAccount,
        toAddress: nativeTransfer?.toUserAccount ?? tokenTransfer?.toUserAccount,
        amount: nativeTransfer?.amount ?? tokenTransfer?.tokenAmount,
        tokenMint: tokenTransfer?.mint,
      };
    });
  }


  async getTransaction(
    signature: string
  ): Promise<ParsedTransactionWithMeta | null> {
    const connection = getSolanaConnection();

    try {
      const tx = await connection.getParsedTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      return tx;
    } catch (err) {
      logger.error(`Failed to fetch tx ${signature.slice(0, 16)}…:`, err);
      return null;
    }
  }
}

export const blockchainService = new BlockchainService();
