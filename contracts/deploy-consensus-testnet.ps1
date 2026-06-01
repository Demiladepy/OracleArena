# Oracle Arena — ConsensusEngine phase (Option A, atomic CREATE prediction)
# Run: cd contracts; .\deploy-consensus-testnet.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) { Write-Error "Missing contracts/.env" }

$forge = Join-Path $env:USERPROFILE ".foundry\bin\forge.exe"
$cast = Join-Path $env:USERPROFILE ".foundry\bin\cast.exe"
$rpc = "https://api.infra.testnet.somnia.network"

$privateKey = (Get-Content ".env" | Where-Object { $_ -match '^PRIVATE_KEY=' }) -replace '^PRIVATE_KEY=',''
$pkForCast = $privateKey
if ($pkForCast -match '^0x') { $pkForCast = $pkForCast.Substring(2) }
$deployer = & $cast wallet address --private-key $pkForCast

Write-Host "Deployer: $deployer"
$balanceBefore = & $cast balance $deployer --rpc-url $rpc
Write-Host "Balance before (wei): $balanceBefore"

$env:MIN_BOND_WEI = "1000000000000000000"

Write-Host ""
Write-Host "=== 1. Atomic deploy: BountyBoard v2 + ResolverRegistry v3 + ConsensusEngine ==="
& $forge script script/DeployConsensusPhase.s.sol:DeployConsensusPhase --rpc-url $rpc --broadcast --private-key $privateKey --gas-estimate-multiplier 2000 -vvv
if ($LASTEXITCODE -ne 0) { throw "DeployConsensusPhase failed" }

$run = Get-Content "broadcast/DeployConsensusPhase.s.sol/50312/run-latest.json" | ConvertFrom-Json
$board = ($run.transactions | Where-Object { $_.contractName -eq "BountyBoard" -and $_.transactionType -eq "CREATE" }).contractAddress
$registry = ($run.transactions | Where-Object { $_.contractName -eq "ResolverRegistry" -and $_.transactionType -eq "CREATE" }).contractAddress
$engine = ($run.transactions | Where-Object { $_.contractName -eq "ConsensusEngine" -and $_.transactionType -eq "CREATE" }).contractAddress

Write-Host "BountyBoard v2: $board"
Write-Host "ResolverRegistry v3: $registry"
Write-Host "ConsensusEngine: $engine"

$env:BOUNTY_BOARD_ADDRESS = $board
$env:RESOLVER_REGISTRY_ADDRESS = $registry
$env:CONSENSUS_ENGINE = $engine
$env:AGENT_INITIAL_FUNDING_WEI = "1000000000000000000"

Write-Host ""
Write-Host "=== 2. Deploy ResolverAgent (new immutables for v2 board + v3 registry) ==="
& $forge script script/DeployResolverAgent.s.sol:DeployResolverAgent --rpc-url $rpc --broadcast --private-key $privateKey --gas-estimate-multiplier 2000 -vvv
if ($LASTEXITCODE -ne 0) { throw "DeployResolverAgent failed" }

$run = Get-Content "broadcast/DeployResolverAgent.s.sol/50312/run-latest.json" | ConvertFrom-Json
$agent = ($run.transactions | Where-Object { $_.contractName -eq "ResolverAgent" -and $_.transactionType -eq "CREATE" }).contractAddress
Write-Host "ResolverAgent: $agent"
$env:RESOLVER_AGENT_ADDRESS = $agent

Write-Host ""
Write-Host "=== 3. Register ResolverAgent on Registry v3 ==="
& $forge script script/RegisterResolverAgent.s.sol:RegisterResolverAgent --rpc-url $rpc --broadcast --private-key $privateKey --gas-estimate-multiplier 8000 -vvv
if ($LASTEXITCODE -ne 0) { throw "RegisterResolverAgent failed" }

Write-Host ""
Write-Host "=== 4. Post open bounty on BountyBoard v2 ==="
& $forge script script/PostOpenBounty.s.sol:PostOpenBounty --rpc-url $rpc --broadcast --private-key $privateKey --gas-estimate-multiplier 8000 -vvv
if ($LASTEXITCODE -ne 0) { throw "PostOpenBounty failed" }

Write-Host ""
Write-Host "=== 5. Probe evaluateBounty(1) ==="
try {
    & $cast call $agent "evaluateBounty(uint256)(uint256)" 1 --rpc-url $rpc --from $deployer 2>&1
} catch {
    Write-Host "evaluateBounty result: $_"
}

$balanceAfter = & $cast balance $deployer --rpc-url $rpc
Write-Host ""
Write-Host "Balance after (wei): $balanceAfter"
Write-Host "STT spent (approx wei): $([decimal]$balanceBefore - [decimal]$balanceAfter)"
Write-Host "Done. Update packages/config and docs/findings/consensusengine.md"
