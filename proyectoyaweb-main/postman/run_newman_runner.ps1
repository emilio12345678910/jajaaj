# Ejecuta la colección Postman con Newman y aplica un delay de 2 minutos (120000 ms) entre requests.
# Requisitos:
# 1) Node.js instalado
# 2) Newman instalado globalmente: npm i -g newman

$collection = Join-Path -Path $PSScriptRoot -ChildPath 'YA_postman_collection_runner.json'
if (!(Test-Path $collection)) {
    Write-Error "No se encontró la colección: $collection"
    exit 1
}

Write-Host "Ejecutando colección con delay de 1 minuto entre requests..."
# Ejecuta newman con --delay-request 60000 (ms) (1 minuto)
$newmanCmd = "newman run `"$collection`" --delay-request 60000 --verbose"
Invoke-Expression $newmanCmd
