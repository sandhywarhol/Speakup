(function(){
  // Singleton Supabase client accessor
  if (window.getSupabase && window.__supabaseSingleton) return;

  async function ensureSupabaseReady(maxWaitMs = 2000) {
    const start = Date.now();
    // Load supabase-js via bootstrap if not present
    if (!window.supabase || !window.supabase.createClient) {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/@supabase/supabase-js@2';
      document.head.appendChild(s);
    }
    while (Date.now() - start < maxWaitMs) {
      if (window.supabase && window.supabase.createClient && window.SUPABASE_CONFIG) break;
      await new Promise(r => setTimeout(r, 50));
    }
  }

  window.getSupabase = function getSupabase(){
    if (window.__supabaseSingleton) return window.__supabaseSingleton;
    if (!window.SUPABASE_CONFIG || !window.supabase) return null;
    window.__supabaseSingleton = window.supabase.createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.anonKey
    );
    return window.__supabaseSingleton;
  };

  // Eager init when DOM ready
  (async function init(){
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', async ()=>{
        await ensureSupabaseReady();
        window.getSupabase();
      });
    } else {
      await ensureSupabaseReady();
      window.getSupabase();
    }
  })();
})();



