# CTF Writeup Studio - PowerShell Integration Hook
# Automatically logs executed commands and outputs to the active CTF session

param (
    [string]$SessionId = $env:CTF_SESSION_ID,
    [string]$ChallengeId = $env:CTF_CHALLENGE_ID,
    [string]$BackendUrl = "http://127.0.0.1:8000/api/v1"
)

function Invoke-CTFCommand {
    param (
        [string]$Command,
        [string]$Note = ""
    )

    if (-not $SessionId) {
        Write-Host "[-] CTF_SESSION_ID environment variable not set. Please start a session in CTF Writeup Studio." -ForegroundColor Yellow
        Invoke-Expression $Command
        return
    }

    Write-Host "[CTF-Studio] Executing: $Command" -ForegroundColor DarkCyan
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    
    try {
        $output = Invoke-Expression $Command 2>&1 | Out-String
        $exitCode = $LASTEXITCODE
        if ($null -eq $exitCode) { $exitCode = 0 }
    } catch {
        $output = $_.Exception.Message
        $exitCode = 1
    }
    
    $sw.Stop()
    $durationMs = $sw.ElapsedMilliseconds
    
    Write-Output $output

    $body = @{
        session_id = $SessionId
        challenge_id = $ChallengeId
        command = $Command
        stdout = $output
        stderr = ""
        exit_code = $exitCode
        duration_ms = $durationMs
        cwd = (Get-Location).Path
        shell = "powershell"
        user_note = $Note
    } | ConvertTo-Json

    try {
        Invoke-RestMethod -Uri "$BackendUrl/sessions/command" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 2 | Out-Null
    } catch {
        # Quiet failover if backend is disconnected
    }
}

Set-Alias -Name ctf-exec -Value Invoke-CTFCommand
Write-Host "[+] CTF Writeup Studio PowerShell hook loaded. Use 'ctf-exec <command>' to log commands." -ForegroundColor Green
