class YouTubeDownloader {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentVideoData = null;
    }

    initializeElements() {
        this.urlInput = document.getElementById('youtubeUrl');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.videoInfo = document.getElementById('videoInfo');
        this.progressSection = document.getElementById('progressSection');
        this.downloadComplete = document.getElementById('downloadComplete');
        
        // Video info elements
        this.videoThumbnail = document.getElementById('videoThumbnail');
        this.videoTitle = document.getElementById('videoTitle');
        this.videoDuration = document.getElementById('videoDuration');
        this.videoChannel = document.getElementById('videoChannel');
        
        // Format and quality elements
        this.formatRadios = document.querySelectorAll('input[name="format"]');
        this.qualitySelect = document.getElementById('quality');
        
        // Progress elements
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.downloadStatus = document.getElementById('downloadStatus');
        this.downloadLink = document.getElementById('downloadLink');
    }

    bindEvents() {
        this.analyzeBtn.addEventListener('click', () => this.analyzeVideo());
        this.downloadBtn.addEventListener('click', () => this.startDownload());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.analyzeVideo();
            }
        });
        
        // Format change event
        this.formatRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updateQualityOptions());
        });
    }

    validateYouTubeUrl(url) {
        const patterns = [
            /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/,
            /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
            /^https?:\/\/(www\.)?youtube\.com\/v\/[\w-]+/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    }

    extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
            /youtube\.com\/embed\/([^&\n?#]+)/,
            /youtube\.com\/v\/([^&\n?#]+)/
        ];
        
        for (let pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    async analyzeVideo() {
        const url = this.urlInput.value.trim();
        
        if (!url) {
            this.showError('Silakan masukkan URL YouTube');
            return;
        }

        if (!this.validateYouTubeUrl(url)) {
            this.showError('URL YouTube tidak valid. Pastikan URL dimulai dengan https://youtube.com atau https://youtu.be');
            return;
        }

        this.setAnalyzeLoading(true);
        
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.currentVideoData = data.video;
                this.displayVideoInfo(data.video);
            } else {
                throw new Error(data.error || 'Gagal menganalisis video');
            }
        } catch (error) {
            console.error('Error analyzing video:', error);
            this.showError('Gagal menganalisis video. Pastikan URL valid dan coba lagi.');
        } finally {
            this.setAnalyzeLoading(false);
        }
    }

    displayVideoInfo(videoData) {
        this.videoThumbnail.src = videoData.thumbnail;
        this.videoTitle.textContent = videoData.title;
        this.videoDuration.textContent = `Durasi: ${this.formatDuration(videoData.duration)}`;
        this.videoChannel.textContent = `Channel: ${videoData.uploader}`;
        
        this.hideAllSections();
        this.videoInfo.classList.remove('hidden');
        this.updateQualityOptions();
    }

    updateQualityOptions() {
        const selectedFormat = document.querySelector('input[name="format"]:checked').value;
        const qualitySelect = this.qualitySelect;
        
        // Clear existing options
        qualitySelect.innerHTML = '';
        
        if (selectedFormat === 'mp3') {
            // Audio quality options
            const audioQualities = [
                { value: 'best', text: 'Terbaik (320kbps)' },
                { value: '192', text: '192kbps' },
                { value: '128', text: '128kbps' },
                { value: '96', text: '96kbps' }
            ];
            
            audioQualities.forEach(quality => {
                const option = document.createElement('option');
                option.value = quality.value;
                option.textContent = quality.text;
                qualitySelect.appendChild(option);
            });
        } else {
            // Video quality options
            const videoQualities = [
                { value: 'best', text: 'Terbaik' },
                { value: '1080p', text: '1080p (Full HD)' },
                { value: '720p', text: '720p (HD)' },
                { value: '480p', text: '480p' },
                { value: '360p', text: '360p' }
            ];
            
            videoQualities.forEach(quality => {
                const option = document.createElement('option');
                option.value = quality.value;
                option.textContent = quality.text;
                qualitySelect.appendChild(option);
            });
        }
    }

    async startDownload() {
        if (!this.currentVideoData) {
            this.showError('Silakan analisis video terlebih dahulu');
            return;
        }

        const format = document.querySelector('input[name="format"]:checked').value;
        const quality = this.qualitySelect.value;
        
        this.hideAllSections();
        this.progressSection.classList.remove('hidden');
        
        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: this.urlInput.value.trim(),
                    format: format,
                    quality: quality
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.pollDownloadProgress(data.taskId);
            } else {
                throw new Error(data.error || 'Gagal memulai download');
            }
        } catch (error) {
            console.error('Error starting download:', error);
            this.showError('Gagal memulai download. Silakan coba lagi.');
            this.hideAllSections();
            this.videoInfo.classList.remove('hidden');
        }
    }

    async pollDownloadProgress(taskId) {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/progress/${taskId}`);
                const data = await response.json();
                
                if (data.status === 'completed') {
                    clearInterval(pollInterval);
                    this.showDownloadComplete(data.downloadUrl, data.filename);
                } else if (data.status === 'error') {
                    clearInterval(pollInterval);
                    this.showError(data.error || 'Terjadi kesalahan saat download');
                } else {
                    // Update progress
                    this.updateProgress(data.progress || 0, data.message || 'Memproses...');
                }
            } catch (error) {
                console.error('Error polling progress:', error);
                clearInterval(pollInterval);
                this.showError('Gagal memantau progress download');
            }
        }, 1000);
    }

    updateProgress(percentage, message) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `${Math.round(percentage)}%`;
        this.downloadStatus.textContent = message;
    }

    showDownloadComplete(downloadUrl, filename) {
        this.hideAllSections();
        this.downloadComplete.classList.remove('hidden');
        this.downloadLink.href = downloadUrl;
        this.downloadLink.download = filename;
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    setAnalyzeLoading(loading) {
        if (loading) {
            this.analyzeBtn.disabled = true;
            this.analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menganalisis...';
        } else {
            this.analyzeBtn.disabled = false;
            this.analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analisis';
        }
    }

    hideAllSections() {
        this.videoInfo.classList.add('hidden');
        this.progressSection.classList.add('hidden');
        this.downloadComplete.classList.add('hidden');
    }

    showError(message) {
        alert(message); // Simple error display - could be enhanced with a modal
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new YouTubeDownloader();
});

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}