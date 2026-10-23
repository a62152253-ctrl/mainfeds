Write-Host "Budowanie aplikacji Vite..." -ForegroundColor Cyan
npm run build

Write-Host "Kopiowanie .htaccess..." -ForegroundColor Cyan
Copy-Item -Path ".htaccess" -Destination "dist\.htaccess" -Force

Write-Host "Wysylanie plikow na serwer..." -ForegroundColor Cyan
scp -P 22222 -i c:\Users\arimo\.ssh\swith_homepl_ed25519 -r dist/* serwer2665582@serwer2665582.hosting-home.pl:/home/serwer2665582/public_html/
scp -P 22222 -i c:\Users\arimo\.ssh\swith_homepl_ed25519 -r dist/* serwer2665582@serwer2665582.hosting-home.pl:/home/serwer2665582/domains/searchpoint.pl/public_html/

Write-Host "Ustawianie uprawnien 755 na serwerze..." -ForegroundColor Cyan
ssh -p 22222 -i c:\Users\arimo\.ssh\swith_homepl_ed25519 serwer2665582@serwer2665582.hosting-home.pl "chmod -R 755 /home/serwer2665582/public_html/ && chmod -R 755 /home/serwer2665582/domains/searchpoint.pl/public_html/"

Write-Host "Wdrozenie zakonczone sukcesem!" -ForegroundColor Green
