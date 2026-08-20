$port = 3000
$root = $PSScriptRoot

Write-Host "=========================================="
Write-Host "STARTING RETRO CHAT SERVER ON PORT $port"
Write-Host "=========================================="

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
  $listener.Start()
  Write-Host "Server running at: http://localhost:$port/"
  Start-Process "http://localhost:$port/"
} catch {
  Write-Host "Opening index.html directly..."
  Start-Process "$root\index.html"
  exit
}

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response

  $localPath = $request.Url.LocalPath
  if ($localPath -eq "/" -or [string]::IsNullOrEmpty($localPath)) {
    $localPath = "/index.html"
  }

  $filePath = Join-Path $root $localPath.TrimStart('/')

  if (Test-Path $filePath -PathType Leaf) {
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
    
    if ($ext -eq ".html") {
      $response.ContentType = "text/html; charset=utf-8"
    } elseif ($ext -eq ".css") {
      $response.ContentType = "text/css; charset=utf-8"
    } elseif ($ext -eq ".js") {
      $response.ContentType = "application/javascript; charset=utf-8"
    } elseif ($ext -eq ".json") {
      $response.ContentType = "application/json; charset=utf-8"
    } elseif ($ext -eq ".png") {
      $response.ContentType = "image/png"
    } else {
      $response.ContentType = "application/octet-stream"
    }
    
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $response.StatusCode = 404
  }
  $response.Close()
}
