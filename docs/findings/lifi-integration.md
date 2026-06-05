# LI.FI Integration — Architecture & Testnet Pattern

**Status:** Integration pattern **proven on Somnia testnet** via MockLiFiRouter (2026-05-25).

---

## Architecture validated by official Somnia integration docs

Architecture validated by official Somnia integration docs (`https://docs.somnia.network/developer/building-dapps/cross-chain-swaps-and-bridging/integrating-the-li.fi-sdk`). Per Somnia and LI.FI:

- LI.FI on Somnia is **mainnet-only** (chain ID **5031**)
- LI.FI’s own docs explicitly state testnets are **not supported** (`https://docs.li.fi/sdk/testing-integration`)
- Our `MockLiFiRouter` on Shannon testnet (chain ID **50312**) demonstrates the integration pattern; on mainnet deployment the router address swaps to LI.FI’s real diamond contract per the SDK setup in the Somnia guide

### Production deployment

On mainnet deployment, `LiFiAdapter` is deployed pointing at LI.FI’s real diamond contract (router address obtained via `@lifi/sdk` runtime configuration / LI.FI metadata). The integration pattern in our contract is unchanged — only the router constructor argument differs from `MockLiFiRouter` on testnet.

**Somnia mainnet token addresses (roadmap):**

- SOMI (native): `0x0000000000000000000000000000000000000000`
- WSOMI: `0x046EDe9564A72571df6F5e44d0405360c0f4dCab`
- USDC.e (bridged): `0x28BEc7E30E6faee657a03e19Bf1128AaD7632A00`
- USDT (bridged): `0x67B302E35Aef5EEE8c32D934F5856869EF428330`
- WETH: `0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8`

## 1. Platform constraint: no testnet support

LI.FI's official documentation states they no longer support testnets:

> "bridges and exchanges have limited support for testnets and there is almost no liquidity on those networks. Running test transactions on mainnets allows you to validate your setup in a real-world environment."

Source: [docs.li.fi/sdk/testing-integration](https://docs.li.fi/sdk/testing-integration)

Somnia's LI.FI integration (announced ~May 2026) is on **Somnia mainnet**, not Shannon testnet. We cannot execute a real LI.FI swap on testnet.

**Response (not a workaround):** deploy production-shape `LiFiAdapter` with a **configurable router address**. On testnet, router = `MockLiFiRouter`. On mainnet, swap constructor arg to LI.FI's **LiFiDiamond** — no contract logic change.

---

## 2. Architecture

```
ConsensusEngine._settle()
  └─ BountyBoard.settleBounty(winners[])  // CrossChain winner address = Settlement
  └─ Settlement.queuePayout(bountyId, resolver, amount)
       └─ (anyone) Settlement.forwardPayout()
            └─ LiFiAdapter.initiateBridge{value}()
                 └─ ILiFiRouter.startBridgeTokensViaBridge(BridgeData, bytes)
                      ├─ testnet: MockLiFiRouter (records MockBridgeRequest)
                      └─ mainnet: LiFiDiamond (real cross-chain route)
```

**Rescue path:** operator may `rescuePayout` after 24h if forwarding fails repeatedly — STT returns to operator on Somnia.

---

## 3. ABI assumption

We use LI.FI's **BridgeData** struct pattern plus a single native-bridge entrypoint:

```solidity
interface ILiFiRouter {
    struct BridgeData {
        bytes32 transactionId;
        string bridge;
        string integrator;
        string referrer;
        address sendingAssetId;
        address receiver;
        uint256 minAmount;
        uint256 destinationChainId;
        bool hasSourceSwaps;
        bool hasDestinationCall;
    }

    function startBridgeTokensViaBridge(BridgeData calldata bridgeData, bytes calldata bridgeSpecificData)
        external
        payable;
}
```

**Reference:** [docs.li.fi/concepts/bridge-data](https://docs.li.fi/concepts/bridge-data) — BridgeData fields and integrator pattern.

**Assumption:** `startBridgeTokensViaBridge` is the facet entrypoint for native-token bridging via the LiFiDiamond. Exact facet name and `bridgeSpecificData` encoding are route-dependent; refine against live mainnet router when deploying to Somnia mainnet.

`LiFiAdapter` sets:
- `integrator = "oracle-arena"`
- `sendingAssetId = address(0)` (native STT)
- `receiver = destinationRecipient` from payout prefs
- `destinationChainId` from payout prefs
- `bridge = "mock"` on testnet (ignored by mock; LI.FI router selects bridge on mainnet)

---

## 4. Testnet deployment

| Contract | Address |
|----------|---------|
| LiFiAdapter | `0xf00dDBc8319843c036BC2FA8162328377f154f7d` |
| MockLiFiRouter | `0xCdAaa7C662F9Cb81D404E87b15c0337Bd7E5c1C6` |

Live smoke test emitted `MockBridgeRequest` id=1 for 0.05 STT → Base (8453):
- [`0x44218451…`](https://shannon-explorer.somnia.network/tx/0x442184511897ee4a035398f98f717cabe9371d1b1c35f4beb2a47efb0ab336c5)

---

## 5. Mainnet deployment notes

1. Deploy `LiFiAdapter` with `router_ = <LiFiDiamond on Somnia mainnet>` — obtain address from [LI.FI API / Somnia mainnet docs](https://docs.li.fi).
2. **Do not deploy** `MockLiFiRouter` to mainnet.
3. Verify `BridgeData` + facet signature against the deployed diamond ABI (use LI.FI SDK or contract verification on explorer).
4. Set resolver payout prefs with real destination chain IDs and token addresses (e.g. USDC on Base).
5. Run a small mainnet smoke bridge before production traffic.

---

## 6. Test coverage

| Contract | Line coverage |
|----------|---------------|
| LiFiAdapter.sol | 100% |
| MockLiFiRouter.sol | 100% |

See `docs/findings/settlement.md` for full stack addresses and tx hashes.
