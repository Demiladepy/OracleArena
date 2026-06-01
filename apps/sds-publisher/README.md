# Oracle Arena SDS Publisher

TypeScript service that mirrors Oracle Arena on-chain events to [Somnia Data Streams](https://docs.somnia.network/developer/data-streams).

## Setup

```bash
cp .env.example .env
# Set SDS_PUBLISHER_PRIVATE_KEY (or rely on ../../contracts/.env PRIVATE_KEY)
pnpm install
pnpm sds-publish:setup-schemas
```

## Run

```bash
pnpm sds-publish:run
```

## Read back

```bash
pnpm sds-publish:read <bountyId>
```

## Architecture

External EOA publisher (not an on-chain contract). Listens via `viem.watchContractEvent`, encodes records with `@somnia-chain/streams` `SchemaEncoder`, publishes via `sdk.streams.set()`.

Schemas: `oracle-arena:bounties:v1`, `submissions:v1`, `resolvers:v1`, `settlements:v1`.
