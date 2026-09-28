/**
 * KRCE Virtual Tour Analytics - Live Realtime Sync Engine (Supabase + BroadcastChannel)
 * Conforms to analytics/task.md specifications
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KRCELiveSync = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CHANNEL_NAME = 'krce_telemetry';
  const SUPABASE_CONFIG = {
    url: 'https://bqiajzfllcotjyskbczo.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxaWFqemZsbGNvdGp5c2tiY3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NjY5MzQsImV4cCI6MjEwNTA0MjkzNH0.r0uLpNJl6bei-qXguNmc1eQXSTeuhojIxdZyi1xubCM'
  };

  let listeners = [];
  let channel = null;
  let supabaseClient = null;

  function init() {
    // 1. Local sub-millisecond tab-to-tab BroadcastChannel
    if ('BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = function (event) {
          if (event.data) {
            notifyListeners(event.data);
          }
        };
      } catch (e) {
        console.warn('[LiveSync] BroadcastChannel skipped:', e);
      }
    }

    // 2. Storage event fallback
    window.addEventListener('storage', function (e) {
      if ((e.key === 'krce_tour_telemetry_v2' || e.key === 'krce_tour_telemetry_v1') && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          notifyListeners({ type: 'storage_update', payload: parsed });
        } catch (err) {}
      }
    });

    // 3. Supabase Cloud Realtime Channel (Global cross-device streaming)
    initSupabaseRealtime();
  }

  function initSupabaseRealtime() {
    try {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        
        supabaseClient
          .channel('public:scene_telemetry')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'scene_telemetry' },
            function (payload) {
              if (payload && payload.new) {
                notifyListeners({
                  type: 'scene_view',
                  sceneName: payload.new.scene_name,
                  dwell: payload.new.dwell_formatted || (payload.new.dwell_seconds ? payload.new.dwell_seconds + 's' : '1m 15s'),
                  dwellSeconds: payload.new.dwell_seconds,
                  device: payload.new.device_platform || 'Desktop Browser',
                  visitorId: payload.new.visitor_id,
                  sessionId: payload.new.session_id,
                  status: payload.new.status || 'active',
                  timestamp: payload.new.created_at ? new Date(payload.new.created_at).getTime() : Date.now(),
                  fromSupabase: true
                });
              }
            }
          )
          .subscribe(function (status) {
            console.log('[LiveSync] Supabase Realtime channel status:', status);
          });

        supabaseClient
          .channel('public:feature_interactions')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'feature_interactions' },
            function (payload) {
              if (payload && payload.new) {
                notifyListeners({
                  type: 'feature_click',
                  feature: payload.new.feature_name,
                  recordId: payload.new.id,
                  timestamp: payload.new.created_at ? new Date(payload.new.created_at).getTime() : Date.now(),
                  fromSupabase: true
                });
              }
            }
          )
          .subscribe();

        // Hydrate recent rows from Supabase cloud
        supabaseClient
          .from('scene_telemetry')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
          .then(function (res) {
            if (res && res.data && res.data.length > 0) {
              notifyListeners({
                type: 'supabase_hydrate',
                records: res.data
              });
            }
          })
          .catch(function (err) {
            console.warn('[LiveSync] Supabase hydration query skipped:', err);
          });

        // Hydrate recent feature clicks from Supabase cloud
        supabaseClient
          .from('feature_interactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200)
          .then(function (res) {
            if (res && res.data && res.data.length > 0) {
              notifyListeners({
                type: 'supabase_feature_hydrate',
                records: res.data
              });
            }
          })
          .catch(function (err) {
            console.warn('[LiveSync] Supabase feature hydration query skipped:', err);
          });
      }
    } catch (err) {
      console.warn('[LiveSync] Supabase Realtime init deferred:', err);
    }
  }

  function subscribe(callback) {
    if (typeof callback === 'function') {
      listeners.push(callback);
    }
  }

  function notifyListeners(data) {
    listeners.forEach(function (fn) {
      try {
        fn(data);
      } catch (e) {
        console.error('[LiveSync] Listener error:', e);
      }
    });
  }

  // Purge all telemetry from Supabase cloud database
  async function purgeAllCloudData() {
    let purged = false;
    // Method 1: Instant TRUNCATE via security definer RPC
    try {
      const res = await fetch(SUPABASE_CONFIG.url + '/rest/v1/rpc/purge_all_telemetry', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': 'Bearer ' + SUPABASE_CONFIG.anonKey,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        console.log('[LiveSync] Supabase database purged via purge_all_telemetry RPC.');
        purged = true;
      }
    } catch (e) {
      console.warn('[LiveSync] RPC purge skipped, attempting table DELETE:', e);
    }

    // Method 2: Fallback DELETE queries on both tables
    if (!purged) {
      try {
        await Promise.all([
          fetch(SUPABASE_CONFIG.url + '/rest/v1/scene_telemetry?id=gte.0', {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_CONFIG.anonKey,
              'Authorization': 'Bearer ' + SUPABASE_CONFIG.anonKey
            }
          }),
          fetch(SUPABASE_CONFIG.url + '/rest/v1/feature_interactions?id=gte.0', {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_CONFIG.anonKey,
              'Authorization': 'Bearer ' + SUPABASE_CONFIG.anonKey
            }
          })
        ]);
        console.log('[LiveSync] Supabase database purged via REST DELETE.');
        purged = true;
      } catch (err) {
        console.error('[LiveSync] Failed to purge cloud tables:', err);
      }
    }

    return purged;
  }

  function broadcast(data) {
    if (channel && data) {
      try {
        channel.postMessage(data);
      } catch (e) {}
    }
  }

  // Initialize immediately
  init();

  return {
    subscribe: subscribe,
    broadcast: broadcast,
    purgeAllCloudData: purgeAllCloudData,
    supabase: supabaseClient
  };
});
