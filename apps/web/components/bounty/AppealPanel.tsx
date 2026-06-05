'use client';

import { useCallback, useEffect, useState } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from 'viem/actions';
import { publicClient } from '../../lib/viem';
import { addresses, appealLayerAbi } from '../../lib/contracts';
import { formatSTT } from '../../lib/utils/format';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

type Props = {
  bountyId: bigint;
  resolvedAt: bigint;
};

export function AppealPanel({ bountyId, resolvedAt }: Props) {
  const appealAddress = addresses.appealLayer;
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { writeContractAsync, isPending } = useWriteContract();
  const [evidenceUrl, setEvidenceUrl] = useState('https://');
  const [message, setMessage] = useState<string | null>(null);

  const { data: minBond } = useReadContract({
    address: appealAddress || undefined,
    abi: appealLayerAbi,
    functionName: 'minChallengeBond',
    query: { enabled: Boolean(appealAddress) },
  });

  const { data: appealWindow } = useReadContract({
    address: appealAddress || undefined,
    abi: appealLayerAbi,
    functionName: 'appealWindow',
    query: { enabled: Boolean(appealAddress) },
  });

  const { data: appeal, refetch } = useReadContract({
    address: appealAddress || undefined,
    abi: appealLayerAbi,
    functionName: 'getAppeal',
    args: [bountyId],
    query: { enabled: Boolean(appealAddress) },
  });

  const windowEnd = appealWindow ? resolvedAt + appealWindow : 0n;
  const windowOpen = windowEnd > 0n && BigInt(Math.floor(Date.now() / 1000)) <= windowEnd;
  const hasOpenAppeal = appeal?.[0] && appeal[0] !== '0x0000000000000000000000000000000000000000' && !appeal[4];

  useEffect(() => {
    if (!appealAddress) {
      setMessage('Appeal layer not deployed on this network yet.');
    }
  }, [appealAddress]);

  const handleOpenAppeal = useCallback(async () => {
    if (!appealAddress || !minBond) return;
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    setMessage(null);
    try {
      const hash = await writeContractAsync({
        address: appealAddress,
        abi: appealLayerAbi,
        functionName: 'openAppeal',
        args: [bountyId, [evidenceUrl.trim()]],
        value: minBond,
      });
      await waitForTransactionReceipt(publicClient, { hash });
      await refetch();
      setMessage('Appeal opened. Protocol owner will resolve after re-review.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to open appeal');
    }
  }, [appealAddress, bountyId, evidenceUrl, isConnected, minBond, openConnectModal, refetch, writeContractAsync]);

  if (!appealAddress) {
    return (
      <Card className="p-5">
        <h2 className="font-display text-lg text-surface-text">Appeals (Phase 2)</h2>
        <p className="mt-2 text-sm text-surface-muted">
          Bonded challenges against settled bounties will activate once AppealLayer is deployed on testnet.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-display text-lg text-surface-text">Appeal this settlement</h2>
        <p className="mt-1 text-sm text-surface-muted">
          Challenge a resolved bounty within the appeal window. Successful challenges slash resolver bonds.
        </p>
      </div>

      {minBond ? (
        <p className="text-sm text-surface-muted">
          Challenge bond: <span className="text-surface-text">{formatSTT(minBond)}</span>
        </p>
      ) : null}

      {appeal?.[4] ? (
        <p className="text-sm text-emerald-300">
          Appeal resolved — {appeal[5] ? 'challenge succeeded' : 'challenge rejected'}.
        </p>
      ) : hasOpenAppeal ? (
        <p className="text-sm text-cyan">Appeal open — awaiting owner resolution.</p>
      ) : windowOpen ? (
        <>
          <input
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-navy/60 px-3 py-2 text-sm text-surface-text"
            placeholder="https://adversarial-evidence.example"
          />
          <Button type="button" disabled={isPending} onClick={() => void handleOpenAppeal()}>
            {isPending ? 'Opening appeal…' : 'Open bonded appeal'}
          </Button>
        </>
      ) : (
        <p className="text-sm text-surface-muted">Appeal window closed for this bounty.</p>
      )}

      {message ? <p className="text-sm text-surface-muted">{message}</p> : null}
    </Card>
  );
}
