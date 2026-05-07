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
import { logger } from "../utils/logger";
import { CONSTANTS } from "../config/constants";
import { WalletMetadata, ParsedTransaction, TokenAccount } from "../types";
import {
  getGoldRushTokenBalances,
  getGoldRushTransactions,
} from "../libs/goldrush";

const GOLDRUSH_SOLANA_CHAIN = "solana-mainnet";

interface GoldRushBalanceItem {
  contract_address?: string;
  contract_decimals?: number;
  contract_ticker_symbol?: string;
  balance?: string | number;
  quote?: number | null;
}

interface GoldRushBalancesResponse {
  data?: {
    address?: string;
    items?: GoldRushBalanceItem[];
  };
}

interface GoldRushTransactionItem {
  tx_hash?: string;
  block_signed_at?: string;
  block_height?: number;
  fees_paid?: string | number | null;
  successful?: boolean;
  log_events?: Array<{
    decoded?: {
      name?: string;
      params?: Array<{ name?: string; value?: unknown }>;
    } | null;
  }>;
}

interface GoldRushTransactionsResponse {
  data?: {
    items?: GoldRushTransactionItem[];
  };
}

// Simple request queue to prevent rate limiting
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = false;
  private delayMs = 500; // 500ms between RPC calls

  async add<T>(fn: () => Promise<T>, retries = 4): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        let attempt = 0;
        while (attempt <= retries) {
          try {
            const result = await fn();
            resolve(result);
            return;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            const is429 = msg.includes("429") || msg.includes("Too Many Requests");
            if (is429 && attempt < retries) {
              const backoff = Math.min(1000 * 2 ** attempt, 16000);
              logger.debug(`Rate limited, retrying in ${backoff}ms (attempt ${attempt + 1}/${retries})`);
              await this.delay(backoff);
              attempt++;
            } else {
              reject(err);
              return;
            }
          }
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.running || this.queue.length === 0) return;
    this.running = true;

    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        await fn();
        await this.delay(this.delayMs);
      }
    }

    this.running = false;
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

const requestQueue = new RequestQueue();

class BlockchainService {
 // Fetch wallet metadata: balance, token accounts, first-tx date.
   
