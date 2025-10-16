@echo off
echo ========================================
echo YouTube MP3/MP4 Downloader - Installer
echo ========================================
echo.

echo [1/4] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python tidak ditemukan!
    echo Silakan install Python dari https://python.org
    pause
    exit /b 1
)
echo Python ditemukan!

echo.
echo [2/4] Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Gagal menginstall dependencies!
    pause
    exit /b 1
)

echo.
echo [3/4] Checking FFmpeg...
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    echo WARNING: FFmpeg tidak ditemukan!
    echo FFmpeg diperlukan untuk konversi audio ke MP3.
    echo Silakan download dari: https://ffmpeg.org/download.html
    echo Atau gunakan chocolatey: choco install ffmpeg
    echo.
    echo Lanjutkan tanpa FFmpeg? (y/n)
    set /p continue=
    if /i not "%continue%"=="y" (
        exit /b 1
    )
) else (
    echo FFmpeg ditemukan!
)

echo.
echo [4/4] Creating directories...
if not exist "downloads" mkdir downloads
if not exist "temp" mkdir temp

echo.
echo ========================================
echo Instalasi selesai!
echo ========================================
echo.
echo Untuk menjalankan server:
echo   python server.py
echo.
echo Kemudian buka browser dan akses:
echo   http://localhost:5000
echo.
pause