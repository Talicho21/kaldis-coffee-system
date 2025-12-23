# Pre-Deployment Checklist for Plesk

## ⚠️ CRITICAL REQUIREMENTS

### 1. SSL Certificate (MANDATORY)
- [ ] **MUST have HTTPS enabled on Plesk**
- [ ] Service Workers ONLY work on HTTPS
- [ ] Without SSL, offline features will NOT work
- [ ] Let's Encrypt is free and works fine

---

## Before Upload

### Local Build
- [x] ✅ Built production assets (`npm run build`) - DONE
- [x] ✅ Verified `public/build/` folder exists - DONE
- [x] ✅ Service worker file exists (`public/build/sw.js`) - DONE
- [x] ✅ PWA manifest exists (`public/build/manifest.webmanifest`) - DONE

### Files to Prepare
- [ ] Create production `.env` file with correct settings
- [ ] Document database credentials (will be different on server)
- [ ] Backup current database (if updating existing deployment)

### Files to Upload
- [ ] All Laravel application files
- [ ] `public/build/` folder with ALL contents
- [ ] `composer.json` and `composer.lock`
- [ ] Routes, controllers, models, views
- [ ] Database migrations

### Files NOT to Upload
- [ ] ❌ `node_modules/` (too large)
- [ ] ❌ `vendor/` (install on server)
- [ ] ❌ `.env` (create on server)
- [ ] ❌ `storage/logs/` (will be created)

---

## On Plesk Server

### 1. Basic Setup
- [ ] Set document root to `public/` folder
- [ ] Create MySQL database
- [ ] Create database user with all privileges
- [ ] Note database credentials

### 2. Environment Configuration
- [ ] Create `.env` file on server
- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Set `APP_URL=https://yourdomain.com` (with HTTPS!)
- [ ] Configure database credentials
- [ ] Generate `APP_KEY`

### 3. Install Dependencies (via SSH)
```bash
composer install --optimize-autoloader --no-dev
```

### 4. Run Migrations
```bash
php artisan migrate --force
php artisan db:seed --force  # if needed
```

### 5. Set Permissions
```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 6. Cache Configuration
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 7. Enable SSL
- [ ] Install SSL certificate (Let's Encrypt recommended)
- [ ] Enable "Redirect HTTP to HTTPS"
- [ ] Verify site loads with `https://`

### 8. PHP Settings
- [ ] memory_limit: 256M
- [ ] max_execution_time: 60
- [ ] upload_max_filesize: 20M
- [ ] post_max_size: 20M

---

## Testing After Deployment

### Basic Functionality
- [ ] Site loads without errors
- [ ] Login/authentication works
- [ ] Database connections work
- [ ] Images and assets load
- [ ] All pages accessible

### PWA Features (Critical!)
- [ ] Open DevTools → Console
- [ ] See "Service Worker registered" message
- [ ] See "Sync service initialized" message
- [ ] No console errors

### Service Worker Check
- [ ] DevTools → Application → Service Workers
- [ ] Service worker shows as "activated"
- [ ] No errors in service worker

### Manifest Check
- [ ] DevTools → Application → Manifest
- [ ] Shows "Kaldis Coffee System"
- [ ] Icon displays correctly

### IndexedDB Check
- [ ] DevTools → Application → Storage → IndexedDB
- [ ] See "KaldisOfflineDB" database
- [ ] Database has proper structure

### Offline Functionality Test
1. [ ] Navigate to Inventory Counts → Create
2. [ ] Open DevTools → Network → Set to "Offline"
3. [ ] Enter some inventory counts
4. [ ] See "Saved offline" messages
5. [ ] See orange offline banner
6. [ ] Sync status shows "Offline Mode"
7. [ ] Set Network back to "Online"
8. [ ] See green "Back online" banner
9. [ ] See "Syncing..." status
10. [ ] See "Synced" status after completion
11. [ ] Verify data in database
12. [ ] Check no sync errors in logs

### Browser Compatibility
- [ ] Test on Chrome/Edge
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on mobile browsers

---

## Troubleshooting Quick Fixes

### If site shows 500 error:
```bash
php artisan key:generate
php artisan config:cache
chmod -R 775 storage bootstrap/cache
```

### If service worker not working:
- Check site is HTTPS (not HTTP)
- Clear browser cache (Ctrl+F5)
- Check `/build/sw.js` file exists
- Check browser console for errors

### If assets not loading:
- Verify `public/build/` was uploaded
- Check file permissions: `chmod -R 755 public/build`
- Check `.htaccess` in public folder

### If database error:
- Check `.env` database credentials
- Try `DB_HOST=localhost` instead of `127.0.0.1`
- Verify user has all privileges

---

## Important Files to Verify

After deployment, these URLs should work:

- [ ] `https://yourdomain.com` - Main site
- [ ] `https://yourdomain.com/build/sw.js` - Service worker
- [ ] `https://yourdomain.com/build/manifest.webmanifest` - PWA manifest
- [ ] `https://yourdomain.com/build/manifest.json` - Vite manifest
- [ ] `https://yourdomain.com/login` - Login page

---

## Security Final Check

- [ ] `APP_DEBUG=false`
- [ ] `APP_ENV=production`
- [ ] Strong database password
- [ ] HTTPS enabled
- [ ] `.git` folder not publicly accessible
- [ ] Proper file permissions set
- [ ] CSRF protection enabled (default)

---

## Performance Check

- [ ] OPcache enabled
- [ ] Config cached
- [ ] Routes cached
- [ ] Views cached
- [ ] Gzip compression enabled

---

## Backup Before Going Live

- [ ] Database backup created
- [ ] Files backup created
- [ ] `.env` file documented securely
- [ ] Admin credentials documented securely

---

## Post-Deployment Monitoring

First 24 Hours:
- [ ] Monitor error logs
- [ ] Check sync success/failure rates
- [ ] Monitor server resource usage
- [ ] Check user feedback

First Week:
- [ ] Review sync performance
- [ ] Check for offline data loss reports
- [ ] Monitor database growth
- [ ] Check IndexedDB quota issues

---

## Rollback Plan (Just in Case)

If something goes wrong:

1. **Restore database backup:**
   ```bash
   mysql -u user -p database_name < backup.sql
   ```

2. **Restore files from backup**

3. **Clear all caches:**
   ```bash
   php artisan cache:clear
   php artisan config:clear
   php artisan route:clear
   php artisan view:clear
   ```

4. **Check error logs for specific issues**

---

## Success Criteria

Deployment is successful when:

✅ Site loads with HTTPS  
✅ Login works  
✅ Database operations work  
✅ Service Worker registers  
✅ Offline mode works  
✅ Sync works when back online  
✅ No console errors  
✅ No 404 errors on assets  
✅ Mobile responsive  
✅ Multiple browsers work  

---

## Need Help?

- See: `docs/PLESK_DEPLOYMENT_GUIDE.md` - Full deployment guide
- See: `docs/OFFLINE_SYNC_IMPLEMENTATION.md` - Technical details
- See: `docs/OFFLINE_SYNC_QUICK_START.md` - User guide

---

**Ready to Deploy?** Follow the `PLESK_DEPLOYMENT_GUIDE.md` step by step!

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Production URL:** _____________  

---

Good luck! 🚀
