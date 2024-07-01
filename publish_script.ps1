$image_name = "sdparitetsu/api"

$json = (Get-Content package.json -raw) -join "`n" | ConvertFrom-Json
$version = $json.version

if($version -match "(?<=\d+\.\d+\.)(?<bv>\d+)") {$version = $version -replace "(?<=\d+\.\d+\.)(\d+)", ("{0}" -f (([int]::Parse($matches.bv)+1)))}
elseif ($version -match "(?<=\d+\.)(?<bv>\d+)") {$version = $version -replace "(?<=\d+\.)(\d+)", ("{0}" -f (([int]::Parse($matches.bv)+1)))}

$new_version = Read-Host -Prompt "Build '$image_name' as version: '$version'?`nBlank to accept or enter your version"
if ($new_version -match "\d{1,3}\.\d{1,3}?\.\d{1,3}") {$version = $new_version}
elseif ($new_version) {Write-output 'Incorrect version provided'; exit 1}

$json.version = $version
$json | ConvertTo-Json -depth 32 |
   % { [System.Text.RegularExpressions.Regex]::Unescape($_) } |
   % { [System.Text.RegularExpressions.Regex]::Replace($_, '[ ]{4}[ ]{4,}', "        ") } |
   % { [System.Text.RegularExpressions.Regex]::Replace($_, ':[ ]{2}', ": ") } |
   Out-File 'package.json' -Encoding UTF8 -Force
Write-output "Build as version '${version}'..."

if (Test-Path -Path 'dist') {rm -r -fo dist}

Write-output "`nCreate image..."
docker build --pull --rm -f "Dockerfile" -t ${image_name}:latest -t ${image_name}:$version "."

$publish = Read-Host -Prompt "`nPublish? [(Y)es/(N)o]"
$pass = @('Y','y','Yes','YES','yes')
if ($pass -contains $publish)
{
   Write-output '`nPublishing...'
   docker image push ${image_name}:latest
   docker image push ${image_name}:$version
}

Write-output "`nDone."
