#$image_name = "sdparitetsu/api"
#
#$json = (Get-Content package.json -raw) -join "`n" | ConvertFrom-Json
#$version = $json.version
#
#if($version -match "(?<=\d+\.\d+\.)(?<bv>\d+)") {$version = $version -replace "(?<=\d+\.\d+\.)(\d+)", ("{0}" -f (([int]::Parse($matches.bv)+1)))}
#elseif ($version -match "(?<=\d+\.)(?<bv>\d+)") {$version = $version -replace "(?<=\d+\.)(\d+)", ("{0}" -f (([int]::Parse($matches.bv)+1)))}
#
#$new_version = Read-Host -Prompt "Build '$image_name' as version: '$version'?`nBlank to accept or enter your version"
#if ($new_version -match "\d{1,3}\.\d{1,3}?\.\d{1,3}") {$version = $new_version}
#elseif ($new_version) {Write-output 'Incorrect version provided'; exit 1}
#
#$json.version = $version
#$json | ConvertTo-Json -depth 32 |
#   % { [System.Text.RegularExpressions.Regex]::Unescape($_) } |
#   % { [System.Text.RegularExpressions.Regex]::Replace($_, '[ ]{4}[ ]{4,}', "        ") } |
#   % { [System.Text.RegularExpressions.Regex]::Replace($_, ':[ ]{2}', ": ") } |
#   Out-File 'package.json' -Encoding UTF8 -Force
#Write-output "Build as version '${version}'..."
#
#if (Test-Path -Path 'dist') {rm -r -fo dist}
#
#Write-output "`nCreate image..."
#docker build --pull --rm -f "Dockerfile" -t ${image_name}:latest -t ${image_name}:$version "."
#
#$publish = Read-Host -Prompt "`nPublish? [(Y)es/(N)o]"
#$pass = @('Y','y','Yes','YES','yes')
#
#if ($publish -eq "") {
#   $publish = "Y"
#}
#
#if ($pass -contains $publish)
#{
#   Write-output 'Publishing...'
#   docker image push ${image_name}:$version
#   docker image push ${image_name}:latest
#}
#
#Write-output "`nDone."

# Clear output
Clear-Host


# Get PowerShell version
$ps_version = $PSVersionTable.PSVersion
Write-output "PS version: '${ps_version}'"


# Get package.json content
$json = (Get-Content package.json -raw) -join "`n" | ConvertFrom-Json
$version = $json.version
$name = $json.name
$nameU = $name.ToUpper()



# Name check
$new_name = ""
while ($new_name -eq [string]::empty) {
   $new_name = Read-Host -Prompt "`nImage name: ${nameU}`nType new name or leave blank"
   if($new_name -ne [string]::empty -and $new_name -ne $name) {
      if ($new_name.length -lt 3) {
         Write-Output "New name too short`nTry again or leave blank.`n"
         $new_name = ""
      }
      else {
         $name = $new_name
      }
   }
   $new_name = $name
}
$nameU = $name.ToUpper()



# Version increment
if($version -match "(?<=\d+\.\d+\.)(?<bv>\d+)") {$version = $version -replace "(?<=\d+\.\d+\.)(\d+)", ("{0}" -f (([int]::Parse($matches.bv)+1)))}
elseif ($version -match "(?<=\d+\.)(?<bv>\d+)") {$version = $version -replace "(?<=\d+\.)(\d+)", ("{0}" -f (([int]::Parse($matches.bv)+1)))}



# Version check
$new_version = ""
while ($new_version -eq [string]::empty) {
   $new_version = Read-Host -Prompt "`nNew image version is ${version}`nType your own or leave blank"
   if($new_version -ne [string]::empty -and $new_version -ne $version) {
      if ($new_version -notmatch "\d{1,3}\.\d{1,3}?\.\d{1,3}") {
         Write-Output "New version format is incorrect.`nTry again or leave blank.`n"
         $new_version = ""
      }
      else {
         $version = $new_version
      }
   }
   $new_version = $version
}



# Update package file
$json.name = $name
$json.version = $version
$json | ConvertTo-Json -depth 32 |
   ForEach-Object { [System.Text.RegularExpressions.Regex]::Unescape($_) } |
   ForEach-Object { [System.Text.RegularExpressions.Regex]::Replace($_, '[ ]{4}[ ]{4,}', "        ") } |
   ForEach-Object { [System.Text.RegularExpressions.Regex]::Replace($_, ':[ ]{2}', ": ") } |
   ForEach-Object { [System.Text.RegularExpressions.Regex]::Replace($_, '[ ]{4}[}]', "}") } |
   New-Item 'package.json' -ItemType File -Force | Out-Null
#   Out-File 'package.json' -Encoding UTF8 -Force



# Build source
Write-output "`nBuilding project..."
if (Test-Path -Path 'dist') {Remove-Item -r -fo dist}
npm run build



# Build image
$image_name = "sdparitetsu/${name}"
Write-output "Image path: '${image_name}'`n"
Write-output "`nCreate image..."
docker build --pull --rm -f "Dockerfile" -t ${image_name}:latest -t ${image_name}:$version "."



# Publish
$publish = Read-Host -Prompt "`nPublish? [(Y)es/(N)o]"
$pass = @('Y','y','Yes','YES','yes')

if ($publish -eq "") {
   $publish = "Y"
}

if ($pass -contains $publish)
{
   Write-output '`nPublishing...'
   docker image push ${image_name}:latest
   docker image push ${image_name}:$version
}



# Done
Write-output "`nDone."
