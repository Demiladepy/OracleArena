import type { SdsBountyRecord } from '@oracle-arena/types';

type DecodedField = { name: string; value: { value: unknown } };

function fieldValue(fields: DecodedField[], name: string): unknown {
  const field = fields.find((f) => f.name === name);
  return field?.value?.value;
}

export function decodeSdsBountyRecord(raw: unknown): SdsBountyRecord | null {
  if (!raw || !Array.isArray(raw) || !Array.isArray(raw[0])) return null;
  const fields = raw[0] as DecodedField[];
  const bountyId = fieldValue(fields, 'bountyId');
  if (bountyId === undefined) return null;

  return {
    createdAt: BigInt(String(fieldValue(fields, 'createdAt') ?? 0)),
    bountyId: BigInt(String(bountyId)),
    poster: String(fieldValue(fields, 'poster') ?? '') as `0x${string}`,
    bountyType: String(fieldValue(fields, 'bountyType') ?? '') as `0x${string}`,
    claim: String(fieldValue(fields, 'claim') ?? ''),
    deadline: BigInt(String(fieldValue(fields, 'deadline') ?? 0)),
    payout: BigInt(String(fieldValue(fields, 'payout') ?? 0)),
    status: Number(fieldValue(fields, 'status') ?? 0),
  };
}

export function decodeSdsSubmissionRecord(raw: unknown) {
  if (!raw || !Array.isArray(raw) || !Array.isArray(raw[0])) return null;
  const fields = raw[0] as DecodedField[];
  return {
    submittedAt: BigInt(String(fieldValue(fields, 'submittedAt') ?? 0)),
    bountyId: BigInt(String(fieldValue(fields, 'bountyId') ?? 0)),
    resolver: String(fieldValue(fields, 'resolver') ?? '') as `0x${string}`,
    verdictHash: String(fieldValue(fields, 'verdictHash') ?? '') as `0x${string}`,
    confidence: Number(fieldValue(fields, 'confidence') ?? 0),
    evidenceUri: String(fieldValue(fields, 'evidenceUri') ?? ''),
  };
}

export function decodeSdsResolverRecord(raw: unknown) {
  if (!raw || !Array.isArray(raw) || !Array.isArray(raw[0])) return null;
  const fields = raw[0] as DecodedField[];
  return {
    registeredAt: BigInt(String(fieldValue(fields, 'registeredAt') ?? 0)),
    agent: String(fieldValue(fields, 'agent') ?? '') as `0x${string}`,
    operator: String(fieldValue(fields, 'operator') ?? '') as `0x${string}`,
    bond: BigInt(String(fieldValue(fields, 'bond') ?? 0)),
    resolutionsAttempted: BigInt(String(fieldValue(fields, 'resolutionsAttempted') ?? 0)),
    resolutionsAgreed: BigInt(String(fieldValue(fields, 'resolutionsAgreed') ?? 0)),
    totalEarnings: BigInt(String(fieldValue(fields, 'totalEarnings') ?? 0)),
    status: Number(fieldValue(fields, 'status') ?? 0),
  };
}
