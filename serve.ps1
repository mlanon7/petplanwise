# =====================================================
#  Pet Cost & Vet Bill Calculator — local dev server (PowerShell)
#  Usage:  powershell -ExecutionPolicy Bypass -File serve.ps1
#  Or, if execution policy is permissive:  ./serve.ps1
# =====================================================

$Port = 8080
$Root = $PSScriptRoot

Write-Host ""
Write-Host " Pet Cost & Vet Bill Calculator — local server" -ForegroundColor Cyan
Write-Host " ------------------------------------------------"
Write-Host " Trying to start on http://localhost:$Port/"
Write-Host ""

function Have-Cmd($name) { $null -ne (Get-Command $name -ErrorAction SilentlyContinue) }

if (Have-Cmd "npx") {
  Write-Host " > Found Node. Starting via npx serve..." -ForegroundColor Green
  Write-Host " > Open http://localhost:$Port/  (Ctrl+C to stop)"
  Write-Host ""
  npx --yes serve -l $Port $Root
  exit
}
if (Have-Cmd "py") {
  Write-Host " > Found Python (py launcher). Starting http.server..." -ForegroundColor Green
  Write-Host " > Open http://localhost:$Port/  (Ctrl+C to stop)"
  Write-Host ""
  py -3 -m http.server $Port --directory $Root
  exit
}
if (Have-Cmd "python") {
  Write-Host " > Found Python. Starting http.server..." -ForegroundColor Green
  Write-Host " > Open http://localhost:$Port/  (Ctrl+C to stop)"
  Write-Host ""
  python -m http.server $Port --directory $Root
  exit
}
if (Have-Cmd "php") {
  Write-Host " > Found PHP. Starting built-in server..." -ForegroundColor Green
  Write-Host " > Open http://localhost:$Port/  (Ctrl+C to stop)"
  Write-Host ""
  php -S "localhost:$Port" -t $Root
  exit
}

Write-Host " > No Node, Python, or PHP found on PATH." -ForegroundColor Yellow
Write-Host ""
Write-Host "   Install one (any of these works):"
Write-Host "     Node.js    https://nodejs.org/        (recommended)"
Write-Host "     Python     https://www.python.org/downloads/"
Write-Host "     PHP        https://windows.php.net/"
