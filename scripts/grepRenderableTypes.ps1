$types = @{}
foreach ($f in @("src\components\BlockEditor.tsx","src\components\editor\ExtendedBlocksRenderer.tsx","src\components\PublicPageView.tsx")) {
  $c = Get-Content $f -Raw
  $ms = [regex]::Matches($c, "type === '([a-z_0-9]+)'")
  foreach ($m in $ms) { $k = $m.Groups[1].Value; if (-not $types.ContainsKey($k)) { $types[$k] = @() }; if ($types[$k] -notcontains (Split-Path $f -Leaf)) { $types[$k] += (Split-Path $f -Leaf) } }
  $ms2 = [regex]::Matches($c, "case '([a-z_0-9]+)':")
  foreach ($m in $ms2) { $k = $m.Groups[1].Value; if (-not $types.ContainsKey($k)) { $types[$k] = @() }; if ($types[$k] -notcontains ((Split-Path $f -Leaf) + "(case)")) { $types[$k] += ((Split-Path $f -Leaf) + "(case)") } }
}
$types.GetEnumerator() | Sort-Object Name | ForEach-Object { "{0,-24} {1}" -f $_.Name, ($_.Value -join ', ') }
"--- ExtendedBlocksRenderer exports/props"
Select-String -Path "src\components\editor\ExtendedBlocksRenderer.tsx" -Pattern "^export|isExtendedBlockType|EXTENDED" | ForEach-Object { "{0}: {1}" -f $_.LineNumber, $_.Line.Trim() }
