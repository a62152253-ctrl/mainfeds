$names = 'user_story','math_equation_card','stepper','pros_cons_matrix','interactive_poll','embed_figma','team_directory','persona_card','release_notes','data_metric_bar'
$files = Get-ChildItem src -Recurse -Include *.tsx
foreach ($t in $names) {
  $hits = @()
  foreach ($f in $files) {
    $m = Select-String -Path $f.FullName -SimpleMatch $t
    if ($m) { $hits += ("{0}x{1}" -f $f.Name, $m.Count) }
  }
  "{0,-20} => {1}" -f $t, ($hits -join ', ')
}
