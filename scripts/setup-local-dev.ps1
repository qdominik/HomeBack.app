$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $PSScriptRoot)

function Invoke-Supabase {
  param(
    [Parameter(Mandatory = $true)]
    [string[]] $Arguments,
    [switch] $HideOutput
  )

  $output = & npx.cmd supabase @Arguments 2>&1

  if ($LASTEXITCODE -ne 0) {
    $output | Write-Host
    throw "Polecenie Supabase nie powiodlo sie: $($Arguments -join ' ')"
  }

  if ($HideOutput) {
    return ,$output
  }

  $output | Write-Host
}

Write-Host "Restart lokalnego Supabase..."

$stopOutput = & npx.cmd supabase stop 2>&1
if ($LASTEXITCODE -ne 0) {
  $stopOutput | Write-Host
  throw "Nie udalo sie zatrzymac lokalnego Supabase."
}

Invoke-Supabase -Arguments @("start") -HideOutput | Out-Null
Write-Host "Supabase uruchomiony."

Write-Host "Odtwarzanie bazy z migracji..."
Invoke-Supabase -Arguments @("db", "reset")

Write-Host "Testy schematu i RLS..."
Invoke-Supabase -Arguments @("test", "db")

$statusOutput = Invoke-Supabase -Arguments @("status", "-o", "env") -HideOutput
$values = @{}

foreach ($line in $statusOutput) {
  if ($line -match '^([A-Z0-9_]+)="?(.*?)"?$') {
    $values[$matches[1]] = $matches[2].TrimEnd('"')
  }
}

$apiUrl = $values["API_URL"]
$publishableKey = $values["ANON_KEY"]

if (-not $publishableKey) {
  $publishableKey = $values["PUBLISHABLE_KEY"]
}

if (-not $apiUrl -or -not $publishableKey) {
  throw "Nie znaleziono publicznego URL lub klucza Supabase."
}

@(
  "NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000"
  "NEXT_PUBLIC_SUPABASE_URL=$apiUrl"
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$publishableKey"
) | Set-Content -LiteralPath ".env.local" -Encoding ascii

Write-Host ""
Write-Host "Gotowe: migracje i testy przeszly, a .env.local zostal utworzony."
Write-Host "Klucze administracyjne nie zostaly zapisane w aplikacji."
