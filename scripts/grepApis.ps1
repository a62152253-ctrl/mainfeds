Select-String -Path "src\components\BlockEditor.tsx" -Pattern "buttonUrl" | Select-Object -First 25 | ForEach-Object { "{0}: {1}" -f $_.LineNumber, $_.Line.Trim().Substring(0, [Math]::Min(170, $_.Line.Trim().Length)) }
"----- wikipediaService exports"
Select-String -Path "src\features\ai\wikipediaService.ts" -Pattern "^export" | ForEach-Object { "{0}: {1}" -f $_.LineNumber, $_.Line.Trim() }
"----- multiSource exports"
Select-String -Path "src\features\ai\multiSourceResearchService.ts" -Pattern "^export|^async function|^function" | ForEach-Object { "{0}: {1}" -f $_.LineNumber, $_.Line.Trim() }
"----- webSearchService exports"
Select-String -Path "src\features\ai\webSearchService.ts" -Pattern "^export" | ForEach-Object { "{0}: {1}" -f $_.LineNumber, $_.Line.Trim() }
"----- noteOpsService exports"
Select-String -Path "src\features\ai\noteOpsService.ts" -Pattern "^export" | ForEach-Object { "{0}: {1}" -f $_.LineNumber, $_.Line.Trim() }
"----- markdownToBlocks exports"
Select-String -Path "src\features\ai\markdownToBlocks.ts" -Pattern "^export" | ForEach-Object { "{0}: {1}" -f $_.LineNumber, $_.Line.Trim() }
