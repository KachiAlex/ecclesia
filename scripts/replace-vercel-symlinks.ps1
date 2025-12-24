param(
    [string]$OutputDir = "d:/ecclesia/.vercel/output"
)

$functionsDir = Join-Path $OutputDir "functions"
if (!(Test-Path $functionsDir)) {
    Write-Error "Functions directory not found: $functionsDir"
    exit 1
}

function Resolve-Symlink {
    param([System.IO.FileSystemInfo]$item)
    if (-not ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
        return
    }

    $target = [System.IO.DirectoryInfo]::new($item.FullName).LinkTarget
    if (-not $target) {
        Write-Warning "Skipping $($item.FullName): could not resolve target"
        return
    }

    $targetPath = if ([System.IO.Path]::IsPathRooted($target)) {
        $target
    } else {
        [System.IO.Path]::GetFullPath((Join-Path $item.DirectoryName $target))
    }

    $tempDir = New-Item -ItemType Directory -Path ([System.IO.Path]::GetTempFileName()) -Force
    Remove-Item $tempDir -Force
    $tempDir = New-Item -ItemType Directory -Path ([System.IO.Path]::GetTempFileName() + "_dir")

    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    $tempDir = New-Item -ItemType Directory -Path ([System.IO.Path]::GetTempFileName() + "_dir")

    Remove-Item $tempDir -Force
    New-Item -ItemType Directory -Path $tempDir | Out-Null

    Write-Host "Copying $targetPath -> $($item.FullName)"
    Copy-Item -Path $targetPath -Destination $tempDir -Recurse -Force

    Remove-Item $item.FullName -Force
    Move-Item -Path (Join-Path $tempDir (Split-Path $targetPath -Leaf)) -Destination $item.FullName
    Remove-Item $tempDir -Recurse -Force
}

Get-ChildItem -LiteralPath $functionsDir -Recurse -Force | ForEach-Object {
    Resolve-Symlink $_
}

Write-Host "Symlink replacement completed."
