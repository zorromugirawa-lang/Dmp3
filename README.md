# YouTube MP3/MP4 Downloader

Website untuk mengkonversi dan mendownload video YouTube ke format MP3 atau MP4 dengan antarmuka yang modern dan mudah digunakan.

## Fitur

- ✅ Konversi video YouTube ke MP3 (audio only)
- ✅ Download video YouTube dalam format MP4
- ✅ Pilihan kualitas yang beragam (360p - 1080p untuk video, 96kbps - 320kbps untuk audio)
- ✅ Antarmuka yang responsive dan modern
- ✅ Progress bar real-time
- ✅ Preview video sebelum download
- ✅ Cleanup otomatis file lama

## Persyaratan Sistem

- Python 3.7 atau lebih baru
- FFmpeg (untuk konversi audio)
- Koneksi internet

## Instalasi

### 1. Clone atau Download Project

```bash
git clone <repository-url>
cd "MP3 DOWNLOAD"
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Install FFmpeg

#### Windows:
1. Download FFmpeg dari https://ffmpeg.org/download.html
2. Extract ke folder (misal: C:\ffmpeg)
3. Tambahkan C:\ffmpeg\bin ke PATH environment variable

#### macOS:
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install ffmpeg
```

### 4. Verifikasi Instalasi

Pastikan yt-dlp dan ffmpeg terinstall dengan benar:

```bash
yt-dlp --version
ffmpeg -version
```

## Cara Menjalankan

1. Buka terminal/command prompt di folder project
2. Jalankan server Python:

```bash
python server.py
```

3. Buka browser dan akses: `http://localhost:5000`

## Cara Penggunaan

1. **Masukkan URL YouTube**: Copy-paste link video YouTube ke input field
2. **Klik Analisis**: Website akan mengambil informasi video (judul, durasi, thumbnail)
3. **Pilih Format**: Pilih MP3 (audio only) atau MP4 (video dengan audio)
4. **Pilih Kualitas**: Sesuaikan kualitas sesuai kebutuhan
5. **Klik Download**: Tunggu proses konversi selesai
6. **Download File**: Klik tombol download untuk menyimpan file

## Struktur Project

```
MP3 DOWNLOAD/
├── index.html          # Halaman utama website
├── style.css           # Styling dan desain UI
├── script.js           # JavaScript frontend
├── server.py           # Backend Flask server
├── requirements.txt    # Python dependencies
├── README.md          # Dokumentasi ini
├── downloads/         # Folder untuk file hasil download (dibuat otomatis)
└── temp/             # Folder temporary (dibuat otomatis)
```

## API Endpoints

- `GET /` - Halaman utama
- `POST /api/analyze` - Analisis video YouTube
- `POST /api/download` - Mulai proses download
- `GET /api/progress/<task_id>` - Cek progress download
- `GET /api/file/<task_id>/<filename>` - Download file hasil konversi

## Konfigurasi

Anda dapat mengubah konfigurasi di file `server.py`:

- `DOWNLOAD_FOLDER`: Folder untuk menyimpan file hasil download
- `MAX_FILE_AGE`: Waktu maksimal file disimpan (default: 1 jam)
- Port server (default: 5000)

## Troubleshooting

### Error "yt-dlp not found"
```bash
pip install --upgrade yt-dlp
```

### Error "ffmpeg not found"
Pastikan FFmpeg sudah terinstall dan ada di PATH system.

### Error "Permission denied"
Pastikan folder project memiliki permission write untuk membuat folder downloads dan temp.

### Video tidak bisa didownload
- Pastikan URL YouTube valid
- Beberapa video mungkin dibatasi geografis atau memiliki copyright protection
- Coba dengan video lain untuk memastikan sistem berfungsi

## Catatan Penting

- **Legal**: Pastikan Anda memiliki hak untuk mendownload konten yang dipilih
- **Copyright**: Hormati hak cipta pembuat konten
- **Penggunaan**: Tool ini untuk penggunaan pribadi dan edukatif
- **Performa**: Download speed tergantung koneksi internet dan ukuran file

## Kontribusi

Jika Anda ingin berkontribusi pada project ini:

1. Fork repository
2. Buat branch baru untuk fitur Anda
3. Commit perubahan
4. Push ke branch
5. Buat Pull Request

## Lisensi

Project ini dibuat untuk tujuan edukatif. Gunakan dengan bijak dan hormati hak cipta.

## Support

Jika mengalami masalah, pastikan:
1. Semua dependencies terinstall dengan benar
2. FFmpeg berfungsi normal
3. Koneksi internet stabil
4. URL YouTube valid dan dapat diakses

---

**Selamat menggunakan YouTube Downloader! 🎵📹**