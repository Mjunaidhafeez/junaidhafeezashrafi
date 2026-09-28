# ============================================
# DEPLOY PORTFOLIO TO SURGE.SH
# ============================================
# This will publish your portfolio at:
# https://junaidhafeezashrafi.surge.sh
#
# First time: email &password
# After that: It deploys instantly
# ============================================

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  DEPLOYING PORTFOLIO TO SURGE.SH" -ForegroundColor Cyan
Write-Host "  URL: junaidhafeezashrafi.surge.sh" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$portfolioPath = Split-Path -Parent $MyInvocation.MyCommand.Path

surge $portfolioPath --domain junaidhafeezashrafi.surge.sh

Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "  Visit: https://junaidhafeezashrafi.surge.sh" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Green

