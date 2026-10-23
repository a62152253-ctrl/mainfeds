$root = (Get-Location).Path
$files = Get-ChildItem -Path src,test -Recurse -File -Include *.ts,*.tsx
$rows = foreach ($f in $files) {
  $n = (Get-Content $f.FullName | Measure-Object -Line).Lines
  [pscustomobject]@{ Lines = $n; File = $f.FullName.Replace($root, '') }
}
$rows | Sort-Object Lines -Descending | Select-Object -First 40 | Format-Table -AutoSize
"TOTAL: " + ($rows | Measure-Object Lines -Sum).Sum
"FILES: " + $rows.Count
