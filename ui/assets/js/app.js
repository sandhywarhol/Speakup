/* Minimal JS untuk demo interaksi statis */
(function () {
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $all(sel, el) { return (el || document).querySelectorAll(sel); }

  // Wait for DOM to be ready
  function initModal() {
    // Modal create post
    const modal = $('#createModal');
    const openBtn = $('#openCreate');
    const closeBtn = $('#closeCreate');
    
    // Debug: Check if modal exists
    console.log('Modal found:', !!modal);
    console.log('Open button found:', !!openBtn);
    console.log('Close button found:', !!closeBtn);
  
  // Handle both #openCreate and [data-open-create] selectors
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      modal && modal.classList.add('open');
      modal && modal.setAttribute('aria-hidden', 'false');
    });
  }

  // Robust global handler for Speak! button across pages (event delegation)
  document.addEventListener('click', (evt) => {
    const trigger = evt.target && evt.target.closest && evt.target.closest('[data-open-create]');
    if (!trigger) return;
    evt.preventDefault();
    console.log('Speak! (delegated) clicked');
    // Try a few common selectors for the create modal
    const createModal = document.querySelector('#createModal, [data-modal="create"]') || modal;
    if (createModal) {
      createModal.classList.add('open');
      createModal.setAttribute('aria-hidden', 'false');
      console.log('Create modal opened');
      return;
    }
    // Fallback: notify and optionally redirect if desired
    console.warn('Create modal not found on this page. Ensure #createModal exists.');
  });
    
    closeBtn && closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    });
    
    // Handle closeCreate2 button
    const closeBtn2 = $('#closeCreate2');
    closeBtn2 && closeBtn2.addEventListener('click', () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    });
    
    modal && modal.addEventListener('click', (e) => { 
      if (e.target === modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // Image upload handling for all image upload elements
  $all('#imageUpload').forEach(imageUpload => {
    const imagePreview = imageUpload.parentElement.querySelector('#imagePreview');
    const previewImg = imageUpload.parentElement.querySelector('#previewImg');
    
    if (imageUpload && imagePreview && previewImg) {
      imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            previewImg.src = e.target.result;
            imagePreview.style.display = 'block';
          };
          reader.readAsDataURL(file);
        }
      });
    }
  });

  // Media preview handling for image and video (timeline create form)
  const imageInput = document.getElementById('imageUpload');
  const videoInput = document.getElementById('videoUpload');
  const previewImg = document.getElementById('previewImg');
  const previewVideo = document.getElementById('previewVideo');
  const videoPreviewWrap = document.getElementById('videoPreview');

  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      if (previewImg) { previewImg.src = url; previewImg.style.display = 'block'; }
      if (previewVideo) { previewVideo.pause && previewVideo.pause(); previewVideo.src = ''; previewVideo.style.display = 'none'; }
      if (videoPreviewWrap) videoPreviewWrap.style.display = 'none';
    });
  }

  if (videoInput) {
    videoInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('video/')) return;
      const url = URL.createObjectURL(file);
      if (previewVideo) { previewVideo.src = url; previewVideo.style.display = 'block'; }
      if (videoPreviewWrap) videoPreviewWrap.style.display = 'block';
      if (previewImg) { previewImg.src = ''; previewImg.style.display = 'none'; }
    });
  }

  window.removeVideo = function() {
    if (videoInput) videoInput.value = '';
    if (previewVideo) { previewVideo.pause && previewVideo.pause(); previewVideo.src=''; previewVideo.style.display='none'; }
    if (videoPreviewWrap) videoPreviewWrap.style.display = 'none';
  };

  // Remove image function
  window.removeImage = function() {
    const imageUpload = $('#imageUpload');
    const imagePreview = $('#imagePreview');
    const previewImg = $('#previewImg');
    
    if (imageUpload) imageUpload.value = '';
    if (imagePreview) imagePreview.style.display = 'none';
    if (previewImg) previewImg.src = '';
  };

  // Real submit for all create forms with Supabase
    $all('#createForm').forEach(createForm => {
      createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('=== FORM SUBMIT PREVENTED ===');
        console.log('Event prevented, starting async processing...');
      
      // Check if user is logged in
      const isLoggedIn = localStorage.getItem('speakup_logged_in');
      if (isLoggedIn !== 'true') {
        alert('Anda harus login terlebih dahulu untuk membuat postingan!');
        return;
      }
      
      const data = Object.fromEntries(new FormData(createForm).entries());
      const imageUpload = createForm.querySelector('#imageUpload');
      const videoUpload = createForm.querySelector('#videoUpload');
      const imageFile = imageUpload ? imageUpload.files[0] : null;
      const videoFile = videoUpload ? videoUpload.files[0] : null;
      
        console.log('=== POSTING DEBUG START ===');
        console.log('Submitting post with data:', data);
        console.log('Supabase available:', typeof window.supabase !== 'undefined');
        console.log('Supabase config available:', !!window.SUPABASE_CONFIG);
        console.log('User logged in:', isLoggedIn);
        console.log('Form data keys:', Object.keys(data));
        console.log('Content length:', data.content ? data.content.length : 'undefined');
        console.log('Category:', data.category);
        console.log('Identity:', data.identity);
        console.log('Want solution:', data.want_solution);
      
      try {
        // Initialize Supabase if not already done
        if (typeof window.supabase === 'undefined' || !window.SUPABASE_CONFIG) {
          console.error('Supabase not initialized');
          alert('Error: Database tidak tersedia. Silakan refresh halaman.');
          return;
        }
        
        console.log('Creating Supabase client...');
        
        let supabase;
        if (window.getSupabase) {
          supabase = window.getSupabase();
        } else if (window.supabase && window.supabase.createClient) {
          supabase = window.supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.anonKey
          );
        } else {
          console.error('Supabase tidak tersedia');
          return;
        }
        
          // Get current user
          const { data: { session } } = await supabase.auth.getSession();
          console.log('Session check result:', session);
          if (!session) {
            console.error('No session found, user not logged in');
            alert('Anda harus login terlebih dahulu untuk membuat postingan!');
            return;
          }
          console.log('Session found, user ID:', session.user.id);
        
        // Upload image if exists
        let imageUrl = null;
        let videoUrl = null;
        if (imageFile) {
          console.log('Uploading image:', imageFile.name);
          const imagePath = `posts/${session.user.id}/${Date.now()}_${imageFile.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('posts')
            .upload(imagePath, imageFile);
            
          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            alert('Gagal mengupload gambar: ' + uploadError.message);
            return;
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('posts')
              .getPublicUrl(imagePath);
            imageUrl = publicUrl;
            console.log('Image uploaded successfully:', imageUrl);
          }
        }
        
        // Upload video if exists
        if (videoFile) {
          console.log('Uploading video:', videoFile.name);
          const videoPath = `posts/${session.user.id}/${Date.now()}_${videoFile.name}`;
          const { data: vUpload, error: vErr } = await supabase.storage
            .from('posts')
            .upload(videoPath, videoFile, { contentType: videoFile.type });
          if (vErr) {
            console.error('Error uploading video:', vErr);
            alert('Gagal mengupload video: ' + vErr.message);
            return;
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('posts')
              .getPublicUrl(videoPath);
            videoUrl = publicUrl;
            console.log('Video uploaded successfully:', videoUrl);
          }
        }

        // Handle category logic
        let finalCategory = data.category;
        if (data.category === 'other' && data.custom_category) {
          finalCategory = data.custom_category;
        } else if (!data.category || data.category === '') {
          finalCategory = null; // No category
        }

        // Get user profile to determine identity based on verification status
        let userIdentity = 'custom_anon'; // Default
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_verified, privacy_profile')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            if (profile.is_verified) {
              // Verified user always posts as verified
              userIdentity = 'verified';
            } else {
              // Map privacy_profile to identity
              const privacyMap = {
                'verified': 'custom_anon', // Can't be verified without is_verified flag
                'custom': 'custom_anon',
                'anonymous': 'anonymous'
              };
              userIdentity = privacyMap[profile.privacy_profile] || 'custom_anon';
            }
          }
        } catch (error) {
          console.warn('Could not fetch user profile, using default identity:', error);
        }

        // Save post to database
        const postData = {
          user_id: session.user.id,
          content: data.content,
          category: finalCategory,
          identity: userIdentity,
          want_solution: data.want_solution === 'true',
          image_url: imageUrl,
          video_url: videoUrl
        };
        
          console.log('Saving post to database:', postData);
          console.log('Post data validation:');
          console.log('- user_id:', postData.user_id);
          console.log('- content:', postData.content);
          console.log('- category:', postData.category);
          console.log('- identity:', postData.identity);
          console.log('- want_solution:', postData.want_solution);
          console.log('- image_url:', postData.image_url);
          console.log('- video_url:', postData.video_url);
          
          let result, error;
          try {
            ({ data: result, error } = await supabase
              .from('posts')
              .insert(postData));
          } catch (e) {
            error = e;
          }

          console.log('Database insert attempt 1 result:', { result, error });
          
          if (error && (String(error.message || '').toLowerCase().includes('column "video_url"') || String(error.details || '').toLowerCase().includes('video_url'))) {
            console.warn('video_url column may not exist, retrying insert without video_url');
            const { video_url, ...fallbackPostData } = postData;
            const retry = await supabase
              .from('posts')
              .insert(fallbackPostData);
            console.log('Database insert attempt 2 (fallback) result:', retry);
            if (retry.error) {
              alert('Gagal menyimpan postingan: ' + retry.error.message);
              return;
            } else {
              result = retry.data;
            }
          } else if (error) {
            console.error('Error saving post:', error);
            alert('Gagal menyimpan postingan: ' + (error.message || 'unknown error'));
            return;
          }
          
        console.log('Post saved successfully:', result);
        console.log('=== POSTING DEBUG END ===');

        // Broadcast event so other pages/components can refresh feeds
        try {
          const evt = new Event('postCreated');
          window.dispatchEvent(evt);
        } catch (e) {
          // Older browsers fallback
          const evt = document.createEvent && document.createEvent('Event');
          if (evt && evt.initEvent) {
            evt.initEvent('postCreated', true, true);
            window.dispatchEvent(evt);
          }
        }

        // Show success toast
        try { window.showToast('Postingan berhasil disimpan! 🎉', 'success'); } catch(_) { alert('Postingan berhasil disimpan! 🎉'); }
        
        // Wait a moment before closing modal
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reset form and close modal
        createForm.reset();
        removeImage();
        const modal = document.querySelector('#createModal');
        if (modal) {
          modal.classList.remove('open');
        }
        
        // Force reload timeline if on timeline page
        if (window.location.pathname.includes('timeline')) {
          console.log('Posting from timeline page, reloading...');
          setTimeout(() => {
            console.log('Reloading timeline page...');
            window.location.reload();
          }, 2000);
        }
        
        // Force reload profile if on profile page
        if (window.location.pathname.includes('profile')) {
          console.log('Posting from profile page, reloading...');
          setTimeout(() => {
            console.log('Reloading profile page...');
            window.location.reload();
          }, 2000);
        }
        
        // For desktop page, try to reload timeline/profile if they're open in other tabs
        if (window.location.pathname.includes('desktop')) {
          console.log('Posting from desktop, checking for open timeline/profile tabs...');
          // Try to communicate with other tabs if they exist
          try {
            if (typeof loadPosts === 'function') {
              console.log('Trying to reload posts in current context...');
              loadPosts();
            }
          } catch (e) {
            console.log('Could not reload posts in current context:', e);
          }
        }
        
      } catch (error) {
        console.error('Error submitting post:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        // More specific error messages
        if (error.message.includes('Could not establish connection')) {
          alert('Error: Koneksi terputus. Silakan refresh halaman dan coba lagi.');
        } else if (error.message.includes('fetch')) {
          alert('Error: Gagal mengirim data. Periksa koneksi internet.');
        } else {
          alert('Terjadi kesalahan saat menyimpan postingan: ' + error.message);
        }
      }
    });
  });

  // Helpful toggle demo
  $all('[data-helpful]').forEach(btn => {
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!on));
      btn.textContent = !on ? 'Marked Helpful' : 'Mark Helpful';
    });
  });

  // Theme toggle
  const THEME_KEY = 'speakup_theme';
  const root = document.documentElement;
  
  // Initialize theme on page load
  const initializeTheme = () => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
      localStorage.setItem(THEME_KEY, 'light');
      // Force white background and dark text for light theme
      document.body.style.backgroundColor = '#ffffff';
      document.documentElement.style.backgroundColor = '#ffffff';
      document.body.style.color = '#374151';
      document.documentElement.style.color = '#374151';
      
      // Force dark blue accent for light theme (avoid overriding buttons/CTAs)
      const accentElements = document.querySelectorAll('.tab.active, .bottom-nav a.active, .bottom-nav button.active');
      accentElements.forEach(el => {
        el.style.color = '#1e40af';
        el.style.borderColor = '#1e40af';
      });
    }
  };
  
  // Apply theme function
  const applyTheme = (isDark) => {
    if (isDark) {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem(THEME_KEY, 'dark');
      // Force darker grey background for dark theme
      document.body.style.backgroundColor = '#1f2937';
      document.documentElement.style.backgroundColor = '#1f2937';
      document.body.style.color = '';
      document.documentElement.style.color = '';
    } else {
      root.removeAttribute('data-theme');
      localStorage.setItem(THEME_KEY, 'light');
      // Force white background and dark text for light theme
      document.body.style.backgroundColor = '#ffffff';
      document.documentElement.style.backgroundColor = '#ffffff';
      document.body.style.color = '#374151';
      document.documentElement.style.color = '#374151';
      
      // Force dark blue accent for light theme (avoid overriding buttons/CTAs)
      const accentElements = document.querySelectorAll('.tab.active, .bottom-nav a.active, .bottom-nav button.active');
      accentElements.forEach(el => {
        el.style.color = '#1e40af';
        el.style.borderColor = '#1e40af';
      });
    }
  };

  // Initialize theme
  initializeTheme();

  // Force white background and dark text on page load if light theme
  const forceWhiteBackground = () => {
    const currentTheme = localStorage.getItem(THEME_KEY);
    if (currentTheme !== 'dark') {
      document.body.style.backgroundColor = '#ffffff';
      document.documentElement.style.backgroundColor = '#ffffff';
      document.body.style.color = '#374151';
      document.documentElement.style.color = '#374151';
      
      // Force dark blue accent for light theme (avoid overriding buttons/CTAs)
      const accentElements = document.querySelectorAll('.tab.active, .bottom-nav a.active, .bottom-nav button.active');
      accentElements.forEach(el => {
        el.style.color = '#1e40af';
        el.style.borderColor = '#1e40af';
      });
    }
  };

  // Run on page load
  forceWhiteBackground();

  // Run after a short delay to ensure DOM is ready
  setTimeout(forceWhiteBackground, 100);

  // Handle data-toggle-theme buttons
  $all('[data-toggle-theme]').forEach(btn => {
    btn.addEventListener('click', () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      applyTheme(!isDark);
      btn.textContent = !isDark ? 'Dark' : 'Light';
    });
  });

  // Settings modal
  const settingsModal = $('#settingsModal');
  const openSettings = $('[data-open-settings]');
  const closeSettings = $('#closeSettings');
  if (openSettings && settingsModal) {
    openSettings.addEventListener('click', () => {
      // set switch value based on current theme
      const themeIsDark = root.getAttribute('data-theme') === 'dark';
      const themeSwitch = $('#switchTheme');
      if (themeSwitch) themeSwitch.checked = themeIsDark;
      settingsModal.classList.add('open');
      settingsModal.setAttribute('aria-hidden', 'false');
    });
  }
  closeSettings && closeSettings.addEventListener('click', () => {
    settingsModal.classList.remove('open');
    settingsModal.setAttribute('aria-hidden', 'true');
  });
  settingsModal && settingsModal.addEventListener('click', (e) => { 
    if (e.target === settingsModal) {
      settingsModal.classList.remove('open');
      settingsModal.setAttribute('aria-hidden', 'true');
    }
  });

  // SwitchTheme within settings
  const switchTheme = $('#switchTheme');
  switchTheme && switchTheme.addEventListener('change', (e) => {
    const checked = e.target.checked;
    applyTheme(checked);
  });

  // Initialize theme switch state on page load
  const initializeThemeSwitch = () => {
    const themeSwitch = $('#switchTheme');
    if (themeSwitch) {
      const isDark = root.getAttribute('data-theme') === 'dark';
      themeSwitch.checked = isDark;
    }
  };

  // Initialize theme switch when page loads
  initializeThemeSwitch();

  // Profile modal
  const profileModal = $('#profileModal');
  const openProfile = $('[data-open-profile]');
  const closeProfile = $('#closeProfile');
  if (openProfile && profileModal) {
    openProfile.addEventListener('click', () => {
      profileModal.classList.add('open');
      profileModal.setAttribute('aria-hidden', 'false');
    });
  }
  closeProfile && closeProfile.addEventListener('click', () => {
    profileModal.classList.remove('open');
    profileModal.setAttribute('aria-hidden', 'true');
  });
  profileModal && profileModal.addEventListener('click', (e) => { 
    if (e.target === profileModal) {
      profileModal.classList.remove('open');
      profileModal.setAttribute('aria-hidden', 'true');
    }
  });

  // Function to wrap all "SpeakUp!" text with brand-name class
  function wrapSpeakUpText() {
    console.log('Starting to wrap SpeakUp! text...');
    
    // First, handle existing spans with class "accent" that contain "SpeakUp!"
    const accentSpans = document.querySelectorAll('.accent');
    accentSpans.forEach(span => {
      if (span.textContent.includes('SpeakUp!')) {
        span.classList.add('brand-name');
        console.log('Added brand-name class to existing accent span');
      }
    });

    // Get all text nodes in the document
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.includes('SpeakUp!')) {
        textNodes.push(node);
      }
    }

    console.log(`Found ${textNodes.length} text nodes containing "SpeakUp!"`);

    // Replace text in each node
    textNodes.forEach(textNode => {
      const parent = textNode.parentNode;
      // Skip if already wrapped or if parent is a script/style tag
      if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || 
          parent.classList.contains('brand-name') || parent.classList.contains('accent')) {
        return;
      }

      const text = textNode.textContent;
      if (text.includes('SpeakUp!')) {
        const newHTML = text.replace(/SpeakUp!/g, '<span class="brand-name">SpeakUp!</span>');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newHTML;
        
        // Replace the text node with the new content
        while (tempDiv.firstChild) {
          parent.insertBefore(tempDiv.firstChild, textNode);
        }
        parent.removeChild(textNode);
        console.log('Wrapped SpeakUp! text with brand-name class');
      }
    });

    console.log('Finished wrapping SpeakUp! text');
  }

  // Additional function to force apply brand styling
  function forceBrandStyling() {
    // Apply styling to all elements containing "SpeakUp!"
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.textContent && el.textContent.includes('SpeakUp!') && 
          el.children.length === 0) { // Only text nodes
        el.style.color = '#38bdf8';
        el.style.fontWeight = '700';
        el.classList.add('brand-name');
      }
    });

    // Force style on existing accent spans
    document.querySelectorAll('.accent').forEach(el => {
      if (el.textContent.includes('SpeakUp!')) {
        el.style.color = '#38bdf8 !important';
        el.style.fontWeight = '700 !important';
        el.classList.add('brand-name');
      }
    });

    console.log('Force brand styling applied');
  }

  // Initialize modal when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initModal();
      wrapSpeakUpText();
      setTimeout(forceBrandStyling, 100); // Run after DOM is fully loaded
    });
  } else {
    initModal();
    wrapSpeakUpText();
    setTimeout(forceBrandStyling, 100);
  }

  // Run again after page is fully loaded
  window.addEventListener('load', () => {
    setTimeout(() => {
      wrapSpeakUpText();
      forceBrandStyling();
    }, 200);
  });

  // Emoji Picker Functions
  // Helper: scope query to the currently open create modal if present
  function getActiveCreateScope() {
    const openModal = document.querySelector('#createModal.open, #createModal[aria-hidden="false"], [data-modal="create"].open');
    return openModal || document;
  }

  window.toggleEmojiPicker = function() {
    const scope = getActiveCreateScope();
    const emojiPicker = scope.querySelector('.emoji-picker') || scope.querySelector('#emojiPicker') || document.querySelector('.emoji-picker') || document.getElementById('emojiPicker');
    console.log('toggleEmojiPicker called, picker found:', !!emojiPicker);
    
    if (emojiPicker) {
      const isVisible = emojiPicker.style.display === 'block' || emojiPicker.classList.contains('open');
      if (isVisible) {
        emojiPicker.style.display = 'none';
        emojiPicker.classList.remove('open');
      } else {
        emojiPicker.style.display = 'block';
        emojiPicker.classList.add('open');
      }
    } else {
      console.error('Emoji picker not found in current scope!');
    }
  };

  window.insertEmoji = function(emoji) {
    const scope = getActiveCreateScope();
    const textarea = scope.querySelector('textarea[name="content"]') || document.querySelector('textarea[name="content"]');
    if (textarea) {
      const currentPos = textarea.selectionStart;
      const textBefore = textarea.value.substring(0, currentPos);
      const textAfter = textarea.value.substring(textarea.selectionEnd);
      
      textarea.value = textBefore + emoji + textAfter;
      textarea.focus();
      textarea.setSelectionRange(currentPos + emoji.length, currentPos + emoji.length);
      
      // Trigger input event to update any listeners
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Hide emoji picker after selection
      const emojiPicker = scope.querySelector('.emoji-picker') || scope.querySelector('#emojiPicker') || document.querySelector('.emoji-picker') || document.getElementById('emojiPicker');
      if (emojiPicker) {
        emojiPicker.style.display = 'none';
        emojiPicker.classList.remove('open');
      }
      
      console.log('Emoji inserted:', emoji);
    } else {
      console.error('Textarea not found!');
    }
  };

  // Delegated handler: toggle via data attribute across pages
  document.addEventListener('click', function(e) {
    const toggle = e.target.closest('[data-emoji-toggle]');
    if (!toggle) return;
    e.preventDefault();
    window.toggleEmojiPicker();
  });

  // Delegated handler: insert emoji when any .emoji-btn clicked (scoped)
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.emoji-btn');
    if (!btn) return;
    const emoji = btn.textContent && btn.textContent.trim();
    if (!emoji) return;
    e.preventDefault();
    window.insertEmoji(emoji);
  });

  // Close emoji picker when clicking outside
  document.addEventListener('click', function(e) {
    const emojiPicker = document.getElementById('emojiPicker');
    const emojiBtn = document.querySelector('[onclick="toggleEmojiPicker()"]');
    
    if (emojiPicker && (emojiPicker.style.display === 'block' || emojiPicker.classList.contains('open'))) {
      // Check if click is outside emoji picker and emoji button
      if (!emojiPicker.contains(e.target) && 
          (!emojiBtn || !emojiBtn.contains(e.target))) {
        emojiPicker.style.display = 'none';
        emojiPicker.classList.remove('open');
        console.log('Emoji picker closed by outside click');
      }
    }
  });

  // Keyboard navigation for emoji picker
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const emojiPicker = document.getElementById('emojiPicker');
      if (emojiPicker && (emojiPicker.style.display === 'block' || emojiPicker.classList.contains('open'))) {
        emojiPicker.style.display = 'none';
        emojiPicker.classList.remove('open');
        console.log('Emoji picker closed by Escape key');
      }
    }
  });

  // Emoji picker accessibility improvements
  document.addEventListener('DOMContentLoaded', function() {
    const emojiButtons = document.querySelectorAll('.emoji-btn');
    emojiButtons.forEach((btn, index) => {
      // Add ARIA labels for screen readers
      const emoji = btn.textContent;
      btn.setAttribute('aria-label', `Insert ${emoji} emoji`);
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', '0');
      
      // Add keyboard support
      btn.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });
  });

  // Emoji picker touch improvements (consolidated)
  document.addEventListener('touchstart', function(e) {
    if (e.target.classList.contains('emoji-btn')) {
      e.target.style.transform = 'scale(0.95)';
    }
  });

  document.addEventListener('touchend', function(e) {
    if (e.target.classList.contains('emoji-btn')) {
      e.target.style.transform = 'scale(1)';
    }
  });

  // Emoji picker initialization (consolidated)
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize existing emoji pickers
    const emojiPickers = document.querySelectorAll('#emojiPicker');
    emojiPickers.forEach(picker => {
      // Ensure emoji picker is hidden by default
      picker.style.display = 'none';
      picker.classList.remove('open');
      
      // Add accessibility attributes to emoji buttons
      const emojiButtons = picker.querySelectorAll('.emoji-btn');
      emojiButtons.forEach((btn, index) => {
        const emoji = btn.textContent;
        btn.setAttribute('aria-label', `Insert ${emoji} emoji`);
        btn.setAttribute('role', 'button');
        btn.setAttribute('tabindex', '0');
        
        // Add keyboard support
        btn.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            btn.click();
          }
        });
      });
    });
  });

  // =============================
  // Global Toast + Logout Support
  // =============================
  // Lightweight toast for global reuse across pages
  if (!window.showToast) {
    window.showToast = function showToast(message, type = 'info') {
      const hostId = 'su-toast-host';
      let host = document.getElementById(hostId);
      if (!host) {
        host = document.createElement('div');
        host.id = hostId;
        host.style.cssText = `position:fixed;left:50%;bottom:24px;transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;align-items:center;z-index:10000;pointer-events:none;`;
        document.body.appendChild(host);
      }

      const toast = document.createElement('div');
      toast.style.cssText = `background:#111827;color:#fff;border-radius:9999px;padding:10px 14px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.08);opacity:0;transform:translateY(8px);transition:all .25s ease;pointer-events:auto;white-space:nowrap;max-width:90vw;overflow:hidden;text-overflow:ellipsis;`;

      const dot = document.createElement('span');
      dot.style.cssText = `display:inline-block;width:8px;height:8px;border-radius:9999px;margin-right:8px;vertical-align:middle;`;
      dot.style.background = type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#60a5fa');

      const text = document.createElement('span');
      text.textContent = message;

      toast.appendChild(dot);
      toast.appendChild(text);
      host.appendChild(toast);

      requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; });
      setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(8px)'; setTimeout(() => { toast.remove(); if (host && host.children.length === 0) host.remove(); }, 250); }, 2400);
    }
  }
  // Universal logout that works on any page and redirects to homepage already logged out
  window.logout = async function logout() {
    try {
      if (window.__loggingOut) return; // idempotent guard
      window.__loggingOut = true;

      // Supabase signOut jika tersedia
      if ((typeof window.getSupabase === 'function') || (typeof window.supabase !== 'undefined' && window.SUPABASE_CONFIG)) {
        try {
          let supabase;
          if (typeof window.getSupabase === 'function') {
            supabase = window.getSupabase();
          } else if (window.supabase && window.supabase.createClient) {
            supabase = window.supabase.createClient(
              window.SUPABASE_CONFIG.url,
              window.SUPABASE_CONFIG.anonKey
            );
          } else {
            throw new Error('Supabase tidak tersedia');
          }
          await supabase.auth.signOut();
        } catch (e) {
          // tetap lanjut membersihkan sesi lokal
          console.warn('Supabase signOut failed or unavailable:', e);
        }
      }

      // Bersihkan sesi lokal
      try {
        localStorage.removeItem('speakup_logged_in');
        localStorage.removeItem('speakup_user_email');
        localStorage.removeItem('supabase.auth.token');
        // Hapus seluruh kunci supabase (sb-*) bila ada
        const keys = Object.keys(localStorage);
        keys.forEach(k => { if (k.startsWith('sb-') || k.startsWith('supabase.')) localStorage.removeItem(k); });
      } catch (_) {}
      // Arahkan ke homepage (desktop) dalam keadaan sudah logout agar konsisten
      await showAlert('Anda telah logout. Mengalihkan ke beranda...');
      window.location.replace('./desktop.html#loggedout');
    } catch (err) {
      console.error('Global logout error:', err);
      window.location.replace('./desktop.html#loggedout');
    }
  };

  // Delegated click: tangkap klik tombol dengan id signButton di halaman mana pun
  document.addEventListener('click', function(e) {
    const signBtn = e.target && e.target.closest && e.target.closest('#signButton');
    if (!signBtn) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    try {
      const isLoggedIn = localStorage.getItem('speakup_logged_in') === 'true';
      if (isLoggedIn) {
        window.logout();
      } else {
        window.location.replace('./sign-desktop.html');
      }
    } catch (_) {
      // Fallback jika localStorage error
      window.location.replace('./sign-desktop.html');
    }
  });

  // Paksa konversi tombol Sign menjadi Logout bila user sudah login (fallback lintas halaman)
  function forceSignButtonToLogoutIfNeeded() {
    try {
      const isLoggedIn = localStorage.getItem('speakup_logged_in') === 'true';
      const signButton = document.getElementById('signButton');
      if (!signButton) return;
      if (!isLoggedIn) return;
      // Set ke Logout tanpa mengubah gaya halaman
      signButton.href = 'javascript:void(0)';
      // Hapus onclick agar hanya delegated handler yang jalan (hindari dobel)
      try { signButton.onclick = null; } catch(_) {}
      signButton.title = 'Logout';
      // Jangan paksa innerHTML jika halaman sudah punya ikon custom; cukup pastikan labelnya mencantumkan Logout
      if (!signButton.textContent.toLowerCase().includes('logout')) {
        signButton.innerHTML = '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/></svg><span>Logout</span>';
      }
    } catch (e) {
      console.warn('forceSignButtonToLogoutIfNeeded error:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { forceSignButtonToLogoutIfNeeded(); handleLoggedOutLanding(); });
  } else {
    forceSignButtonToLogoutIfNeeded();
    handleLoggedOutLanding();
  }

  // Jika mendarat di halaman apapun dengan #loggedout, paksa tampilan sebagai belum login
  function handleLoggedOutLanding() {
    try {
      if (!location.hash || !location.hash.includes('loggedout')) return;
      // Pastikan flag login false
      localStorage.setItem('speakup_logged_in', 'false');
      const signButton = document.getElementById('signButton');
      if (signButton) {
        signButton.href = './sign-desktop.html';
        try { signButton.onclick = null; } catch(_) {}
        signButton.title = 'Login';
        if (!signButton.textContent.toLowerCase().includes('login')) {
          signButton.innerHTML = '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 10a1 1 0 011-1h8.586l-3.293-3.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L12.586 11H4a1 1 0 01-1-1z" clip-rule="evenodd"/></svg><span>Login</span>';
        }
      }
      // Optional: soft refresh UI sections if halaman memiliki fungsi tertentu
      try { if (typeof forceNavigationUpdate === 'function') forceNavigationUpdate(); } catch(_) {}
    } catch (e) {
      console.warn('handleLoggedOutLanding error:', e);
    }
  }

  // =============================
  // Friendly Modal (Alert/Confirm)
  // =============================
  function ensureModalHost() {
    let host = document.getElementById('speakup-modal-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'speakup-modal-host';
      document.body.appendChild(host);
    }
    return host;
  }

  function renderModal(html) {
    const host = ensureModalHost();
    host.innerHTML = html;
    return host;
  }

  function baseModalTemplate(contentHtml) {
    return `
    <div class="su-modal-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;z-index:9999;">
      <div class="su-modal" role="dialog" aria-modal="true" style="background:#ffffff;color:#111827;border-radius:12px;min-width:320px;max-width:90vw;padding:20px;box-shadow:0 10px 30px rgba(0,0,0,0.2);">
        ${contentHtml}
      </div>
    </div>`;
  }

  window.showAlert = function showAlert(message, options={}) {
    return new Promise(resolve => {
      const title = options.title || 'Informasi';
      const okText = options.okText || 'OK';
      const html = baseModalTemplate(`
        <div style="font-weight:700;font-size:16px;margin-bottom:12px;">${title}</div>
        <div style="font-size:14px;line-height:1.5;margin-bottom:16px;">${message}</div>
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <button id="su-ok" style="background:#38bdf8;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-weight:600;cursor:pointer;">${okText}</button>
        </div>
      `);
      const okBtn = html.querySelector('#su-ok');
      const close = () => { html.remove(); resolve(true); };
      okBtn.addEventListener('click', close);
      html.addEventListener('click', (e)=>{ if(e.target===html) close(); });
      document.addEventListener('keydown', function onKey(e){ if(e.key==='Escape'){ document.removeEventListener('keydown', onKey); close(); } });
    });
  };

  window.showConfirm = function showConfirm(message, options={}) {
    return new Promise(resolve => {
      const title = options.title || 'Konfirmasi';
      const okText = options.okText || 'OK';
      const cancelText = options.cancelText || 'Batal';
      const html = renderModal(baseModalTemplate(`
        <div style="font-weight:700;font-size:16px;margin-bottom:12px;">${title}</div>
        <div style="font-size:14px;line-height:1.5;margin-bottom:16px;">${message}</div>
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <button id="su-cancel" style="background:#e5e7eb;color:#111827;border:none;border-radius:8px;padding:8px 16px;font-weight:600;cursor:pointer;">${cancelText}</button>
          <button id="su-ok" style="background:#ef4444;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-weight:600;cursor:pointer;">${okText}</button>
        </div>
      `));
      const okBtn = html.querySelector('#su-ok');
      const cancelBtn = html.querySelector('#su-cancel');
      const resolveAndClose = (val) => { html.remove(); resolve(val); };
      okBtn.addEventListener('click', ()=> resolveAndClose(true));
      cancelBtn.addEventListener('click', ()=> resolveAndClose(false));
      html.addEventListener('click', (e)=>{ if(e.target===html) resolveAndClose(false); });
      document.addEventListener('keydown', function onKey(e){ if(e.key==='Escape'){ document.removeEventListener('keydown', onKey); resolveAndClose(false); } });
    });
  };

  // =============================
  // Global Delete Post Support
  // =============================
  window.deletePost = async function deletePost(postId) {
    try {
      if (!postId) return;
      // Ensure supabase available
      let supabase;
      if (window.getSupabase) {
        supabase = window.getSupabase();
      } else if (window.supabase && window.supabase.createClient && window.SUPABASE_CONFIG) {
        supabase = window.supabase.createClient(
          window.SUPABASE_CONFIG.url,
          window.SUPABASE_CONFIG.anonKey
        );
      } else {
        showAlert('Database tidak tersedia. Coba refresh.');
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { showAlert('Anda harus login.'); return; }

      // Verify ownership
      const { data: post, error: fetchErr } = await supabase
        .from('posts').select('id,user_id').eq('id', postId).single();
      if (fetchErr || !post) { showAlert('Post tidak ditemukan.'); return; }
      if (post.user_id !== session.user.id) { showAlert('Anda tidak berwenang menghapus post ini.'); return; }

      // Confirm
      const agreed = await showConfirm('Hapus postingan ini? Tindakan tidak dapat dibatalkan.');
      if (!agreed) return;

      // Best-effort delete children first to avoid FK issues
      try { await supabase.from('post_likes').delete().eq('post_id', postId); } catch (_) {}
      try { await supabase.from('post_comments').delete().eq('post_id', postId); } catch (_) {}
      try { await supabase.from('post_saves').delete().eq('post_id', postId); } catch (_) {}

      // Delete post
      const { error: delErr } = await supabase.from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', session.user.id);
      if (delErr) { showAlert('Gagal menghapus: ' + delErr.message); return; }

      // Remove from DOM if exists
      const el = document.getElementById(`post-${postId}`);
      if (el && el.parentNode) el.parentNode.removeChild(el);

      // Notify and refresh lists if available
      try { window.dispatchEvent(new Event('postDeleted')); } catch (_) {}
      try { if (typeof loadPosts === 'function') loadPosts(); } catch (_) {}
      try { if (typeof loadUserPosts === 'function') loadUserPosts(); } catch (_) {}

    } catch (err) {
      console.error('deletePost error:', err);
      showAlert('Terjadi kesalahan saat menghapus post.');
    }
  };
})();



