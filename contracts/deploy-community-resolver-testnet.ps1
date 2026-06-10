# Deploy an unregistered community ResolverAgent on Somnia testnet (50312).
# Optional: -Register switch also registers on ResolverRegistry v4 (adds row to /leaderboard).
#
# Usage (from contracts/):
#   .\deploy-community-resolver-testnet.ps1
#   .\deploy-community-resolver-testnet.ps1 -Register
#   .\deploy-community-resolver-testnet.ps1 -Operator 0xYourWallet

param(
    [switch]$Register,
    [string]$Operator = ""
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) { Write-Error "Missing contracts/.env — copy .env.example and set PRIVATE_KEY" }

Get-Content ".env" | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
    }
}

$forge = Join-Path $env:USERPROFILE ".foundry\bin\forge.exe"
if (-not (Test-Path $forge)) { Write-Error "forge not found at $forge" }

$rpc = if ($env:SOMNIA_RPC_URL) { $env:SOMNIA_RPC_URL } else { "https://api.infra.testnet.somnia.network" }

$env:PLATFORM_ADDRESS = "0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776"
$env:BOUNTY_BOARD_ADDRESS = "0xc8fb5757A922eCFd8294C3Aac7fb78BA7D71e290"
$env:RESOLVER_REGISTRY_ADDRESS = "0x0AcEF373884b7843592904e74F87ABD46ca035CF"
$env:CONSENSUS_ENGINE_ADDRESS = "0xB2495D336d59D193Fa2463b95248dE240aBfe6df"
$env:AGENT_INITIAL_FUNDING_WEI = "1000000000000000000"

if ($Operator) {
    $env:AGENT_OPERATOR = $Operator
    Write-Host "AGENT_OPERATOR=$Operator"
}

Write-Host "=== Deploy community ResolverAgent (unregistered) ==="
& $forge script script/DeployCommunityResolverAgent.s.sol:DeployCommunityResolverAgent `
    --rpc-url $rpc `
    --broadcast `
    --private-key $env:PRIVATE_KEY `
    --gas-estimate-multiplier 2000 `
    -vvv

if ($LASTEXITCODE -ne 0) { throw "DeployCommunityResolverAgent failed" }

$run = Get-Content "broadcast/DeployCommunityResolverAgent.s.sol/50312/run-latest.json" | ConvertFrom-Json
$agent = ($run.transactions | Where-Object { $_.contractName -eq "ResolverAgent" -and $_.transactionType -eq "CREATE" }).contractAddress

Write-Host ""
Write-Host "Community ResolverAgent: $agent"
Write-Host "Update packages/config/src/somnia.ts -> communityResolverTemplate: '$agent'"
Write-Host "Register at https://oraclearena.vercel.app/register (bond ~1 STT on testnet)"

if ($Register) {
    Write-Host ""
    Write-Host "=== Register on ResolverRegistry v4 ==="
    $env:RESOLVER_AGENT_ADDRESS = $agent
    & $forge script script/RegisterResolverAgent.s.sol:RegisterResolverAgent `
        --rpc-url $rpc `
        --broadcast `
        --private-key $env:PRIVATE_KEY `
        --gas-estimate-multiplier 2000 `
        -vvv
    if ($LASTEXITCODE -ne 0) { throw "RegisterResolverAgent failed" }
    Write-Host "Registered — check /leaderboard for a third row"
}
