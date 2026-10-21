param(
  [string]$ProjectId = 'real-estate-dev-c4a6d',
  [string]$Origin = 'http://localhost:4200'
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http
$client = New-Object System.Net.Http.HttpClient
$client.Timeout = [TimeSpan]::FromSeconds(60)
$endpoint = "https://us-east1-$ProjectId.cloudfunctions.net/discardOfferDraft"
try {
  $request = New-Object System.Net.Http.HttpRequestMessage
  $request.Method = [System.Net.Http.HttpMethod]::new('OPTIONS')
  $request.RequestUri = [Uri]$endpoint
  $request.Headers.Add('Origin', $Origin)
  $request.Headers.Add('Access-Control-Request-Method', 'POST')
  $request.Headers.Add('Access-Control-Request-Headers', 'content-type,authorization')
  $response = $client.SendAsync($request).GetAwaiter().GetResult()
  $status = [int]$response.StatusCode
  $allowOrigin = ($response.Headers | Where-Object Key -eq 'Access-Control-Allow-Origin').Value -join ','
  $allowHeaders = ($response.Headers | Where-Object Key -eq 'Access-Control-Allow-Headers').Value -join ','
  Write-Host "Draft endpoint: $endpoint"
  Write-Host "OPTIONS status: $status; allowed origin: $allowOrigin"
  if ($status -lt 200 -or $status -ge 300 -or ($allowOrigin -ne $Origin -and $allowOrigin -ne '*') -or $allowHeaders -notmatch 'authorization' -or $allowHeaders -notmatch 'content-type') {
    throw 'Draft callable preflight failed. A 404 indicates a missing endpoint; a 401/403 can indicate invocation access. Send this output and the deployment output.'
  }
  $response.Dispose()
  $request.Dispose()
  # Anonymous request must fail authentication before reading or deleting any offer.
  $request = New-Object System.Net.Http.HttpRequestMessage
  $request.Method = [System.Net.Http.HttpMethod]::Post
  $request.RequestUri = [Uri]$endpoint
  $request.Headers.Add('Origin', $Origin)
  $request.Content = [System.Net.Http.StringContent]::new('{"data":{}}', [Text.Encoding]::UTF8, 'application/json')
  $response = $client.SendAsync($request).GetAwaiter().GetResult()
  $status = [int]$response.StatusCode
  $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
  $allowOrigin = ($response.Headers | Where-Object Key -eq 'Access-Control-Allow-Origin').Value -join ','
  Write-Host "Anonymous POST status: $status"
  if ($status -ne 401 -or ($body | ConvertFrom-Json).error.status -ne 'UNAUTHENTICATED' -or ($allowOrigin -ne $Origin -and $allowOrigin -ne '*')) {
    Write-Host $body
    throw 'The endpoint did not return the expected callable authentication response. Send this output.'
  }
  Write-Host 'PASS: deployed endpoint handles browser preflight and rejects anonymous deletion. This does not test authenticated draft deletion.'
  $response.Dispose()
  $request.Dispose()
} finally {
  $client.Dispose()
}
