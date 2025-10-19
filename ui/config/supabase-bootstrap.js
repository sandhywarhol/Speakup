// Lightweight bootstrap to ensure a single global Supabase client is always available
(function(){
  // Avoid re-initialization
  if (window.__supabase) return;

  // Ensure supabase-js CDN is loaded (if page didn't include it yet)
  function ensureSupabaseJsLoaded() {
    return new Promise((resolve, reject) => {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        resolve();
        return;
      }
      const existing = document.querySelector('script[data-supabase-cdn]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load supabase-js')));
        return;
      }
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/@supabase/supabase-js@2';
      s.async = true;
      s.defer = true;
      s.setAttribute('data-supabase-cdn', 'true');
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load supabase-js'));
      document.head.appendChild(s);
    });
  }

  // Initialize once configuration is present
  async function initOnceConfigReady() {
    try {
      await ensureSupabaseJsLoaded();

      // Wait a short moment for config to be defined by supabase-config.js
      const MAX_WAIT_MS = 1500;
      const startedAt = Date.now();
      while (!window.SUPABASE_CONFIG && Date.now() - startedAt < MAX_WAIT_MS) {
        await new Promise(r => setTimeout(r, 50));
      }

      if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url || !window.SUPABASE_CONFIG.anonKey) {
        console.warn('[supabase-bootstrap] SUPABASE_CONFIG belum tersedia atau invalid. Fitur DB akan nonaktif sampai config disediakan.');
        return;
      }

      // Create singleton client
      window.__supabase = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
      );

      // Expose a helper getter to retrieve the singleton safely
      window.getSupabase = function getSupabase() {
        return window.__supabase || null;
      };

      // Also expose as global 'supabase' for backward compatibility
      window.supabase = window.__supabase;

      // Optional: simple connectivity probe (non-blocking)
      try {
        window.__supabase.from('posts').select('id').limit(1).then(()=>{
          console.log('[supabase-bootstrap] Supabase siap.');
        }).catch(()=>{});
      } catch(_) {}
    } catch (err) {
      console.error('[supabase-bootstrap] Gagal inisialisasi:', err);
    }
  }

  // Kickoff on DOMContentLoaded (but also run now if DOM already ready)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnceConfigReady);
  } else {
    initOnceConfigReady();
  }
})();


