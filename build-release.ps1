#Requires -Version 5.1
<#
.SYNOPSIS
    PlanIt Release Build - bereitet den Android-Release vor und baut das AAB.

.DESCRIPTION
    1. local.properties mit Android-SDK-Pfad setzen
    2. Keystore-Variablen in gradle.properties schreiben
    3. versionCode in build.gradle erhoehen
    4. bundleRelease ausfuehren
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# -- Pfade --------------------------------------------------------------------
$ProjectRoot     = $PSScriptRoot
$AndroidDir      = Join-Path $ProjectRoot 'android'
$AppBuildGradle  = Join-Path $AndroidDir 'app\build.gradle'
$LocalProperties = Join-Path $AndroidDir 'local.properties'
$GradleProps     = Join-Path $AndroidDir 'gradle.properties'
$KeystoreConfig  = Join-Path $ProjectRoot 'keystore.properties'
$Gradlew         = Join-Path $AndroidDir 'gradlew.bat'

# -- Hilfsfunktionen ----------------------------------------------------------
function Write-Step  { param([string]$Msg) Write-Host "`n>> $Msg" -ForegroundColor Cyan }
function Write-OK    { param([string]$Msg) Write-Host "  [OK]  $Msg" -ForegroundColor Green }
function Write-Warn  { param([string]$Msg) Write-Host "  [!]  $Msg" -ForegroundColor Yellow }
function Write-Fail  { param([string]$Msg) Write-Host "`n  [X]  $Msg" -ForegroundColor Red; exit 1 }

function Read-KeystoreFile {
    param([string]$Path)
    $map = @{}
    foreach ($line in (Get-Content $Path)) {
        $line = $line.Trim()
        if ($line -match '^\s*#' -or $line -eq '') { continue }
        $parts = $line -split '=', 2
        if ($parts.Count -eq 2) { $map[$parts[0].Trim()] = $parts[1].Trim() }
    }
    return $map
}

