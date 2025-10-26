/**
 * COMPRESSION UTILITIES - SpeakUp! Platform
 * Utility untuk kompresi otomatis foto dan video
 */

class CompressionUtils {
    constructor() {
        this.defaultImageQuality = 0.8; // 80% quality
        this.defaultVideoQuality = 0.7; // 70% quality
        this.maxImageWidth = 1920; // Max width untuk gambar
        this.maxImageHeight = 1080; // Max height untuk gambar
        this.maxVideoWidth = 1280; // Max width untuk video
        this.maxVideoHeight = 720; // Max height untuk video
        this.maxFileSize = 10 * 1024 * 1024; // 10MB max file size
    }

    /**
     * Kompresi gambar/foto
     * @param {File} file - File gambar yang akan dikompres
     * @param {Object} options - Opsi kompresi
     * @returns {Promise<File>} - File gambar yang sudah dikompres
     */
    async compressImage(file, options = {}) {
        try {
            console.log(`Starting image compression for: ${file.name}, size: ${file.size} bytes`);
            
            const {
                quality = this.defaultImageQuality,
                maxWidth = this.maxImageWidth,
                maxHeight = this.maxImageHeight,
                maxSize = this.maxFileSize
            } = options;

            // Validasi file
            if (!file.type.startsWith('image/')) {
                throw new Error('File bukan gambar');
            }

            // Jika file sudah kecil, return as is
            if (file.size <= maxSize * 0.5) { // Jika sudah di bawah 50% dari max size
                console.log('File already small enough, skipping compression');
                return file;
            }

            return new Promise((resolve, reject) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();

                img.onload = () => {
                    try {
                        // Hitung dimensi baru dengan mempertahankan aspect ratio
                        let { width, height } = this.calculateDimensions(
                            img.width, 
                            img.height, 
                            maxWidth, 
                            maxHeight
                        );

                        // Set canvas dimensions
                        canvas.width = width;
                        canvas.height = height;

                        // Draw image ke canvas dengan kualitas yang diinginkan
                        ctx.drawImage(img, 0, 0, width, height);

                        // Convert ke blob dengan kualitas yang ditentukan
                        canvas.toBlob(
                            (blob) => {
                                if (!blob) {
                                    reject(new Error('Gagal mengkompres gambar'));
                                    return;
                                }

                                // Jika masih terlalu besar, coba dengan kualitas lebih rendah
                                if (blob.size > maxSize) {
                                    console.log(`Compressed size still too large: ${blob.size}, trying lower quality`);
                                    this.compressImageWithLowerQuality(file, maxSize, resolve, reject);
                                    return;
                                }

                                // Buat file baru dengan nama yang sama
                                const compressedFile = new File([blob], file.name, {
                                    type: file.type,
                                    lastModified: Date.now()
                                });

                                console.log(`Image compressed: ${file.size} -> ${compressedFile.size} bytes (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`);
                                resolve(compressedFile);
                            },
                            file.type,
                            quality
                        );
                    } catch (error) {
                        reject(error);
                    }
                };

                img.onerror = () => {
                    reject(new Error('Gagal memuat gambar'));
                };

                // Load image
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.src = e.target.result;
                };
                reader.onerror = () => {
                    reject(new Error('Gagal membaca file'));
                };
                reader.readAsDataURL(file);
            });

        } catch (error) {
            console.error('Error compressing image:', error);
            throw error;
        }
    }

    /**
     * Kompresi dengan kualitas lebih rendah jika masih terlalu besar
     */
    async compressImageWithLowerQuality(file, maxSize, resolve, reject) {
        const qualities = [0.7, 0.6, 0.5, 0.4, 0.3];
        
        for (let quality of qualities) {
            try {
                const compressed = await this.compressImage(file, { quality });
                if (compressed.size <= maxSize) {
                    console.log(`Successfully compressed with quality ${quality}`);
                    resolve(compressed);
                    return;
                }
            } catch (error) {
                console.warn(`Failed to compress with quality ${quality}:`, error);
            }
        }
        
        // Jika semua kualitas gagal, return file asli
        console.warn('Could not compress to target size, returning original file');
        resolve(file);
    }

    /**
     * Kompresi video
     * @param {File} file - File video yang akan dikompres
     * @param {Object} options - Opsi kompresi
     * @returns {Promise<File>} - File video yang sudah dikompres
     */
    async compressVideo(file, options = {}) {
        try {
            console.log(`Starting video compression for: ${file.name}, size: ${file.size} bytes`);
            
            const {
                quality = this.defaultVideoQuality,
                maxWidth = this.maxVideoWidth,
                maxHeight = this.maxVideoHeight,
                maxSize = this.maxFileSize
            } = options;

            // Validasi file
            if (!file.type.startsWith('video/')) {
                throw new Error('File bukan video');
            }

            // Jika file sudah kecil, return as is
            if (file.size <= maxSize * 0.5) {
                console.log('Video already small enough, skipping compression');
                return file;
            }

            // Untuk video, kita akan menggunakan MediaRecorder API
            return new Promise((resolve, reject) => {
                const video = document.createElement('video');
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                video.onloadedmetadata = () => {
                    try {
                        // Hitung dimensi baru
                        let { width, height } = this.calculateDimensions(
                            video.videoWidth,
                            video.videoHeight,
                            maxWidth,
                            maxHeight
                        );

                        canvas.width = width;
                        canvas.height = height;

                        // Set video properties
                        video.currentTime = 0;
                        video.play();

                        // Capture frame dan buat video baru
                        const chunks = [];
                        const mediaRecorder = new MediaRecorder(
                            canvas.captureStream(),
                            {
                                mimeType: 'video/webm;codecs=vp9',
                                videoBitsPerSecond: Math.floor(file.size * quality / 10) // Adjust bitrate
                            }
                        );

                        mediaRecorder.ondataavailable = (event) => {
                            if (event.data.size > 0) {
                                chunks.push(event.data);
                            }
                        };

                        mediaRecorder.onstop = () => {
                            const blob = new Blob(chunks, { type: 'video/webm' });
                            
                            if (blob.size > maxSize) {
                                console.log(`Compressed video still too large: ${blob.size}, trying lower quality`);
                                this.compressVideoWithLowerQuality(file, maxSize, resolve, reject);
                                return;
                            }

                            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webm'), {
                                type: 'video/webm',
                                lastModified: Date.now()
                            });

                            console.log(`Video compressed: ${file.size} -> ${compressedFile.size} bytes (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`);
                            resolve(compressedFile);
                        };

                        // Start recording
                        mediaRecorder.start();

                        // Draw video frames to canvas
                        const drawFrame = () => {
                            if (!video.paused && !video.ended) {
                                ctx.drawImage(video, 0, 0, width, height);
                                requestAnimationFrame(drawFrame);
                            } else {
                                mediaRecorder.stop();
                            }
                        };

                        video.onplay = () => {
                            drawFrame();
                        };

                        // Stop after video duration
                        setTimeout(() => {
                            if (mediaRecorder.state === 'recording') {
                                mediaRecorder.stop();
                            }
                        }, video.duration * 1000);

                    } catch (error) {
                        reject(error);
                    }
                };

                video.onerror = () => {
                    reject(new Error('Gagal memuat video'));
                };

                // Load video
                const reader = new FileReader();
                reader.onload = (e) => {
                    video.src = e.target.result;
                };
                reader.onerror = () => {
                    reject(new Error('Gagal membaca file video'));
                };
                reader.readAsDataURL(file);
            });

        } catch (error) {
            console.error('Error compressing video:', error);
            // Jika kompresi video gagal, return file asli
            console.warn('Video compression failed, returning original file');
            return file;
        }
    }

    /**
     * Kompresi video dengan kualitas lebih rendah
     */
    async compressVideoWithLowerQuality(file, maxSize, resolve, reject) {
        const qualities = [0.6, 0.5, 0.4, 0.3, 0.2];
        
        for (let quality of qualities) {
            try {
                const compressed = await this.compressVideo(file, { quality });
                if (compressed.size <= maxSize) {
                    console.log(`Successfully compressed video with quality ${quality}`);
                    resolve(compressed);
                    return;
                }
            } catch (error) {
                console.warn(`Failed to compress video with quality ${quality}:`, error);
            }
        }
        
        // Jika semua kualitas gagal, return file asli
        console.warn('Could not compress video to target size, returning original file');
        resolve(file);
    }

    /**
     * Hitung dimensi baru dengan mempertahankan aspect ratio
     */
    calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
        let width = originalWidth;
        let height = originalHeight;

        // Jika dimensi asli sudah lebih kecil dari maksimum, return as is
        if (width <= maxWidth && height <= maxHeight) {
            return { width, height };
        }

        // Hitung ratio untuk scaling
        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        const ratio = Math.min(widthRatio, heightRatio);

        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);

        return { width, height };
    }

    /**
     * Kompresi file berdasarkan tipe
     * @param {File} file - File yang akan dikompres
     * @param {Object} options - Opsi kompresi
     * @returns {Promise<File>} - File yang sudah dikompres
     */
    async compressFile(file, options = {}) {
        try {
            if (file.type.startsWith('image/')) {
                return await this.compressImage(file, options);
            } else if (file.type.startsWith('video/')) {
                return await this.compressVideo(file, options);
            } else {
                // Untuk file lain, return as is
                console.log(`File type ${file.type} not supported for compression, returning original`);
                return file;
            }
        } catch (error) {
            console.error('Error compressing file:', error);
            // Jika kompresi gagal, return file asli
            return file;
        }
    }

    /**
     * Kompresi multiple files
     * @param {FileList|Array} files - Array file yang akan dikompres
     * @param {Object} options - Opsi kompresi
     * @returns {Promise<Array>} - Array file yang sudah dikompres
     */
    async compressFiles(files, options = {}) {
        try {
            const compressedFiles = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                console.log(`Compressing file ${i + 1}/${files.length}: ${file.name}`);
                
                const compressedFile = await this.compressFile(file, options);
                compressedFiles.push(compressedFile);
            }
            
            return compressedFiles;
        } catch (error) {
            console.error('Error compressing files:', error);
            throw error;
        }
    }

    /**
     * Validasi ukuran file
     * @param {File} file - File yang akan divalidasi
     * @param {number} maxSize - Ukuran maksimum dalam bytes
     * @returns {boolean} - Apakah file valid
     */
    validateFileSize(file, maxSize = this.maxFileSize) {
        return file.size <= maxSize;
    }

    /**
     * Format ukuran file ke string yang readable
     * @param {number} bytes - Ukuran dalam bytes
     * @returns {string} - Ukuran yang sudah diformat
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Update konfigurasi kompresi
     * @param {Object} config - Konfigurasi baru
     */
    updateConfig(config) {
        if (config.imageQuality !== undefined) this.defaultImageQuality = config.imageQuality;
        if (config.videoQuality !== undefined) this.defaultVideoQuality = config.videoQuality;
        if (config.maxImageWidth !== undefined) this.maxImageWidth = config.maxImageWidth;
        if (config.maxImageHeight !== undefined) this.maxImageHeight = config.maxImageHeight;
        if (config.maxVideoWidth !== undefined) this.maxVideoWidth = config.maxVideoWidth;
        if (config.maxVideoHeight !== undefined) this.maxVideoHeight = config.maxVideoHeight;
        if (config.maxFileSize !== undefined) this.maxFileSize = config.maxFileSize;
    }
}

// Export untuk digunakan di file lain
window.CompressionUtils = CompressionUtils;

// Buat instance global
window.compressionUtils = new CompressionUtils();

console.log('CompressionUtils loaded successfully');

