# Deploy Settlement phase - MockRouter, LiFiAdapter, Registry v4, PayoutPrefs, Settlement, CE v2, Board v3
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$forge = Join-Path $env:USERPROFILE ".foundry\bin\forge.exe"
$envFile = Join-Path $root ".env"
if (-not (Test-Path $envFile)) { throw "Missing contracts/.env - copy .env.example" }
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
    }
}

$rpc = $env:SOMNIA_RPC_URL
$privateKey = $env:PRIVATE_KEY
if (-not $rpc -or -not $privateKey) { throw "SOMNIA_RPC_URL and PRIVATE_KEY required in .env" }

Write-Host "=== Deploy Settlement Phase (atomic) ==="
& $forge script script/DeploySettlementPhase.s.sol:DeploySettlementPhase --rpc-url $rpc --broadcast --private-key $privateKey --gas-estimate-multiplier 2000 -vvv

Write-Host "=== Next: update .env with v4 addresses, then register agent and run smoke test ==="
