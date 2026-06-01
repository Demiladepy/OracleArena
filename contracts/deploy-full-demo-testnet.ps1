# Deploy ResolverAgent v2 + register + pref + demo bounty
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$forge = Join-Path $env:USERPROFILE ".foundry\bin\forge.exe"
Get-Content (Join-Path $root ".env") | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
    }
}

$env:BOUNTY_BOARD_ADDRESS = "0xc8fb5757A922eCFd8294C3Aac7fb78BA7D71e290"
$env:RESOLVER_REGISTRY_ADDRESS = "0x0AcEF373884b7843592904e74F87ABD46ca035CF"
$env:CONSENSUS_ENGINE_ADDRESS = "0xB2495D336d59D193Fa2463b95248dE240aBfe6df"
$env:PAYOUT_PREFS_ADDRESS = "0x9Af19D44e9E7880ea7a269c4cCD76aa01a40ABa8"

& $forge script script/DeployFullDemoAgent.s.sol:DeployFullDemoAgent --rpc-url $env:SOMNIA_RPC_URL --broadcast --private-key $env:PRIVATE_KEY --gas-estimate-multiplier 2000 -vvv
