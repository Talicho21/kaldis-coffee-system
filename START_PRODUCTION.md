# How to Run in Production Mode

## ✅ Setup Complete!

All caches have been cleared and the production build is ready.

## Start the Application

### Step 1: Start Laravel Server

Open a terminal and run:
```bash
cd "C:\wamp64\www\company-system-main PWA is done\company-system-main"
php artisan serve
```

**Leave this terminal running!**

You should see:
```
INFO  Server running on [http://127.0.0.1:8000].
```

### Step 2: Open Your Browser

1. Open your browser
2. Go to: `http://127.0.0.1:8000`
3. **Press Ctrl+F5** to force refresh (clear browser cache)

## Verify It's Working

### Check 1: No Console Errors
- Open browser DevTools (F12)
- Go to Console tab
- You should see:
  - ✅ "Service Worker registered"
  - ✅ "App is ready for offline use"
  - ✅ "Sync service initialized"
- You should NOT see:
  - ❌ ERR_CONNECTION_REFUSED
  - ❌ 404 errors on manifest

### Check 2: Offline Features Work
1. Open DevTools (F12) → Application tab
2. Check:
   - ✅ Service Workers → Should show "sw.js" activated
   - ✅ Manifest → Should show "Kaldis Coffee System"
   - ✅ Storage → IndexedDB → Should see "KaldisOfflineDB"

### Check 3: Sync Status Visible
- Look at the top-right of the page
- You should see a sync status indicator showing "Synced"

## Test Offline Functionality

### Quick Test (2 minutes)

1. **Go to Inventory Counts → Create**
2. Select branch, period, and category
3. **Open DevTools (F12) → Network tab**
4. **Set to "Offline"** (dropdown at top)
5. Enter some counts
6. You should see:
   - 🟠 Orange "Offline Mode" banner at top
   - ✅ "Saved offline" messages
   - 🟠 Sync indicator shows "Offline Mode"
7. **Set back to "Online"**
8. You should see:
   - 🟢 Green "You're back online" banner
   - 🔵 "Syncing..." status
   - ✅ "Synced" status after a moment
9. Check database - data should be there!

## Troubleshooting

### Problem: Still seeing ERR_CONNECTION_REFUSED

**Solution:**
1. Stop the Laravel server (Ctrl+C)
2. Run: `npm run build` (rebuild assets)
3. Run: `php artisan optimize:clear`
4. Restart Laravel server: `php artisan serve`
5. Press Ctrl+F5 in browser

### Problem: White screen or React errors

**Solution:**
1. Check browser console for specific errors
2. Clear browser cache completely (Ctrl+Shift+Delete)
3. Try in incognito/private window
4. Check if server is running

### Problem: 404 on manifest.webmanifest

**Solution:**
Already fixed! The manifest path has been updated to `/build/manifest.webmanifest`

### Problem: Service Worker not registering

**Solution:**
1. Go to: chrome://serviceworker-internals/ (Chrome) or about:debugging#/runtime/this-firefox (Firefox)
2. Unregister all service workers for localhost
3. Refresh page (Ctrl+F5)

### Problem: Offline features not working

**Check:**
1. Browser DevTools → Application → Service Workers → Should be "activated"
2. Browser DevTools → Application → Storage → IndexedDB → Should see database
3. Browser console → Should see "Sync service initialized"
4. Network tab → Try setting to offline and test

## When to Rebuild

Rebuild the assets when you:
- Change any React/TypeScript code
- Change any CSS/styles
- Update dependencies
- Deploy to production

**Rebuild command:**
```bash
npm run build
php artisan optimize:clear
```

## Performance Notes

Production build is:
- ✅ Optimized for performance
- ✅ Code minified and compressed
- ✅ No hot reload (must rebuild for changes)
- ✅ Better for testing offline features
- ✅ Ready for deployment

## Next Steps

Once everything works:
1. Test all offline features thoroughly
2. Follow testing checklist in `OFFLINE_SYNC_SUMMARY.md`
3. Test on different browsers
4. Test on mobile devices
5. Deploy to staging/production

## Need Help?

- **Documentation**: See `docs/OFFLINE_SYNC_IMPLEMENTATION.md`
- **Quick Start**: See `docs/OFFLINE_SYNC_QUICK_START.md`  
- **Summary**: See `OFFLINE_SYNC_SUMMARY.md`

---

**Status**: ✅ Production build is ready!  
**Date**: December 15, 2025