function ConvertFrom-SecureStringPlain {
    param([System.Security.SecureString]$Secure)
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

# PS 5.1 Set-Content -Encoding UTF8 writes BOM — use this instead
function Write-UTF8NoBOM {
    param([string]$Path, [string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

# -- Banner -------------------------------------------------------------------
Write-Host ""
Write-Host "+==========================================+" -ForegroundColor Magenta
Write-Host "|       PlanIt  -  Release Build           |" -ForegroundColor Magenta
Write-Host "+==========================================+" -ForegroundColor Magenta

# -- Voraussetzungen pruefen --------------------------------------------------
Write-Step "Voraussetzungen pruefen"

if (-not (Test-Path $AndroidDir))     { Write-Fail "android/ Ordner nicht gefunden. Fuehre zuerst 'npx expo prebuild' aus." }
if (-not (Test-Path $AppBuildGradle)) { Write-Fail "android/app/build.gradle nicht gefunden." }
if (-not (Test-Path $Gradlew))        { Write-Fail "gradlew.bat nicht gefunden." }

# Java pruefen
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCmd) { Write-Fail "Java nicht gefunden. Bitte JDK installieren (https://adoptium.net)." }
Write-OK "Java gefunden: $($javaCmd.Source)"

# -- 1. local.properties ------------------------------------------------------
Write-Step "Android SDK Pfad setzen (local.properties)"

# SDK-Pfad ermitteln: erst Umgebungsvariablen, dann Standard-Speicherort
$sdkPath = $null
if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) {
    $sdkPath = $env:ANDROID_HOME
} elseif ($env:ANDROID_SDK_ROOT -and (Test-Path $env:ANDROID_SDK_ROOT)) {
    $sdkPath = $env:ANDROID_SDK_ROOT
} else {
    $default = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
    if (Test-Path $default) { $sdkPath = $default }
}

if (-not $sdkPath) {
    $sdkPath = Read-Host "  Android SDK Pfad nicht gefunden. Bitte eingeben (z.B. C:\Users\dein-name\AppData\Local\Android\Sdk)"
    if (-not (Test-Path $sdkPath)) { Write-Fail "Pfad '$sdkPath' existiert nicht." }
}

# Windows-Backslashes escapen (Gradle erwartet doppelte Backslashes oder Forward-Slashes)
$sdkPathGradle = $sdkPath -replace '\\', '\\\\'
Write-UTF8NoBOM -Path $LocalProperties -Content "sdk.dir=$sdkPathGradle`n"
Write-OK "local.properties geschrieben: sdk.dir=$sdkPath"

# -- 2. Keystore-Konfiguration ------------------------------------------------
Write-Step "Keystore-Konfiguration laden"

$ksMap = @{}

if (Test-Path $KeystoreConfig) {
    Write-OK "keystore.properties gefunden."
    $ksMap = Read-KeystoreFile -Path $KeystoreConfig
} else {
    Write-Warn "keystore.properties nicht gefunden - Werte werden abgefragt."
    Write-Host "  (Tipp: Erstelle '$KeystoreConfig' aus keystore.properties.example um das zu ueberspringen.)`n" -ForegroundColor DarkGray

    $ksMap['PLANIT_STORE_FILE']     = Read-Host "  Pfad zum Keystore (relativ zum Projektordner oder absolut)"
    $ksMap['PLANIT_STORE_PASSWORD'] = ConvertFrom-SecureStringPlain (Read-Host "  Store-Passwort" -AsSecureString)
    $ksMap['PLANIT_KEY_ALIAS']      = Read-Host "  Key-Alias"
    $ksMap['PLANIT_KEY_PASSWORD']   = ConvertFrom-SecureStringPlain (Read-Host "  Key-Passwort" -AsSecureString)
}

# Pflichtfelder pruefen
foreach ($key in @('PLANIT_STORE_FILE','PLANIT_STORE_PASSWORD','PLANIT_KEY_ALIAS','PLANIT_KEY_PASSWORD')) {
    if (-not $ksMap.ContainsKey($key) -or $ksMap[$key] -eq '') {
        Write-Fail "Keystore-Wert '$key' fehlt in keystore.properties."
    }
}

# Keystore-Datei-Pfad aufloesen und pruefen
$keystorePath = $ksMap['PLANIT_STORE_FILE']
if (-not [System.IO.Path]::IsPathRooted($keystorePath)) {
    $keystorePath = Join-Path $ProjectRoot $keystorePath
}
if (-not (Test-Path $keystorePath)) {
    Write-Fail "Keystore-Datei nicht gefunden: $keystorePath"
}
Write-OK "Keystore: $keystorePath"

# Pfad fuer Gradle: Forward-Slashes
$keystoreForGradle = $keystorePath -replace '\\', '/'

# gradle.properties schreiben (nur Signing-Variablen, bestehende Eintraege bleiben)
$existingProps = ''
if (Test-Path $GradleProps) {
    # Zeilen ohne unsere Variablen behalten
    $existingProps = (Get-Content $GradleProps |
        Where-Object { $_ -notmatch '^PLANIT_(STORE_FILE|STORE_PASSWORD|KEY_ALIAS|KEY_PASSWORD)\s*=' }) -join "`n"
    $existingProps += "`n"
}

$signingBlock = @"
PLANIT_STORE_FILE=$keystoreForGradle
PLANIT_STORE_PASSWORD=$($ksMap['PLANIT_STORE_PASSWORD'])
PLANIT_KEY_ALIAS=$($ksMap['PLANIT_KEY_ALIAS'])
PLANIT_KEY_PASSWORD=$($ksMap['PLANIT_KEY_PASSWORD'])
"@

Write-UTF8NoBOM -Path $GradleProps -Content ($existingProps + $signingBlock)
Write-OK "gradle.properties mit Signing-Variablen aktualisiert."

# -- 3. versionCode erhoehen --------------------------------------------------
Write-Step "versionCode erhoehen"

$buildContent = Get-Content $AppBuildGradle -Raw

if ($buildContent -notmatch 'versionCode\s+(\d+)') {
    Write-Fail "versionCode nicht in build.gradle gefunden."
}

$currentCode = [int]$Matches[1]
$newCode      = $currentCode + 1
$buildContent = $buildContent -replace 'versionCode\s+\d+', "versionCode $newCode"
Write-UTF8NoBOM -Path $AppBuildGradle -Content $buildContent

# versionName aus build.gradle lesen (nur anzeigen, nicht aendern)
$versionName = 'unbekannt'
if ($buildContent -match 'versionName\s+"([^"]+)"') { $versionName = $Matches[1] }

Write-OK "versionCode: $currentCode  ->  $newCode  (versionName: $versionName)"

# -- 4. bundleRelease ausfuehren ----------------------------------------------
Write-Step "Bundle Release bauen  (Das dauert ein paar Minuten...)"
Write-Host ""

Push-Location $AndroidDir
try {
    & cmd.exe /c "`"$Gradlew`" bundleRelease 2>&1"
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "gradlew bundleRelease schlug fehl (Exit-Code $LASTEXITCODE). Pruefe die Gradle-Ausgabe oben."
    }
} finally {
    Pop-Location
}

# -- Ergebnis -----------------------------------------------------------------
$aabPath = Join-Path $AndroidDir 'app\build\outputs\bundle\release\app-release.aab'

Write-Host ""
Write-Host "+==========================================+" -ForegroundColor Green
Write-Host "|        BUILD ERFOLGREICH  [OK]           |" -ForegroundColor Green
Write-Host "+==========================================+" -ForegroundColor Green
Write-Host ""
Write-OK "versionCode $newCode  |  versionName $versionName"

if (Test-Path $aabPath) {
    $sizeKB = [math]::Round((Get-Item $aabPath).Length / 1KB)
    Write-OK "AAB-Datei: $aabPath"
    Write-OK "Groesse: $sizeKB KB"
    Write-Host ""
    Write-Host "  Naechster Schritt: AAB in Google Play Console hochladen." -ForegroundColor DarkGray
} else {
    Write-Warn "AAB-Datei nicht am erwarteten Pfad. Gradle-Ausgabe oben pruefen."
}
Write-Host ""
