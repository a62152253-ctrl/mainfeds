$p = "src"
Get-ChildItem -Recurse -Path $p -Include *.tsx,*.ts | Select-String -Pattern "page:", "internalLink", "pageLink", "getBacklinks", "WikiLink", "sp-page" | Select-Object -First 40 | ForEach-Object { "{0}:{1}: {2}" -f $_.Path.Replace((Get-Location).Path,''), $_.LineNumber, $_.Line.Trim() }
