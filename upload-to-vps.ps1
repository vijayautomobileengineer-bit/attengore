param(
    [Parameter(Mandatory=$true)]
    [string]$VpsIP
)

Write-Host "Uploading to VPS $VpsIP ..." -ForegroundColor Cyan

# Upload frontend build
Write-Host "Uploading dist/ ..."
scp -r dist/ root@${VpsIP}:/var/www/attengore/

# Upload backend
Write-Host "Uploading server/ ..."
scp -r server/ root@${VpsIP}:/var/www/attengore/

# Upload setup script
Write-Host "Uploading setup script ..."
scp setup-vps.sh root@${VpsIP}:/root/setup-vps.sh

# Run setup on VPS
Write-Host "Running setup on VPS ..." -ForegroundColor Yellow
ssh root@${VpsIP} "chmod +x /root/setup-vps.sh && bash /root/setup-vps.sh"

Write-Host ""
Write-Host "Done! Visit: http://$VpsIP/clowi/" -ForegroundColor Green
