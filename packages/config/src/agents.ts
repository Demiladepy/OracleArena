// Values reflect Somnia Agents explorer as of May 2026.
// Authoritative source: https://agents.testnet.somnia.network
// Prices are in STT with 18 decimals (same unit as ether / 1e18).

import { somniaContracts } from './somnia';

/** Live SomniaAgents platform contract on testnet */
export const platformContract = somniaContracts.platformContract;

/** Somnia platform agent IDs */
export const agentIds = {
  jsonApi: 13174292974160097713n,
  llmInference: 12847293847561029384n,
  llmParseWebsite: 12875401142070969085n,
} as const;

/**
 * Per-validator pricing in STT (18 decimals).
 * Documented as "ether equivalent" in dev guide — on Somnia testnet this is STT.
 */
export const agentPricing = {
  /** 0.07 STT per validator */
  llmInferencePerValidator: 70_000_000_000_000_000n,
  /** 0.03 STT per validator */
  jsonApiPerValidator: 30_000_000_000_000_000n,
  /** 0.10 STT per validator */
  llmParseWebsitePerValidator: 100_000_000_000_000_000n,
  defaultSubcommitteeSize: 3,
} as const;

/** MVP bounty type tags */
export const bountyTypeTags = {
  urlResolvableSportsOutcome: 'URL_RESOLVABLE_SPORTS_OUTCOME',
} as const;

export type AgentIds = typeof agentIds;
export type AgentPricing = typeof agentPricing;
