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
    openBtn.addEventListener('click', () => modal.classList.add('open'));
  }
  
    // Handle data-open-create buttons (both mobile and desktop)
    $all('[data-open-create]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Speak! button clicked, opening modal...');
        if (modal) {
          modal.classList.add('open');
          console.log('Modal opened successfully');
        } else {
          console.error('Modal not found!');
        }
      });
    });
    
    closeBtn && closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    
    // Handle closeCreate2 button
    const closeBtn2 = $('#closeCreate2');
    closeBtn2 && closeBtn2.addEventListener('click', () => modal.classList.remove('open'));
    
    modal && modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
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

  // Media (image/video) preview handling for desktop create modal
  const mediaUpload = document.getElementById('mediaUpload');
  const mediaPreviewWrap = document.getElementById('mediaPreview');
  const previewImg = document.getElementById('previewImg');
  const previewVideo = document.getElementById('previewVideo');
  if (mediaUpload) {
    mediaUpload.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      if (file.type.startsWith('image/')) {
        if (previewImg) { previewImg.src = url; previewImg.style.display = 'block'; }
        if (previewVideo) { previewVideo.pause && previewVideo.pause(); previewVideo.src = ''; previewVideo.style.display = 'none'; }
      } else if (file.type.startsWith('video/')) {
        if (previewVideo) { previewVideo.src = url; previewVideo.style.display = 'block'; }
        if (previewImg) { previewImg.src = ''; previewImg.style.display = 'none'; }
      }
      if (mediaPreviewWrap) mediaPreviewWrap.style.display = 'block';
    });
  }
  window.removeMedia = function(){
    if (mediaUpload) mediaUpload.value = '';
    if (mediaPreviewWrap) mediaPreviewWrap.style.display = 'none';
    if (previewImg) { previewImg.src=''; previewImg.style.display='none'; }
    if (previewVideo) { previewVideo.pause && previewVideo.pause(); previewVideo.src=''; previewVideo.style.display='none'; }
  }

  // Remove image function
  window.removeImage = function() {
    const imageUpload = $('#imageUpload');
    const imagePreview = $('#imagePreview');
    const previewImg = $('#previewImg');
    
    if (imageUpload) imageUpload.value = '';
    if (imagePreview) imagePreview.style.display = 'none';
    if (previewImg) previewImg.src = '';
  };

  // Mock submit for all create forms
  $all('#createForm').forEach(createForm => {
    createForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(createForm).entries());
      const imageUpload = createForm.querySelector('#imageUpload');
      const imageFile = imageUpload ? imageUpload.files[0] : null;
      
      let message = 'Post terkirim (mock)\n\n';
      message += 'Konten: ' + data.content + '\n';
      message += 'Kategori: ' + data.category + '\n';
      message += 'Identitas: ' + data.identity + '\n';
      message += 'Ingin solusi: ' + (data.want_solution ? 'Ya' : 'Tidak') + '\n';
      
      if (imageFile) {
        message += 'Gambar: ' + imageFile.name + ' (' + (imageFile.size / 1024).toFixed(1) + ' KB)\n';
      }
      
      alert(message);
      createForm.reset();
      removeImage();
      modal.classList.remove('open');
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
    });
  }
  closeSettings && closeSettings.addEventListener('click', () => settingsModal.classList.remove('open'));
  settingsModal && settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) settingsModal.classList.remove('open'); });

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
    });
  }
  closeProfile && closeProfile.addEventListener('click', () => profileModal.classList.remove('open'));
  profileModal && profileModal.addEventListener('click', (e) => { if (e.target === profileModal) profileModal.classList.remove('open'); });

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
})();


