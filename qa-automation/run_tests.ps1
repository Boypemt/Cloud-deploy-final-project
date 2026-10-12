# Windows (PowerShell) helper:  .\run_tests.ps1            -> all ready tests
#                              .\run_tests.ps1 -Tag Smoke  -> only Smoke
param([string]$Tag = "")
if (-not $env:BASE_URL) { $env:BASE_URL = "http://localhost:8080" }
if ($Tag) { robot --outputdir results --exclude wip --include $Tag tests }
else      { robot --outputdir results --exclude wip tests }
