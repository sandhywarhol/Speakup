// =====================================================
// SPEAKUP! PETITIONS API - CLIENT SIDE FUNCTIONS
// =====================================================

class PetitionsAPI {
    constructor() {
        this.supabase = null;
        this.initSupabase();
    }

    initSupabase() {
        // Wait for Supabase to be ready
        const checkSupabase = () => {
            if (window.getSupabase && typeof window.getSupabase === 'function') {
                this.supabase = window.getSupabase();
                if (!this.supabase) {
                    console.warn('Supabase client not available, retrying...');
                    setTimeout(checkSupabase, 100);
                }
            } else {
                console.warn('getSupabase function not available, retrying...');
                setTimeout(checkSupabase, 100);
            }
        };
        checkSupabase();
    }

    // =====================================================
    // UTILITY METHODS
    // =====================================================

    /**
     * Memastikan Supabase client siap digunakan
     * @returns {Promise<boolean>} - Status ketersediaan Supabase
     */
    async ensureSupabaseReady() {
        const maxWait = 5000; // 5 detik
        const startTime = Date.now();
        
        while (!this.supabase && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (window.getSupabase && typeof window.getSupabase === 'function') {
                this.supabase = window.getSupabase();
            }
        }
        
        if (!this.supabase) {
            throw new Error('Supabase client tidak tersedia setelah menunggu 5 detik');
        }
        
        return true;
    }

    // =====================================================
    // PETITION MANAGEMENT
    // =====================================================

    /**
     * Membuat aspirasi baru
     * @param {Object} petitionData - Data aspirasi
     * @returns {Promise<Object>} - Hasil pembuatan aspirasi
     */
    async createPetition(petitionData) {
        try {
            await this.ensureSupabaseReady();

            // Validasi data yang diperlukan
            const requiredFields = [
                'title', 'description', 'category', 'target', 'solution',
                'full_name', 'nik', 'phone', 'email'
            ];
            
            for (const field of requiredFields) {
                if (!petitionData[field]) {
                    throw new Error(`Field ${field} is required`);
                }
            }

            // Upload files jika ada
            let ktpUrl = null;
            let evidencePhotos = [];
            let evidenceVideoUrl = null;
            let documentsUrl = [];

            // Upload KTP
            if (petitionData.ktp_file) {
                console.log('Uploading KTP file:', petitionData.ktp_file.name, 'Type:', petitionData.ktp_file.type);
                ktpUrl = await this.uploadFile(petitionData.ktp_file, 'ktp');
            }

            // Upload evidence photos
            if (petitionData.evidence_photos && petitionData.evidence_photos.length > 0) {
                for (const photo of petitionData.evidence_photos) {
                    console.log('Uploading evidence photo:', photo.name, 'Type:', photo.type);
                    const url = await this.uploadFile(photo, 'evidence');
                    evidencePhotos.push(url);
                }
            }

            // Upload evidence video
            if (petitionData.evidence_video) {
                console.log('Uploading evidence video:', petitionData.evidence_video.name, 'Type:', petitionData.evidence_video.type);
                evidenceVideoUrl = await this.uploadFile(petitionData.evidence_video, 'evidence');
            }

            // Upload documents
            if (petitionData.documents && petitionData.documents.length > 0) {
                for (const doc of petitionData.documents) {
                    console.log('Uploading document:', doc.name, 'Type:', doc.type);
                    const url = await this.uploadFile(doc, 'documents');
                    documentsUrl.push(url);
                }
            }

            // Get current user ID
            const { data: { user }, error: userError } = await this.supabase.auth.getUser();
            if (userError || !user) {
                throw new Error('User tidak terautentikasi. Silakan login terlebih dahulu.');
            }

            // Siapkan data untuk database
            const insertData = {
                user_id: user.id, // Tambahkan user_id untuk RLS policy
                title: petitionData.title,
                description: petitionData.description,
                category: petitionData.category,
                target: petitionData.target,
                solution: petitionData.solution,
                signature_target: petitionData.signature_target || 100,
                full_name: petitionData.full_name,
                nik: petitionData.nik,
                phone: petitionData.phone,
                email: petitionData.email,
                ktp_url: ktpUrl,
                evidence_photos: evidencePhotos.length > 0 ? evidencePhotos : null,
                evidence_video_url: evidenceVideoUrl,
                documents_url: documentsUrl.length > 0 ? documentsUrl : null,
                additional_info: petitionData.additional_info,
                digital_signature: petitionData.digital_signature,
                status: 'pending' // Default status pending untuk moderasi
            };

            console.log('Creating petition with data:', insertData);

            // Insert ke database
            const { data, error } = await this.supabase
                .from('petitions')
                .insert(insertData)
                .select()
                .single();

            if (error) {
                console.error('Error creating petition:', error);
                throw new Error(`Gagal membuat aspirasi: ${error.message}`);
            }

            console.log('Petition created successfully:', data);
            return data;

        } catch (error) {
            console.error('Error in createPetition:', error);
            throw error;
        }
    }

