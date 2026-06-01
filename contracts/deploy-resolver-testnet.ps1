# Oracle Arena - ResolverRegistry v2 (MIN_BOND=1 STT) + test agent registration
# Run: cd contracts; .\deploy-resolver-testnet.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) { Write-Error "Missing contracts/.env" }

$forge = Join-Path $env:USERPROFILE ".foundry\bin\forge.exe"
$cast = Join-Path $env:USERPROFILE ".foundry\bin\cast.exe"
$rpc = "https://api.infra.testnet.somnia.network"

$privateKey = (Get-Content ".env" | Where-Object { $_ -match '^PRIVATE_KEY=' }) -replace '^PRIVATE_KEY=',''
$env:MIN_BOND_WEI = "1000000000000000000"

$pkForCast = $privateKey
if ($pkForCast -match '^0x') { $pkForCast = $pkForCast.Substring(2) }
$deployer = & $cast wallet address --private-key $pkForCast
Write-Host "Deployer: $deployer"
Write-Host "Balance (wei): $(& $cast balance $deployer --rpc-url $rpc)"
Write-Host "MIN_BOND_WEI: $env:MIN_BOND_WEI"

Write-Host ""
Write-Host "=== 1. Deploy ResolverRegistry v2 (MIN_BOND=1 STT) ==="
& $forge script script/DeployResolverRegistry.s.sol:DeployResolverRegistry --rpc-url $rpc --broadcast --private-key $privateKey --gas-estimate-multiplier 2000 -vvv
if ($LASTEXITCODE -ne 0) { throw "DeployResolverRegistry failed" }

$run = Get-Content "broadcast/DeployResolverRegistry.s.sol/50312/run-latest.json" | ConvertFrom-Json
$registry = ($run.transactions | Where-Object { $_.contractName -eq "ResolverRegistry" -and $_.transactionType -eq "CREATE" }).contractAddress
Write-Host "ResolverRegistry v2: $registry"
$env:RESOLVER_REGISTRY_ADDRESS = $registry

Write-Host ""
Write-Host "=== 2. Register placeholder agent A ==="
& $forge script script/RegisterTestAgents.s.sol:RegisterTestAgents --sig "runAgentA()" --rpc-url $rpc --broadcast --private-key $privateKey --gas-estimate-multiplier 8000 -vvv
if ($LASTEXITCODE -ne 0) { throw "runAgentA failed" }

Write-Host ""
Write-Host "=== 3. Register placeholder agent B ==="
& $forge script script/RegisterTestAgents.s.sol:RegisterTestAgents --sig "runAgentB()" --rpc-url $rpc --broadcast --private-key $privateKey --gas-estimate-multiplier 8000 -vvv
if ($LASTEXITCODE -ne 0) { throw "runAgentB failed" }

Write-Host ""
Write-Host "Done. Update packages/config and docs/findings/resolverregistry.md"
