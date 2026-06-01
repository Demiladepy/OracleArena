# Settlement — Deployment & Verification Findings

**Status:** **LIVE on Somnia testnet** (2026-05-25). Settlement + LiFiAdapter + ResolverPayoutPrefs wired via atomic redeploy with ConsensusEngine v2.

---

## 1. Summary

**Option B confirmed:** BountyBoard settlement logic unchanged — native STT payouts go direct to resolver addresses; cross-chain resolvers receive their share at the **Settlement** contract address, then `forwardPayout` routes via **LiFiAdapter** → **MockLiFiRouter** (testnet).

**ConsensusEngine v2** queries `ResolverPayoutPrefs` during `_settle`, builds the winners array with Settlement as recipient for CrossChain agents, and calls `Settlement.queuePayout` after `settleBounty`.

**ResolverPayoutPrefs** is a separate contract (no ResolverRegistry v4 for prefs-only — prefs ship alongside Registry v4 because CE immutables force full stack redeploy).

---

## 2. Deployed addresses (current stack)

| Contract | Address |
|----------|---------|
| **BountyBoard v3** | `0xc8fb5757A922eCFd8294C3Aac7fb78BA7D71e290` |
| **ResolverRegistry v4** | `0x0AcEF373884b7843592904e74F87ABD46ca035CF` |
| **ConsensusEngine v2** | `0xB2495D336d59D193Fa2463b95248dE240aBfe6df` |
| **Settlement** | `0x1036E3837418695A6731405B8EBf954834508B5c` |
| **ResolverPayoutPrefs** | `0x9Af19D44e9E7880ea7a269c4cCD76aa01a40ABa8` |
| **LiFiAdapter** | `0xf00dDBc8319843c036BC2FA8162328377f154f7d` |
| **MockLiFiRouter** | `0xCdAaa7C662F9Cb81D404E87b15c0337Bd7E5c1C6` |
| **ResolverAgent** (re-registered v4) | `0x0f99957287c25313afC7eC3978eDAE3a97A72269` |

### Atomic deploy transactions (`DeploySettlementPhase.s.sol`)

| Step | Tx hash |
|------|---------|
| MockLiFiRouter CREATE | [`0xea4b66c8…`](https://shannon-explorer.somnia.network/tx/0xea4b66c856546071a47c0a62d0ac6269c0f6f80872c8cf7e859ababf6437cbc9) |
| LiFiAdapter CREATE | [`0x699dd791…`](https://shannon-explorer.somnia.network/tx/0x699dd791fb7e522e2bddf17a0ea247cd1277794228ecccbaef21d2d3f423f6dc) |
| ResolverRegistry v4 CREATE | [`0x045a4cc3…`](https://shannon-explorer.somnia.network/tx/0x045a4cc333bf194d33c4dc4c4bab200adcef9664d318cf30739dc0044e66ae8f) |
| ResolverPayoutPrefs CREATE | [`0x25a64175…`](https://shannon-explorer.somnia.network/tx/0x25a64175b8a57fb7e9c305448b45d0e008c97d3adfd0d21da883a03157f8ec63) |
| Settlement CREATE | [`0xd1d4eeee…`](https://shannon-explorer.somnia.network/tx/0xd1d4eeec48a0c17cb4a716d54586478edb0b140d988fb1a1a4370b46e88ea6d7) |
| ConsensusEngine v2 CREATE | [`0x622cb2e9…`](https://shannon-explorer.somnia.network/tx/0x622cb2e9537659ba2ad5f2608bcfbbd045d6ae3e629b558ec66a83ea4f6daad6) |
| BountyBoard v3 CREATE | [`0x2b140f79…`](https://shannon-explorer.somnia.network/tx/0x2b140f793872bd95f289227159d58277652011b12721906b9cc8809545b4e511) |

### Follow-on transactions

| Step | Tx hash |
|------|---------|
| Register ResolverAgent on v4 (1 STT bond) | [`0x3dd020c5…`](https://shannon-explorer.somnia.network/tx/0x3dd020c546251eea0a66cc2d07988573309ac9de91ac6f1e7fa48a893863626f) |
| Set CrossChain pref (Base 8453 → deployer) | [`0x3f447399…`](https://shannon-explorer.somnia.network/tx/0x3f4473998a4681f2cb50a1a81ea34be6f3b02da15cb9c3c16cfce87ccd8f1aaa) |
| Smoke `queuePayout` (0.05 STT, bounty 999) | [`0x57735d03…`](https://shannon-explorer.somnia.network/tx/0x57735d03d0c544ddfbb6c82bd68c773fa5f216413dd635e6cd6ba25b433da4f6) |
| Smoke `forwardPayout` → MockBridgeRequest | [`0x44218451…`](https://shannon-explorer.somnia.network/tx/0x442184511897ee4a035398f98f717cabe9371d1b1c35f4beb2a47efb0ab336c5) |

---

## 3. Test results

| Contract | Tests | Line coverage |
|----------|-------|---------------|
| Settlement.sol | 11 | **100%** (42/42) |
| LiFiAdapter.sol | 5 | **100%** (12/12) |
| ResolverPayoutPrefs.sol | 4 | **100%** (21/21) |
| ConsensusEngine.sol (v2 paths) | 19 | **93.6%** (88/94) |

```bash
cd contracts
forge test --match-contract "SettlementTest|LiFiAdapterTest|ResolverPayoutPrefsTest|ConsensusEngineTest"
forge coverage --match-contract "Settlement|LiFiAdapter|ResolverPayoutPrefs|ConsensusEngine" --ir-minimum
```

Branch coverage on Settlement (75%) reflects defensive paths (`UnexpectedNativePreference`, rescue edge cases) — acceptable for MVP.

---

## 4. Legacy addresses (superseded)

| Contract | Address |
|----------|---------|
| BountyBoard v2 | `0x14aB2e6C33A0CFd4747aFc9D4bA4D3D6Cbbc81cE` |
| ResolverRegistry v3 | `0xa9AD0687076c9d99250C961d0E41914448DB823b` |
| ConsensusEngine v1 | `0x0e5789E15081411A1048D5B4915cd6F20d66a0c8` |

Open bounty #1 remains on **v2 board** (stranded). Post a new bounty on v3 for end-to-end demo after ResolverAgent v2 ships.

---

## 5. Spec deviations

| Item | Notes |
|------|-------|
| Full stack redeploy | CE v2 immutables required BountyBoard v3 + Registry v4 despite Option B "no board logic change" — settlement **logic** unchanged, wiring immutables forced redeploy |
| `smokeQueuePayout` on CE | Testnet-only helper for manual smoke without live consensus; registry owner only |
| ResolverAgent still calls `BountyBoard.recordSubmission` | Queued for StreamPublisher + ResolverAgent v2 phase |
| Cross-chain pref on live agent | Base chain 8453, native asset (`address(0)`), recipient = deployer |

---

## 6. Wallet burn (this phase)

| | STT |
|--|-----|
| Before phase | ~39.54 |
| After phase | **~37.90** |
| Spent | ~1.64 STT (deploy + register + pref + smoke) |

Hard stop: StreamPublisher + ResolverAgent v2 is next phase.