    /**
     * Mengambil daftar aspirasi yang dipublikasikan
     * @param {Object} options - Opsi filter dan pagination
     * @returns {Promise<Array>} - Daftar aspirasi
     */
    async getPublishedPetitions(options = {}) {
        try {
            await this.ensureSupabaseReady();

            const {
                category = null,
                limit = 20,
                offset = 0,
                sortBy = 'created_at',
                sortOrder = 'desc'
            } = options;

            let query = this.supabase
                .from('petitions')
                .select(`
                    id,
                    title,
                    description,
                    category,
                    target,
                    solution,
                    signature_count,
                    signature_target,
                    view_count,
                    is_featured,
                    is_pinned,
                    created_at,
                    published_at
                `)
                .eq('status', 'published');

            // Filter by category
            if (category && category !== 'all') {
                query = query.eq('category', category);
            }

            // Sorting
            query = query.order(sortBy, { ascending: sortOrder === 'asc' });

            // Pagination
            query = query.range(offset, offset + limit - 1);

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching petitions:', error);
                throw new Error(`Gagal mengambil aspirasi: ${error.message}`);
            }

            return data || [];

        } catch (error) {
            console.error('Error in getPublishedPetitions:', error);
            throw error;
        }
    }

    /**
     * Mengambil detail aspirasi berdasarkan ID
     * @param {string} petitionId - ID aspirasi
     * @returns {Promise<Object>} - Detail aspirasi
     */
    async getPetitionDetails(petitionId) {
        try {
            await this.ensureSupabaseReady();

            const { data, error } = await this.supabase
                .from('petitions')
                .select(`
                    id,
                    title,
                    description,
                    category,
                    target,
                    solution,
                    signature_count,
                    signature_target,
                    view_count,
                    is_featured,
                    is_pinned,
                    created_at,
                    published_at,
                    additional_info
                `)
                .eq('id', petitionId)
                .eq('status', 'published')
                .single();

            if (error) {
                console.error('Error fetching petition details:', error);
                throw new Error(`Gagal mengambil detail aspirasi: ${error.message}`);
            }

            return data;

        } catch (error) {
            console.error('Error in getPetitionDetails:', error);
            throw error;
        }
    }

    /**
     * Mengambil aspirasi milik user
     * @param {string} userId - ID user
     * @returns {Promise<Array>} - Daftar aspirasi user
     */
    async getUserPetitions(userId) {
        try {
            await this.ensureSupabaseReady();

            const { data, error } = await this.supabase
                .from('petitions')
                .select(`
                    id,
                    title,
                    description,
                    category,
                    target,
                    solution,
                    signature_count,
                    signature_target,
                    status,
                    moderation_notes,
                    created_at,
                    published_at
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching user petitions:', error);
                throw new Error(`Gagal mengambil aspirasi Anda: ${error.message}`);
            }

            return data || [];

        } catch (error) {
            console.error('Error in getUserPetitions:', error);
            throw error;
        }
    }

    // =====================================================
    // SIGNATURE MANAGEMENT
    // =====================================================

    /**
     * Menandatangani aspirasi
     * @param {string} petitionId - ID aspirasi
     * @param {Object} signatureData - Data tanda tangan
     * @returns {Promise<Object>} - Hasil tanda tangan
     */
    async signPetition(petitionId, signatureData) {
        try {
            await this.ensureSupabaseReady();

            const {
                full_name,
                email = null,
                phone = null,
                signature_data = null,
                is_anonymous = false
            } = signatureData;

            if (!full_name) {
                throw new Error('Nama lengkap wajib diisi');
            }

            const { data, error } = await this.supabase
                .from('petition_signatures')
                .insert({
                    petition_id: petitionId,
                    full_name,
                    email,
                    phone,
                    signature_data,
                    is_anonymous
                })
                .select()
                .single();

            if (error) {
                console.error('Error signing petition:', error);
                throw new Error(`Gagal menandatangani aspirasi: ${error.message}`);
            }

            return data;

        } catch (error) {
            console.error('Error in signPetition:', error);
            throw error;
        }
    }

    /**
     * Mengambil daftar penandatangan aspirasi
     * @param {string} petitionId - ID aspirasi
     * @param {Object} options - Opsi pagination
     * @returns {Promise<Array>} - Daftar penandatangan
     */
    async getPetitionSignatures(petitionId, options = {}) {
        try {
            await this.ensureSupabaseReady();

            const { limit = 50, offset = 0 } = options;

            const { data, error } = await this.supabase
                .from('petition_signatures')
                .select(`
                    id,
                    full_name,
                    email,
                    is_anonymous,
                    created_at
                `)
                .eq('petition_id', petitionId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                console.error('Error fetching signatures:', error);
                throw new Error(`Gagal mengambil daftar penandatangan: ${error.message}`);
            }

            return data || [];

        } catch (error) {
            console.error('Error in getPetitionSignatures:', error);
            throw error;
        }
    }

    /**
     * Mengecek apakah user sudah menandatangani aspirasi
     * @param {string} petitionId - ID aspirasi
     * @param {string} userId - ID user
     * @returns {Promise<boolean>} - Status tanda tangan
     */
    async hasUserSigned(petitionId, userId) {
        try {
            if (!userId) {
                return false;
            }
            await this.ensureSupabaseReady();

            const { data, error } = await this.supabase
                .from('petition_signatures')
                .select('id')
                .eq('petition_id', petitionId)
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error checking signature:', error);
                return false;
            }

            return !!data;

        } catch (error) {
            console.error('Error in hasUserSigned:', error);
            return false;
        }
    }

    // =====================================================
    // SUPPORT MANAGEMENT
    // =====================================================

    /**
     * Mendukung aspirasi
     * @param {string} petitionId - ID aspirasi
     * @returns {Promise<Object>} - Hasil dukungan
     */
    async supportPetition(petitionId) {
        try {
            await this.ensureSupabaseReady();

            // Get current user
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                throw new Error('User tidak terautentikasi');
            }

            const { data, error } = await this.supabase
                .from('petition_supporters')
                .insert({
                    petition_id: petitionId,
                    user_id: user.id
                })
                .select()
                .single();

            if (error) {
                console.error('Error supporting petition:', error);
                throw new Error(`Gagal mendukung aspirasi: ${error.message}`);
            }

            return data;

        } catch (error) {
            console.error('Error in supportPetition:', error);
            throw error;
        }
    }

    /**
     * Membatalkan dukungan aspirasi
     * @param {string} petitionId - ID aspirasi
     * @returns {Promise<boolean>} - Status pembatalan
     */
    async unsupportPetition(petitionId) {
        try {
            await this.ensureSupabaseReady();

            // Get current user
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                throw new Error('User tidak terautentikasi');
            }

            const { error } = await this.supabase
                .from('petition_supporters')
                .delete()
                .eq('petition_id', petitionId)
                .eq('user_id', user.id);

            if (error) {
                console.error('Error unsupporting petition:', error);
                throw new Error(`Gagal membatalkan dukungan: ${error.message}`);
            }

            return true;

        } catch (error) {
            console.error('Error in unsupportPetition:', error);
            throw error;
        }
    }

    /**
     * Mengecek apakah user sudah mendukung aspirasi
     * @param {string} petitionId - ID aspirasi
     * @param {string} userId - ID user
     * @returns {Promise<boolean>} - Status dukungan
     */
    async hasUserSupported(petitionId, userId) {
        try {
            if (!userId) {
                return false;
            }
            await this.ensureSupabaseReady();

            const { data, error } = await this.supabase
                .from('petition_supporters')
                .select('id')
                .eq('petition_id', petitionId)
                .eq('user_id', userId)
                .limit(1);

            if (error) {
                console.error('Error checking support:', error);
                return false;
            }

            return data && data.length > 0;

        } catch (error) {
            console.error('Error in hasUserSupported:', error);
            return false;
        }
    }

    // =====================================================
    // COMMENT MANAGEMENT
    // =====================================================

    /**
     * Menambahkan komentar pada aspirasi
     * @param {string} petitionId - ID aspirasi
     * @param {string} content - Isi komentar
     * @param {string} parentCommentId - ID komentar parent (untuk reply)
     * @returns {Promise<Object>} - Hasil komentar
     */
    async addComment(petitionId, content, parentCommentId = null) {
        try {
            await this.ensureSupabaseReady();

            const { data, error } = await this.supabase
                .from('petition_comments')
                .insert({
                    petition_id: petitionId,
                    content,
                    parent_comment_id: parentCommentId
                })
                .select()
                .single();

            if (error) {
                console.error('Error adding comment:', error);
                throw new Error(`Gagal menambahkan komentar: ${error.message}`);
            }

            return data;

        } catch (error) {
            console.error('Error in addComment:', error);
            throw error;
        }
    }

    /**
     * Mengambil komentar aspirasi
     * @param {string} petitionId - ID aspirasi
     * @param {Object} options - Opsi pagination
     * @returns {Promise<Array>} - Daftar komentar
     */
    async getPetitionComments(petitionId, options = {}) {
        try {
            await this.ensureSupabaseReady();

            const { limit = 20, offset = 0 } = options;

            const { data, error } = await this.supabase
                .from('petition_comments')
                .select(`
                    id,
                    content,
                    parent_comment_id,
                    created_at,
                    updated_at,
                    profiles!inner(
                        full_name,
                        avatar_url,
                        identity
                    )
                `)
                .eq('petition_id', petitionId)
                .eq('is_approved', true)
                .order('created_at', { ascending: true })
                .range(offset, offset + limit - 1);

            if (error) {
                console.error('Error fetching comments:', error);
                throw new Error(`Gagal mengambil komentar: ${error.message}`);
            }

            return data || [];

        } catch (error) {
            console.error('Error in getPetitionComments:', error);
            throw error;
        }
    }

    // =====================================================
    // FILE UPLOAD
    // =====================================================

    /**
     * Upload file ke Supabase Storage dengan kompresi otomatis
     * @param {File} file - File yang akan diupload
     * @param {string} folder - Folder tujuan
     * @returns {Promise<string>} - URL file yang diupload
     */
    async uploadFile(file, folder = 'general') {
        try {
            await this.ensureSupabaseReady();

            console.log(`Starting upload for file: ${file.name}, type: ${file.type}, size: ${file.size}, folder: ${folder}`);

            // Compress file before upload if compression utils available
            let fileToUpload = file;
            if (window.compressionUtils) {
                try {
                    console.log('Compressing file before upload...');
                    
                    // Set compression options based on file type and folder
                    let compressionOptions = {};
                    
                    if (file.type.startsWith('image/')) {
                        compressionOptions = {
                            quality: 0.8,
                            maxWidth: 1920,
                            maxHeight: 1080,
                            maxSize: 5 * 1024 * 1024 // 5MB max for images
                        };
                    } else if (file.type.startsWith('video/')) {
                        compressionOptions = {
                            quality: 0.7,
                            maxWidth: 1280,
                            maxHeight: 720,
                            maxSize: 10 * 1024 * 1024 // 10MB max for videos
                        };
                    }
                    
                    fileToUpload = await window.compressionUtils.compressFile(file, compressionOptions);
                    console.log(`File compressed: ${file.size} -> ${fileToUpload.size} bytes (${Math.round((1 - fileToUpload.size / file.size) * 100)}% reduction)`);
                } catch (error) {
                    console.warn('File compression failed, using original file:', error);
                    fileToUpload = file;
                }
            }

            // Generate unique filename
            const fileExt = fileToUpload.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `petitions/${folder}/${fileName}`;

            // Fix MIME type untuk file yang tidak memiliki MIME type yang tepat
            if (fileToUpload.type === 'application/octet-stream' || !fileToUpload.type) {
                // Tentukan MIME type berdasarkan ekstensi file
                const mimeTypes = {
                    'jpg': 'image/jpeg',
                    'jpeg': 'image/jpeg',
                    'png': 'image/png',
                    'gif': 'image/gif',
                    'webp': 'image/webp',
                    'pdf': 'application/pdf',
                    'doc': 'application/msword',
                    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'mp4': 'video/mp4',
                    'avi': 'video/x-msvideo',
                    'mov': 'video/quicktime',
                    'wmv': 'video/x-ms-wmv',
                    'webm': 'video/webm'
                };
                
                const ext = fileExt.toLowerCase();
                const correctMimeType = mimeTypes[ext];
                
                if (correctMimeType) {
                    // Buat file baru dengan MIME type yang benar
                    fileToUpload = new File([fileToUpload], fileToUpload.name, { type: correctMimeType });
                    console.log(`Fixed MIME type for ${fileToUpload.name}: ${fileToUpload.type} -> ${correctMimeType}`);
                } else {
                    // Jika tidak ada mapping yang tepat, coba deteksi dari content
                    console.warn(`Unknown file extension: ${ext} for file ${fileToUpload.name}`);
                    // Tetap gunakan file asli, tapi dengan MIME type yang lebih umum
                    if (ext.match(/^(jpg|jpeg|png|gif|webp)$/)) {
                        fileToUpload = new File([fileToUpload], fileToUpload.name, { type: 'image/jpeg' });
                    } else if (ext.match(/^(mp4|avi|mov|wmv|webm)$/)) {
                        fileToUpload = new File([fileToUpload], fileToUpload.name, { type: 'video/mp4' });
                    } else if (ext.match(/^(pdf)$/)) {
                        fileToUpload = new File([fileToUpload], fileToUpload.name, { type: 'application/pdf' });
                    }
                }
            }

            // Upload file
            const { data, error } = await this.supabase.storage
                .from('petitions')
                .upload(filePath, fileToUpload, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Error uploading file:', error);
                throw new Error(`Gagal mengupload file: ${error.message}`);
            }

            // Get public URL
            const { data: urlData } = this.supabase.storage
                .from('petitions')
                .getPublicUrl(filePath);

            return urlData.publicUrl;

        } catch (error) {
            console.error('Error in uploadFile:', error);
            throw error;
        }
    }

    // =====================================================
    // UTILITY FUNCTIONS
    // =====================================================

    /**
     * Format angka dengan pemisah ribuan
     * @param {number} num - Angka yang akan diformat
     * @returns {string} - Angka yang sudah diformat
     */
    formatNumber(num) {
        try {
            return new Intl.NumberFormat('id-ID').format(num);
        } catch (error) {
            return String(num);
        }
    }

    /**
     * Format tanggal ke bahasa Indonesia
     * @param {string|Date} date - Tanggal yang akan diformat
     * @returns {string} - Tanggal yang sudah diformat
     */
    formatDate(date) {
        try {
            const dateObj = new Date(date);
            return dateObj.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Tanggal tidak valid';
        }
    }

    /**
     * Format waktu relatif (misal: "2 jam lalu")
     * @param {string|Date} date - Tanggal yang akan diformat
     * @returns {string} - Waktu relatif
     */
    formatRelativeTime(date) {
        try {
            const dateObj = new Date(date);
            const now = new Date();
            const diffMs = now - dateObj;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'Baru saja';
            if (diffMins < 60) return `${diffMins} menit lalu`;
            if (diffHours < 24) return `${diffHours} jam lalu`;
            if (diffDays < 7) return `${diffDays} hari lalu`;
            
            return this.formatDate(date);
        } catch (error) {
            return 'Waktu tidak valid';
        }
    }

    /**
     * Validasi data aspirasi
     * @param {Object} data - Data yang akan divalidasi
     * @returns {Object} - Hasil validasi
     */
    validatePetitionData(data) {
        const errors = [];

        // Required fields
        if (!data.title || data.title.trim().length < 10) {
            errors.push('Judul aspirasi minimal 10 karakter');
        }

        if (!data.description || data.description.trim().length < 50) {
            errors.push('Deskripsi aspirasi minimal 50 karakter');
        }

        if (!data.target || data.target.trim().length < 5) {
            errors.push('Target aspirasi minimal 5 karakter');
        }

        if (!data.solution || data.solution.trim().length < 20) {
            errors.push('Solusi yang diharapkan minimal 20 karakter');
        }

        if (!data.full_name || data.full_name.trim().length < 2) {
            errors.push('Nama lengkap minimal 2 karakter');
        }

        if (!data.nik || !/^[0-9]{16}$/.test(data.nik)) {
            errors.push('NIK harus 16 digit angka');
        }

        if (!data.phone || !/^[0-9]{10,15}$/.test(data.phone)) {
            errors.push('Nomor telepon harus 10-15 digit angka');
        }

        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push('Email tidak valid');
        }

        if (data.signature_target && (data.signature_target < 100 || data.signature_target > 100000)) {
            errors.push('Target tanda tangan harus antara 100-100.000');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // =====================================================
    // PETITION FOLLOW METHODS
    // =====================================================

    /**
     * Follow (pin) petisi untuk user
     * @param {string} petitionId - ID petisi
     * @returns {Promise<Object>} - Hasil operasi
     */
    async followPetition(petitionId) {
        try {
            await this.ensureSupabaseReady();
            
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                throw new Error('User tidak terautentikasi');
            }

            const { data, error } = await this.supabase
                .from('petition_follows')
                .insert({
                    user_id: user.id,
                    petition_id: petitionId
                })
                .select();

            if (error) {
                throw error;
            }

            return {
                success: true,
                data: data[0]
            };
        } catch (error) {
            console.error('Error following petition:', error);
            throw error;
        }
    }

    /**
     * Unfollow (unpin) petisi untuk user
     * @param {string} petitionId - ID petisi
     * @returns {Promise<Object>} - Hasil operasi
     */
    async unfollowPetition(petitionId) {
        try {
            await this.ensureSupabaseReady();
            
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                throw new Error('User tidak terautentikasi');
            }

            const { error } = await this.supabase
                .from('petition_follows')
                .delete()
                .eq('user_id', user.id)
                .eq('petition_id', petitionId);

            if (error) {
                throw error;
            }

            return {
                success: true
            };
        } catch (error) {
            console.error('Error unfollowing petition:', error);
            throw error;
        }
    }

    /**
     * Cek apakah user sudah follow petisi
     * @param {string} petitionId - ID petisi
     * @param {string} userId - ID user
     * @returns {Promise<boolean>} - Status follow
     */
    async hasUserFollowed(petitionId, userId) {
        try {
            await this.ensureSupabaseReady();

            const { data, error } = await this.supabase
                .from('petition_follows')
                .select('id')
                .eq('user_id', userId)
                .eq('petition_id', petitionId)
                .limit(1);

            if (error) {
                console.error('Error checking follow status:', error);
                return false;
            }

            return data && data.length > 0;
        } catch (error) {
            console.error('Error in hasUserFollowed:', error);
            return false;
        }
    }

    /**
     * Ambil daftar petisi yang diikuti user (pinned)
     * @param {string} userId - ID user
     * @returns {Promise<Array>} - Daftar petisi yang diikuti
     */
    async getUserFollowedPetitions(userId) {
        try {
            await this.ensureSupabaseReady();

            // First, get the followed petition IDs
            const { data: follows, error: followsError } = await this.supabase
                .from('petition_follows')
                .select('petition_id, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (followsError) {
                throw followsError;
            }

            if (!follows || follows.length === 0) {
                return [];
            }

            // Get the petition IDs
            const petitionIds = follows.map(follow => follow.petition_id);

            // Then, get the petitions with their details
            const { data: petitions, error: petitionsError } = await this.supabase
                .from('petitions')
                .select(`
                    id,
                    title,
                    description,
                    category,
                    signature_count,
                    signature_target,
                    created_at,
                    updated_at,
                    status,
                    user_id
                `)
                .in('id', petitionIds)
                .eq('status', 'published');

            if (petitionsError) {
                throw petitionsError;
            }

            // Get user profiles for the petitions
            const userIds = [...new Set(petitions.map(p => p.user_id))];
            const { data: profiles, error: profilesError } = await this.supabase
                .from('profiles')
                .select('id, full_name, title, profession, is_verified')
                .in('id', userIds);

            if (profilesError) {
                console.warn('Error getting profiles:', profilesError);
            }

            // Combine the data
            const result = follows.map(follow => {
                const petition = petitions.find(p => p.id === follow.petition_id);
                if (!petition) return null;

                const profile = profiles?.find(prof => prof.id === petition.user_id);
                
                return {
                    petition_id: follow.petition_id,
                    created_at: follow.created_at,
                    petitions: {
                        ...petition,
                        profiles: profile
                    }
                };
            }).filter(Boolean);

            return result;
        } catch (error) {
            console.error('Error getting user followed petitions:', error);
            throw error;
        }
    }
}

// Export untuk digunakan di file lain
window.PetitionsAPI = PetitionsAPI;

// Buat instance global
window.petitionsAPI = new PetitionsAPI();
