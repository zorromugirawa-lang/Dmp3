@echo off
echo ========================================
echo FFmpeg Installer untuk Windows
echo ========================================
echo.

echo [1/5] Membuat folder FFmpeg...
if not exist "ffmpeg" mkdir ffmpeg
cd ffmpeg

echo.
echo [2/5] Mendownload FFmpeg binary untuk Windows...
echo Ini mungkin memakan waktu beberapa menit...

powershell -Command "& {Invoke-WebRequest -Uri 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip' -OutFile 'ffmpeg-release-essentials.zip'}"

if not exist "ffmpeg-release-essentials.zip" (
    echo ERROR: Gagal mendownload FFmpeg!
    echo Silakan download manual dari: https://www.gyan.dev/ffmpeg/builds/
    pause
    exit /b 1
)

echo.
echo [3/5] Mengekstrak FFmpeg...
powershell -Command "& {Expand-Archive -Path 'ffmpeg-release-essentials.zip' -DestinationPath '.' -Force}"

echo.
echo [4/5] Mencari folder FFmpeg...
for /d %%i in (ffmpeg-*) do (
    if exist "%%i\bin\ffmpeg.exe" (
        echo Ditemukan: %%i
        set FFMPEG_FOLDER=%%i
        goto :found
    )
)

echo ERROR: Folder FFmpeg tidak ditemukan!
pause
exit /b 1

:found
echo.
echo [5/5] Menyiapkan FFmpeg...
copy "%FFMPEG_FOLDER%\bin\ffmpeg.exe" "..\ffmpeg.exe"
copy "%FFMPEG_FOLDER%\bin\ffprobe.exe" "..\ffprobe.exe"

cd ..

echo.
echo ========================================
echo FFmpeg berhasil diinstall!
echo ========================================
echo.
echo File FFmpeg tersedia di:
echo   - ffmpeg.exe
echo   - ffprobe.exe
echo.
echo Testing FFmpeg...
ffmpeg.exe -version

echo.
echo FFmpeg siap digunakan!
echo Sekarang website YouTube downloader dapat mengkonversi ke MP3!
echo.
pause