import { keccak256, encodePacked, type Address } from 'viem';

/** Registered on Somnia testnet — see docs/findings/sds-integration.md */
export const SDS_SCHEMA_IDS = {
  bounties: '0x09919185110d7e1d045d50b87c073c7073e2d86b5e93e57a4740c8dc2fb28565' as const,
  submissions: '0x41d7f0feed01d47b98720bfe6b89c9bc618d4ecfd586849c37d14a4c7e268c9d' as const,
  resolvers: '0xac19c137ad183b19b00bc9693859d90aafad6a0f33bd9db57a3ae8756ef42e29' as const,
  settlements: '0xae11e83c399c4040a638ee9d13c12d2b64bb1fc76eb555e2cd47d3aaa6177185' as const,
};

export const SDS_PUBLISHER_ADDRESS =
  (process.env.NEXT_PUBLIC_SDS_PUBLISHER_ADDRESS ??
    '0x0C503557CC81701037240e982c9520Aa1ffca4Cc') as `0x${string}`;

export function bountyDataId(bountyId: bigint): `0x${string}` {
  return keccak256(encodePacked(['string', 'uint256'], ['bounty:', bountyId]));
}

export function submissionDataId(bountyId: bigint, resolver: Address): `0x${string}` {
  return keccak256(encodePacked(['string', 'uint256', 'address'], ['submission:', bountyId, resolver]));
}

export function resolverDataId(agent: Address): `0x${string}` {
  return keccak256(encodePacked(['string', 'address'], ['resolver:', agent]));
}
