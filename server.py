from flask import Flask, request, jsonify, send_file, render_template
from flask_cors import CORS
import yt_dlp
import os
import uuid
import threading
import time
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# Configuration
DOWNLOAD_FOLDER = 'downloads'
TEMP_FOLDER = 'temp'
MAX_FILE_AGE = 3600  # 1 hour in seconds

# Create necessary directories
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)
os.makedirs(TEMP_FOLDER, exist_ok=True)

# Global storage for download tasks
download_tasks = {}

class DownloadProgress:
    def __init__(self, task_id):
        self.task_id = task_id
        self.progress = 0
        self.status = 'starting'
        self.message = 'Memulai download...'
        self.error = None
        self.download_url = None
        self.filename = None

def progress_hook(d, task_id):
    """Progress hook for yt-dlp"""
    if task_id not in download_tasks:
        return
    
    task = download_tasks[task_id]
    
    if d['status'] == 'downloading':
        if 'total_bytes' in d and d['total_bytes']:
            percentage = (d['downloaded_bytes'] / d['total_bytes']) * 100
            task.progress = percentage
            task.message = f"Mendownload... {d['downloaded_bytes']}/{d['total_bytes']} bytes"
        elif '_percent_str' in d:
            # Extract percentage from string
            percent_str = d['_percent_str'].strip().replace('%', '')
            try:
                task.progress = float(percent_str)
                task.message = f"Mendownload... {percent_str}%"
            except:
                task.progress = 0
                task.message = "Mendownload..."
    elif d['status'] == 'finished':
        task.progress = 100
        task.message = 'Download selesai!'
        task.status = 'completed'
        task.filename = os.path.basename(d['filename'])
        task.download_url = f'/api/file/{task_id}/{task.filename}'

def get_video_info(url):
    """Get video information without downloading"""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            return {
                'success': True,
                'video': {
                    'title': info.get('title', 'Unknown Title'),
                    'duration': info.get('duration', 0),
                    'uploader': info.get('uploader', 'Unknown Channel'),
                    'thumbnail': info.get('thumbnail', ''),
                    'view_count': info.get('view_count', 0),
                    'upload_date': info.get('upload_date', ''),
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

def download_video(url, format_type, quality, task_id):
    """Download video in background thread"""
    try:
        task = download_tasks[task_id]
        task.status = 'downloading'
        task.message = 'Mempersiapkan download...'
        
        # Configure yt-dlp options based on format
        if format_type == 'mp3':
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': os.path.join(DOWNLOAD_FOLDER, f'{task_id}_%(title)s.%(ext)s'),
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '320' if quality == 'best' else quality,
                }],
                'progress_hooks': [lambda d: progress_hook(d, task_id)],
                'quiet': True,
                'no_warnings': True,
            }
        else:  # mp4
            if quality == 'best':
                format_selector = 'best[ext=mp4]/best'
            else:
                format_selector = f'best[height<={quality[:-1]}][ext=mp4]/best[height<={quality[:-1]}]'
            
            ydl_opts = {
                'format': format_selector,
                'outtmpl': os.path.join(DOWNLOAD_FOLDER, f'{task_id}_%(title)s.%(ext)s'),
                'progress_hooks': [lambda d: progress_hook(d, task_id)],
                'quiet': True,
                'no_warnings': True,
            }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
            
        # If we reach here, download was successful
        if task.status != 'completed':
            task.status = 'completed'
            task.progress = 100
            task.message = 'Download berhasil!'
            
    except Exception as e:
        task = download_tasks[task_id]
        task.status = 'error'
        task.error = str(e)
        task.message = f'Error: {str(e)}'

def cleanup_old_files():
    """Clean up old downloaded files"""
    try:
        current_time = time.time()
        for filename in os.listdir(DOWNLOAD_FOLDER):
            file_path = os.path.join(DOWNLOAD_FOLDER, filename)
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getctime(file_path)
                if file_age > MAX_FILE_AGE:
                    os.remove(file_path)
                    print(f"Cleaned up old file: {filename}")
    except Exception as e:
        print(f"Error during cleanup: {e}")

@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_file('index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_file(filename)

@app.route('/api/analyze', methods=['POST'])
def analyze_video():
    """Analyze YouTube video and return metadata"""
    try:
        data = request.get_json()
        url = data.get('url')
        
        if not url:
            return jsonify({'success': False, 'error': 'URL tidak ditemukan'})
        
        result = get_video_info(url)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/download', methods=['POST'])
def start_download():
    """Start video download process"""
    try:
        data = request.get_json()
        url = data.get('url')
        format_type = data.get('format', 'mp3')
        quality = data.get('quality', 'best')
        
        if not url:
            return jsonify({'success': False, 'error': 'URL tidak ditemukan'})
        
        # Generate unique task ID
        task_id = str(uuid.uuid4())
        
        # Create download task
        download_tasks[task_id] = DownloadProgress(task_id)
        
        # Start download in background thread
        thread = threading.Thread(
            target=download_video,
            args=(url, format_type, quality, task_id)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'taskId': task_id,
            'message': 'Download dimulai'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/progress/<task_id>')
def get_progress(task_id):
    """Get download progress for a task"""
    try:
        if task_id not in download_tasks:
            return jsonify({'error': 'Task tidak ditemukan'}), 404
        
        task = download_tasks[task_id]
        
        response = {
            'status': task.status,
            'progress': task.progress,
            'message': task.message
        }
        
        if task.status == 'completed':
            response['downloadUrl'] = task.download_url
            response['filename'] = task.filename
        elif task.status == 'error':
            response['error'] = task.error
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/file/<task_id>/<filename>')
def download_file(task_id, filename):
    """Serve downloaded file"""
    try:
        file_path = os.path.join(DOWNLOAD_FOLDER, f"{task_id}_{filename}")
        
        if not os.path.exists(file_path):
            # Try to find file with task_id prefix
            for file in os.listdir(DOWNLOAD_FOLDER):
                if file.startswith(task_id):
                    file_path = os.path.join(DOWNLOAD_FOLDER, file)
                    break
            else:
                return jsonify({'error': 'File tidak ditemukan'}), 404
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cleanup', methods=['POST'])
def manual_cleanup():
    """Manual cleanup endpoint"""
    try:
        cleanup_old_files()
        return jsonify({'success': True, 'message': 'Cleanup berhasil'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# Background cleanup task
def background_cleanup():
    """Run cleanup periodically"""
    while True:
        time.sleep(1800)  # Run every 30 minutes
        cleanup_old_files()

if __name__ == '__main__':
    # Start background cleanup thread
    cleanup_thread = threading.Thread(target=background_cleanup)
    cleanup_thread.daemon = True
    cleanup_thread.start()
    
    print("YouTube Downloader Server Starting...")
    print("Server akan berjalan di: http://localhost:5000")
    print("Pastikan yt-dlp dan ffmpeg sudah terinstall!")
    
    app.run(debug=True, host='0.0.0.0', port=5000)