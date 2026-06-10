'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract } from 'wagmi';
import { decodeEventLog, formatEther, parseEther } from 'viem';
import { waitForTransactionReceipt } from 'viem/actions';
import { estimateContractGasWithFallback, GAS_FALLBACK, withGasBuffer } from '../../lib/gas';
import { publicClient } from '../../lib/viem';
import { addresses, bountyBoardAbi } from '../../lib/contracts';
import { clearPostedPayoutCache, fetchUrlResolvableFactType } from '../../lib/contracts/bountyBoard';
import { formatSTT } from '../../lib/utils/format';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Footer } from '../shared/Footer';
import { Header } from '../shared/Header';
import { Skeleton } from '../ui/Skeleton';

const MAX_EVIDENCE = 10;
const MAX_CLAIM = 500;
const MIN_CLAIM = 10;
const MIN_PAYOUT = 0.1;
const MAX_DEADLINE_DAYS = 7;

const EXAMPLE_CLAIM = 'Is the chemical formula for water H2O?';
const EXAMPLE_EVIDENCE = 'https://en.wikipedia.org/wiki/Water';

type Banner = { kind: 'info' | 'error'; message: string };

function defaultDeadline(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function maxDeadlineLocal(): string {
  const d = new Date(Date.now() + MAX_DEADLINE_DAYS * 86400 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function minDeadlineLocal(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function isHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function PostBountyView() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { writeContractAsync, isPending } = useWriteContract();

  const [claim, setClaim] = useState('');
  const [evidence, setEvidence] = useState<string[]>(['']);
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [payoutStt, setPayoutStt] = useState('0.2');
  const [typeTag, setTypeTag] = useState<`0x${string}` | null>(null);
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null);
  const [gasHint, setGasHint] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUrlResolvableFactType().then(setTypeTag).catch(() => setTypeTag(null));
  }, []);

  const payoutWei = useMemo(() => {
    try {
      return parseEther(payoutStt || '0');
    } catch {
      return 0n;
    }
  }, [payoutStt]);

  const trimmedEvidence = evidence.map((e) => e.trim()).filter(Boolean);
  const evidenceValid = trimmedEvidence.length >= 1 && trimmedEvidence.every(isHttpsUrl);
  const claimValid = claim.trim().length >= MIN_CLAIM && claim.length <= MAX_CLAIM;
  const payoutValid = Number(payoutStt) >= MIN_PAYOUT;
  const deadlineDate = new Date(deadline);
  const deadlineValid =
    !Number.isNaN(deadlineDate.getTime()) &&
    deadlineDate.getTime() > Date.now() &&
    deadlineDate.getTime() <= Date.now() + MAX_DEADLINE_DAYS * 86400 * 1000;

  const formValid = claimValid && evidenceValid && payoutValid && deadlineValid && typeTag !== null;

  const validationHints: string[] = [];
  if (!isConnected) validationHints.push('Connect wallet on Somnia testnet (chain 50312)');
  if (!claimValid) validationHints.push(`Claim needs at least ${MIN_CLAIM} characters`);
  if (trimmedEvidence.length === 0) validationHints.push('Add at least one https:// evidence URL');
  else if (!evidenceValid) validationHints.push('Evidence URLs must start with https://');
  if (!payoutValid) validationHints.push(`Payout must be at least ${MIN_PAYOUT} STT`);
  if (!deadlineValid) {
    validationHints.push(`Deadline must be within the next ${MAX_DEADLINE_DAYS} days (not year 2100+)`);
  }
  if (!typeTag) validationHints.push('Loading bounty type from chain…');

  function fillExample() {
    setClaim(EXAMPLE_CLAIM);
    setEvidence([EXAMPLE_EVIDENCE]);
    setPayoutStt('0.1');
    setDeadline(defaultDeadline());
    setBanner(null);
  }

  const estimateGas = useCallback(async () => {
    if (!address) {
      setGasEstimate(null);
      setGasHint('Connect wallet on Somnia testnet (50312)');
      return;
    }
    if (!typeTag || !formValid) {
      setGasEstimate(null);
      if (!claimValid) setGasHint(`Claim needs at least ${MIN_CLAIM} characters`);
      else if (trimmedEvidence.length === 0) setGasHint('Add at least one https:// evidence URL');
      else if (!evidenceValid) setGasHint('Evidence URLs must start with https://');
      else if (!payoutValid) setGasHint(`Payout must be at least ${MIN_PAYOUT} STT`);
      else if (!deadlineValid) setGasHint(`Deadline must be within ${MAX_DEADLINE_DAYS} days`);
      else if (!typeTag) setGasHint('Loading bounty type from chain…');
      else setGasHint('Complete the form to estimate gas');
      return;
    }
    try {
      const sources = trimmedEvidence;
      const gas = await publicClient.estimateContractGas({
        address: addresses.bountyBoard,
        abi: bountyBoardAbi,
        functionName: 'postBounty',
        args: [claim.trim(), sources, typeTag, BigInt(Math.floor(deadlineDate.getTime() / 1000))],
        account: address,
        value: payoutWei,
      });
      setGasEstimate(withGasBuffer(gas));
      setGasHint(null);
    } catch (err) {
      setGasEstimate(null);
      const msg = err instanceof Error ? err.message : String(err);
      if (/insufficient funds/i.test(msg)) {
        setGasHint(`Not enough STT — need ${formatSTT(payoutWei)} payout plus gas in wallet`);
      } else if (/chain/i.test(msg) || /50312/i.test(msg)) {
        setGasHint('Switch wallet to Somnia testnet (chain ID 50312)');
      } else {
        setGasHint(msg.slice(0, 120));
      }
    }
  }, [address, typeTag, formValid, claim, claimValid, evidenceValid, trimmedEvidence, deadlineValid, deadlineDate, payoutValid, payoutWei]);

  useEffect(() => {
    const t = setTimeout(() => {
      estimateGas();
    }, 400);
    return () => clearTimeout(t);
  }, [estimateGas]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);

    if (!formValid || !typeTag) return;

    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    setSubmitting(true);
    try {
      const sources = trimmedEvidence;
      const deadlineTs = BigInt(Math.floor(deadlineDate.getTime() / 1000));
      const postArgs = [claim.trim(), sources, typeTag, deadlineTs] as const;
      const gas =
        gasEstimate ??
        (await estimateContractGasWithFallback(
          publicClient,
          {
            address: addresses.bountyBoard,
            abi: bountyBoardAbi,
            functionName: 'postBounty',
            args: postArgs,
            account: address!,
            value: payoutWei,
          },
          GAS_FALLBACK.postBounty,
        ));
      const hash = await writeContractAsync({
        address: addresses.bountyBoard,
        abi: bountyBoardAbi,
        functionName: 'postBounty',
        args: postArgs,
        value: payoutWei,
        gas,
      });

      const receipt = await waitForTransactionReceipt(publicClient, { hash });

      let newId: bigint | undefined;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: bountyBoardAbi,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === 'BountyPosted') {
            newId = decoded.args.bountyId as bigint;
            break;
          }
        } catch {
          // not our event
        }
      }

      clearPostedPayoutCache();

      if (newId !== undefined) {
        router.push(`/bounty/${newId}`);
      } else {
        setBanner({ kind: 'info', message: 'Bounty posted — check marketplace for your bounty.' });
        router.push('/marketplace');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/user rejected|denied/i.test(msg)) {
        setBanner({ kind: 'info', message: 'Transaction cancelled.' });
      } else if (/insufficient funds/i.test(msg)) {
        setBanner({
          kind: 'error',
          message: `Insufficient STT. You need ${formatSTT(payoutWei)} plus gas.`,
        });
      } else {
        setBanner({ kind: 'error', message: msg.slice(0, 280) });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const gasStt = gasEstimate ? formatEther(gasEstimate) : '—';
  const totalPreview = gasEstimate
    ? `${formatSTT(payoutWei)} payout + ~${Number(gasStt).toFixed(4)} gas`
    : `${formatSTT(payoutWei)} payout + gas TBD`;

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 md:px-6 md:py-14">
        <h1 className="font-display text-3xl text-surface-text">Post a bounty</h1>
        <p className="mt-2 text-sm text-surface-muted">
          Posts to BountyBoard v3 on Somnia testnet. Payout is sent as msg.value in STT.
        </p>

        {banner ? (
          <div
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
              banner.kind === 'error'
                ? 'border-danger/40 bg-danger/10 text-danger'
                : 'border-cyan/30 bg-cyan/5 text-surface-text'
            }`}
          >
            {banner.message}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={fillExample}>
            Fill example claim
          </Button>
          <p className="text-xs text-surface-muted">
            Uses the same pattern as bounty #4 — min 0.1 STT payout + gas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <section>
            <label className="text-xs font-medium uppercase tracking-widest text-surface-muted">
              Claim <span className="text-danger">*</span>
            </label>
            <textarea
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              rows={4}
              minLength={MIN_CLAIM}
              maxLength={MAX_CLAIM}
              required
              placeholder="Is the chemical formula for water H2O?"
              className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none ${
                claim.length > 0 && !claimValid ? 'border-danger/50' : 'border-white/10 focus:border-cyan/40'
              }`}
            />
            <p className={`mt-1 text-xs ${claimValid ? 'text-surface-muted' : 'text-danger'}`}>
              {claim.trim().length}/{MAX_CLAIM} · need at least {MIN_CLAIM} characters
            </p>
          </section>

          <section>
            <label className="text-xs font-medium uppercase tracking-widest text-surface-muted">
              Evidence sources (https) <span className="text-danger">*</span>
            </label>
            <div className="mt-2 space-y-2">
              {evidence.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      const next = [...evidence];
                      next[i] = e.target.value;
                      setEvidence(next);
                    }}
                    placeholder="https://…"
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-cyan/40 focus:outline-none"
                  />
                  {evidence.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEvidence(evidence.filter((_, j) => j !== i))}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
            {evidence.length < MAX_EVIDENCE ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => setEvidence([...evidence, ''])}
              >
                Add URL
              </Button>
            ) : null}
          </section>

          <section>
            <label className="text-xs font-medium uppercase tracking-widest text-surface-muted">
              Bounty type
            </label>
            <select
              disabled
              className="mt-2 w-full rounded-xl border border-white/10 bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text)]"
            >
              <option>URL_RESOLVABLE_FACT (MVP)</option>
            </select>
            {!typeTag ? <Skeleton className="mt-2 h-4 w-48" /> : null}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium uppercase tracking-widest text-surface-muted">
                Deadline
              </label>
              <input
                type="datetime-local"
                value={deadline}
                min={minDeadlineLocal()}
                max={maxDeadlineLocal()}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text)] focus:border-cyan/40 focus:outline-none"
              />
              {!deadlineValid ? (
                <p className="mt-1 text-xs text-danger">Pick a date within the next {MAX_DEADLINE_DAYS} days</p>
              ) : null}
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-widest text-surface-muted">
                Payout (STT)
              </label>
              <input
                type="number"
                min={MIN_PAYOUT}
                step="0.01"
                value={payoutStt}
                onChange={(e) => setPayoutStt(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[var(--bg-card)] px-4 py-3 text-sm font-mono text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-cyan/40 focus:outline-none"
              />
            </div>
          </section>

          <Card className="bg-[var(--bg-card)]/40">
            <p className="text-xs uppercase tracking-widest text-surface-muted">Gas estimate</p>
            <p className="mt-1 font-mono text-sm text-surface-text">
              {gasEstimate ? `~${Number(gasStt).toFixed(6)} STT` : '—'}
            </p>
            {gasHint ? <p className="mt-2 text-sm text-danger">{gasHint}</p> : null}
            {!formValid && validationHints.length > 0 ? (
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-surface-muted">
                {validationHints.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3 text-sm text-cyan">You&apos;ll send: {totalPreview}</p>
          </Card>

          <Card className="border-cyan/15 bg-cyan/5 p-5">
            <h3 className="font-display text-base text-surface-text">Multi-chain funding (Phase 2)</h3>
            <p className="mt-2 text-sm text-surface-muted">
              On Somnia testnet, bounties are funded with native STT in this form. On mainnet, fund your Somnia wallet
              first via the{' '}
              <a
                href="https://docs.somnia.network/developer/building-dapps/cross-chain-swaps-and-bridging/integrating-the-li.fi-sdk"
                className="text-cyan hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                LI.FI SDK
              </a>{' '}
              (bridge from Base, Ethereum, etc.), then post the bounty here with SOMI.
            </p>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!formValid || submitting || isPending}
          >
            {submitting || isPending ? 'Confirm in wallet…' : 'Post bounty on-chain'}
          </Button>
        </form>

        <Link href="/marketplace" className="mt-8 inline-block text-sm text-cyan hover:underline">
          ← Marketplace
        </Link>
      </main>
      <Footer />
    </div>
  );
}
