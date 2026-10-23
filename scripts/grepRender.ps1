$files = @("src\components\BlockEditor.tsx","src\components\editor\ExtendedBlocksRenderer.tsx")
foreach ($f in $files) {
  Select-String -Path $f -Pattern "bookmark", "\[\[", "wikilink", "case 'card'", "'button'", "'toggle'", "'columns_2'", "'stat_grid'", "'pros_cons'", "'mermaid'", "'embed'" | Select-Object -First 60 | ForEach-Object { "{0}:{1}: {2}" -f (Split-Path $_.Path -Leaf), $_.LineNumber, $_.Line.Trim().Substring(0, [Math]::Min(150, $_.Line.Trim().Length)) }
}
