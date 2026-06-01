'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract } from 'wagmi';
import { decodeEventLog, formatEther, parseEther } from 'viem';
import { waitForTransactionReceipt } from 'viem/actions';
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

type Banner = { kind: 'info' | 'error'; message: string };

function defaultDeadline(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
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

  const evidenceValid = evidence.filter((e) => e.trim()).every(isHttpsUrl);
  const claimValid = claim.trim().length >= MIN_CLAIM && claim.length <= MAX_CLAIM;
  const payoutValid = Number(payoutStt) >= MIN_PAYOUT;
  const deadlineDate = new Date(deadline);
  const deadlineValid =
    !Number.isNaN(deadlineDate.getTime()) &&
    deadlineDate.getTime() > Date.now() &&
    deadlineDate.getTime() <= Date.now() + MAX_DEADLINE_DAYS * 86400 * 1000;

  const formValid = claimValid && evidenceValid && payoutValid && deadlineValid && typeTag !== null;

  const estimateGas = useCallback(async () => {
    if (!address || !typeTag || !formValid) {
      setGasEstimate(null);
      return;
    }
    try {
      const sources = evidence.map((e) => e.trim()).filter(Boolean);
      const gas = await publicClient.estimateContractGas({
        address: addresses.bountyBoard,
        abi: bountyBoardAbi,
        functionName: 'postBounty',
        args: [claim.trim(), sources, typeTag, BigInt(Math.floor(deadlineDate.getTime() / 1000))],
        account: address,
        value: payoutWei,
      });
      setGasEstimate(gas);
    } catch {
      setGasEstimate(null);
    }
  }, [address, typeTag, formValid, claim, evidence, deadlineDate, payoutWei]);

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
      const sources = evidence.map((s) => s.trim()).filter(Boolean);
      const hash = await writeContractAsync({
        address: addresses.bountyBoard,
        abi: bountyBoardAbi,
        functionName: 'postBounty',
        args: [claim.trim(), sources, typeTag, BigInt(Math.floor(deadlineDate.getTime() / 1000))],
        value: payoutWei,
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
        router.push('/');
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
    <div className="flex min-h-screen flex-col">
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

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <section>
            <label className="text-xs font-medium uppercase tracking-widest text-surface-muted">
              Claim <span className="text-danger">*</span>
            </label>
            <textarea
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              rows={4}
              maxLength={MAX_CLAIM}
              placeholder="State a verifiable fact resolvers can investigate…"
              className="mt-2 w-full rounded-xl border border-white/10 bg-navy-elevated/80 px-4 py-3 text-sm text-surface-text placeholder:text-surface-muted focus:border-cyan/40 focus:outline-none"
            />
            <p className="mt-1 text-xs text-surface-muted">
              {claim.length}/{MAX_CLAIM} · min {MIN_CLAIM} characters
            </p>
          </section>

          <section>
            <label className="text-xs font-medium uppercase tracking-widest text-surface-muted">
              Evidence sources (https)
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
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-navy-elevated/80 px-3 py-2 text-sm focus:border-cyan/40 focus:outline-none"
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
              className="mt-2 w-full rounded-xl border border-white/10 bg-navy-elevated/80 px-4 py-3 text-sm text-surface-text"
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
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-navy-elevated/80 px-4 py-3 text-sm focus:border-cyan/40 focus:outline-none"
              />
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
                className="mt-2 w-full rounded-xl border border-white/10 bg-navy-elevated/80 px-4 py-3 text-sm font-mono focus:border-cyan/40 focus:outline-none"
              />
            </div>
          </section>

          <Card className="bg-navy-elevated/40">
            <p className="text-xs uppercase tracking-widest text-surface-muted">Gas estimate</p>
            <p className="mt-1 font-mono text-sm text-surface-text">
              {gasEstimate ? `~${Number(gasStt).toFixed(6)} STT` : 'Connect wallet & complete form'}
            </p>
            <p className="mt-3 text-sm text-cyan">You&apos;ll send: {totalPreview}</p>
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

        <Link href="/" className="mt-8 inline-block text-sm text-cyan hover:underline">
          ← Marketplace
        </Link>
      </main>
      <Footer />
    </div>
  );
}