  async getWalletMetadata(walletAddress: string): Promise<WalletMetadata> {
    try {
      return await this._fetchMetadataViaGoldRush(walletAddress);
    } catch (err) {
      logger.warn(
        `GoldRush metadata fetch failed, falling back to Solana RPC: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const connection = getSolanaConnection();
    const pubkey = new PublicKey(walletAddress);

    logger.debug(`Fetching wallet metadata: ${walletAddress.slice(0, 8)}…`);

    // Queue requests sequentially to avoid rate limits
    const lamportBalance = await requestQueue.add(() => 
      connection.getBalance(pubkey)
    );

    const tokenAccountsRaw = await requestQueue.add(() =>
      connection.getParsedTokenAccountsByOwner(pubkey, {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      })
    );

    const signatures = await requestQueue.add(() =>
      connection.getSignaturesForAddress(pubkey, { limit: 1000 })
    );

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
    try {
      return await this._fetchTransactionsViaGoldRush(walletAddress, limit);
    } catch (err) {
      logger.warn(
        `GoldRush transaction fetch failed, falling back to existing providers: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    if (isHeliusEnabled()) {
      return this._fetchViaHelius(walletAddress, limit);
    }
    return this._fetchViaRpc(walletAddress, limit);
  }

  private async _fetchMetadataViaGoldRush(
    walletAddress: string
  ): Promise<WalletMetadata> {
    logger.debug(`Using GoldRush x402 for wallet metadata: ${walletAddress.slice(0, 8)}…`);

    const balances = await getGoldRushTokenBalances(
      GOLDRUSH_SOLANA_CHAIN,
      walletAddress
    ) as GoldRushBalancesResponse;

    const items = balances.data?.items ?? [];
    const tokenAccounts: TokenAccount[] = items
      .filter((item) => item.contract_address)
      .map((item) => {
        const decimals = item.contract_decimals ?? 0;
        const rawBalance = Number(item.balance ?? 0);
        return {
          mint: item.contract_address!,
          balance: decimals > 0 ? rawBalance / 10 ** decimals : rawBalance,
          decimals,
          symbol: item.contract_ticker_symbol,
        };
      });

    const solAccount = tokenAccounts.find((account) =>
      ["SOL", "WSOL"].includes(account.symbol ?? "")
    );
    const solBalance = solAccount?.balance ?? 0;

    return {
      address: balances.data?.address ?? walletAddress,
      lamportBalance: Math.round(solBalance * LAMPORTS_PER_SOL),
      solBalance,
      tokenAccounts,
      firstTransactionAt: undefined,
      totalTransactions: 0,
    };
  }

  private async _fetchTransactionsViaGoldRush(
    walletAddress: string,
    limit: number
  ): Promise<ParsedTransaction[]> {
    logger.debug(`Using GoldRush x402 for tx fetch: ${walletAddress.slice(0, 8)}…`);

    const response = await getGoldRushTransactions(
      GOLDRUSH_SOLANA_CHAIN,
      walletAddress,
      "small"
    ) as GoldRushTransactionsResponse;

    const items = response.data?.items ?? [];
    return items.slice(0, limit).map((tx) => this._mapGoldRushTx(tx));
  }

  private _mapGoldRushTx(tx: GoldRushTransactionItem): ParsedTransaction {
    const tokenTransfer = this._findGoldRushTokenTransfer(tx);

    return {
      signature: tx.tx_hash ?? "",
      blockTime: tx.block_signed_at
        ? Math.floor(new Date(tx.block_signed_at).getTime() / 1000)
        : 0,
      slot: tx.block_height ?? 0,
      fee: Number(tx.fees_paid ?? 0),
      status: tx.successful === false ? "failed" : "success",
      type: tokenTransfer ? "transfer" : "other",
      fromAddress: tokenTransfer?.fromAddress,
      toAddress: tokenTransfer?.toAddress,
      amount: tokenTransfer?.amount,
      tokenMint: tokenTransfer?.tokenMint,
    };
  }

  private _findGoldRushTokenTransfer(tx: GoldRushTransactionItem):
    | {
        fromAddress?: string;
        toAddress?: string;
        amount?: number;
        tokenMint?: string;
      }
    | undefined {
    for (const event of tx.log_events ?? []) {
      if (event.decoded?.name?.toLowerCase() !== "transfer") continue;

      const params = event.decoded.params ?? [];
      const getParam = (name: string) =>
        params.find((param) => param.name?.toLowerCase() === name)?.value;

      return {
        fromAddress: String(getParam("from") ?? ""),
        toAddress: String(getParam("to") ?? ""),
        amount: Number(getParam("value") ?? 0),
      };
    }

    return undefined;
  }

  private async _fetchViaRpc(
    walletAddress: string,
    limit: number
  ): Promise<ParsedTransaction[]> {
    const connection = getSolanaConnection();
    const pubkey = new PublicKey(walletAddress);

    logger.debug(`Fetching ${limit} tx signatures via RPC: ${walletAddress.slice(0, 8)}…`);

    // Use getSignaturesForAddress only — it works on public RPC without rate limiting.
    // getParsedTransactions is heavily throttled on public devnet/mainnet RPC nodes.
    const sigs = await requestQueue.add(() =>
      connection.getSignaturesForAddress(pubkey, { limit })
    );

    if (!sigs.length) return [];

    logger.debug(`Got ${sigs.length} signatures for ${walletAddress.slice(0, 8)}…`);

    // Map signature info directly to ParsedTransaction.
    // ConfirmedSignatureInfo includes: signature, slot, blockTime, err (null = success).
    return sigs.map((sig) => ({
      signature: sig.signature,
      blockTime: sig.blockTime ?? 0,
      slot: sig.slot,
      fee: 0,
      status: sig.err === null ? ("success" as const) : ("failed" as const),
      type: "other" as const,
      fromAddress: undefined,
      toAddress: undefined,
      amount: undefined,
      tokenMint: undefined,
    }));
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
