# Oracle Arena - Somnia testnet deployment (BountyBoard + inferToolsChat probe)
# Run from YOUR terminal: cd contracts; .\deploy-testnet.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) {
    Write-Error "Missing contracts/.env - copy .env.example and set PRIVATE_KEY"
}

$forge = Join-Path $env:USERPROFILE ".foundry\bin\forge.exe"
$cast = Join-Path $env:USERPROFILE ".foundry\bin\cast.exe"
$rpc = "https://api.infra.testnet.somnia.network"

$privateKey = (Get-Content ".env" | Where-Object { $_ -match '^PRIVATE_KEY=' }) -replace '^PRIVATE_KEY=',''
if ([string]::IsNullOrWhiteSpace($privateKey)) { Write-Error "PRIVATE_KEY missing in .env" }

$pkForCast = $privateKey
if ($pkForCast -match '^0x') { $pkForCast = $pkForCast.Substring(2) }
$deployer = & $cast wallet address --private-key $pkForCast
$bal = & $cast balance $deployer --rpc-url $rpc
Write-Host "Deployer: $deployer"
Write-Host "Balance (wei): $bal"

function Invoke-ForgeScript {
    param(
        [string]$ScriptPath,
        [int]$GasMultiplier = 8000
    )
    & $forge script $ScriptPath --rpc-url $rpc --broadcast --private-key $privateKey --gas-estimate-multiplier $GasMultiplier -vvv
    if ($LASTEXITCODE -ne 0) { throw "Forge script failed: $ScriptPath" }
}

Write-Host ""
Write-Host "=== 1. Deploy BountyBoard ==="
Invoke-ForgeScript "script/DeployBountyBoard.s.sol:DeployBountyBoard" -GasMultiplier 2000

$runFile = "broadcast/DeployBountyBoard.s.sol/50312/run-latest.json"
if (-not (Test-Path $runFile)) { Write-Error "Deploy broadcast file not found: $runFile" }
$run = Get-Content $runFile | ConvertFrom-Json
$board = ($run.transactions | Where-Object { $_.contractName -eq "BountyBoard" -and $_.transactionType -eq "CREATE" }).contractAddress
if (-not $board) { $board = ($run.transactions | Where-Object { $_.contractName -eq "BountyBoard" })[0].contractAddress }
Write-Host "BountyBoard: $board"
$env:BOUNTY_BOARD_ADDRESS = $board

# Verify contract has code on chain
$code = & $cast code $board --rpc-url $rpc
if ($code -eq "0x") { Write-Error "BountyBoard has no bytecode on chain at $board" }

Write-Host ""
Write-Host "=== 2. Smoke test (post + cancel) ==="
$postOut = & $forge script script/VerifyBountyBoard.s.sol:VerifyBountyBoard --sig "runPost()" --rpc-url $rpc --broadcast --private-key $privateKey --gas-estimate-multiplier 8000 -vvv 2>&1 | Out-String
Write-Host $postOut
if ($LASTEXITCODE -ne 0) { throw "Forge script failed: VerifyBountyBoard runPost" }
if ($postOut -match 'Posted bountyId:\s*(\d+)') {
    $env:SMOKE_BOUNTY_ID = $matches[1]
} else {
    $env:SMOKE_BOUNTY_ID = "1"
}
Write-Host "Smoke bountyId: $env:SMOKE_BOUNTY_ID"
& $forge script script/VerifyBountyBoard.s.sol:VerifyBountyBoard --sig "runCancel()" --rpc-url $rpc --broadcast --private-key $privateKey --gas-estimate-multiplier 8000 -vvv
if ($LASTEXITCODE -ne 0) { throw "Forge script failed: VerifyBountyBoard runCancel" }

Write-Host ""
Write-Host "=== 3. Post open bounty ==="
Invoke-ForgeScript "script/PostOpenBounty.s.sol:PostOpenBounty"

Write-Host ""
Write-Host "=== 4. Deploy inferToolsChat probe ==="
Invoke-ForgeScript "script/DeployToolsChatProbe.s.sol:DeployToolsChatProbe" -GasMultiplier 2000

$probeRun = Get-Content "broadcast/DeployToolsChatProbe.s.sol/50312/run-latest.json" | ConvertFrom-Json
$probe = ($probeRun.transactions | Where-Object { $_.contractName -eq "ToolsChatProbe" -and $_.transactionType -eq "CREATE" }).contractAddress
if (-not $probe) { $probe = ($probeRun.transactions | Where-Object { $_.contractName -eq "ToolsChatProbe" })[0].contractAddress }
Write-Host "ToolsChatProbe: $probe"
$env:PROBE_ADDRESS = $probe

Write-Host ""
Write-Host "=== 4b. Invoke probe (may fail if agent subcommittee has no active members) ==="
try {
    Invoke-ForgeScript "script/InvokeToolsChatProbe.s.sol:InvokeToolsChatProbe" -GasMultiplier 8000
} catch {
    Write-Warning "Probe invoke failed (Somnia agent subcommittee may have zero active members): $_"
}

Write-Host ""
Write-Host "=== 5. Wait 90s for agent callback ==="
Start-Sleep -Seconds 90

Write-Host ""
Write-Host "=== 6. Read probe result ==="
& $forge script script/ReadProbeResult.s.sol:ReadProbeResult --rpc-url $rpc -vvv
if ($LASTEXITCODE -ne 0) { throw "ReadProbeResult failed" }

Write-Host ""
Write-Host "Done. Update docs/findings and packages/config with addresses above."
