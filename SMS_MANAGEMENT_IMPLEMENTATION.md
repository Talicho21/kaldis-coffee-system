# SMS Management System Implementation

## Overview
A comprehensive SMS management system has been implemented that allows administrators to:
- View SMS balance
- Activate/Deactivate SMS functionality
- Track who made changes and when
- Prevent SMS sending when service is deactivated
- Show appropriate messages when SMS is deactivated

## Database Changes

### New Table: `sms_settings`
```sql
- id (primary key)
- is_active (boolean, default: true)
- deactivation_reason (text, nullable)
- updated_by (foreign key to users table)
- created_at, updated_at (timestamps)
```

**Note:** The table is initialized with a default record where SMS is activated.

## New Model: SmsSettings

### Key Methods:
- `getInstance()` - Get the singleton instance
- `isActive()` - Check if SMS is currently active
- `activate($userId)` - Activate SMS service
- `deactivate($reason, $userId)` - Deactivate SMS service with reason

### Relationships:
- `updater()` - BelongsTo User (who last updated the settings)

## Service Updates

### GeezSMSService.php
**Updated Methods:**
- `sendMessage()` - Now checks if SMS is active before sending
- `sendBulkSMS()` - Now checks if SMS is active before sending bulk messages

**Behavior:**
- If SMS is deactivated, returns `false` immediately
- Logs warning with deactivation reason
- Does not make API call to GeezSMS

## Controller Updates

### SmsBalanceController.php (Renamed to SMS Management)
**New Methods:**
1. `index()` - Shows SMS balance + activation status
2. `getBalance()` - AJAX endpoint for balance and status
3. `activate()` - Activate SMS service
4. `deactivate(Request $request)` - Deactivate SMS with reason

**Permissions Required:**
- `view sms balance` - To view the management page
- `manage sms settings` - To activate/deactivate SMS

### PreOrderController.php
**Updated Methods:**
1. `update()` - When status changes to "Paid":
   - Checks if SMS is active before sending
   - Shows warning message if SMS is deactivated
   - Includes deactivation reason in the message

2. `sendBulkSmsReminders()` - Before sending bulk SMS:
   - Checks if SMS is active
   - Shows error with deactivation reason if not active

## New Permission

**Permission Name:** `manage sms settings`
**Description:** Allows users to activate/deactivate SMS service
**Usage:** Required for accessing activate/deactivate endpoints

## Routes Added

```php
// SMS Settings Management (Activate/Deactivate)
Route::middleware('permission:manage sms settings')->group(function () {
    Route::post('sms-balance/activate', [SmsBalanceController::class, 'activate'])
        ->name('sms-balance.activate');
    Route::post('sms-balance/deactivate', [SmsBalanceController::class, 'deactivate'])
        ->name('sms-balance.deactivate');
});
```

## User Messages

### When SMS is Deactivated:

**Pre-Order Status Change to "Paid":**
```
Success: "Pre-order {order_number} updated successfully."
Warning: "SMS notification could not be sent because SMS service is currently deactivated. 
          Reason: {deactivation_reason}"
```

**Bulk SMS Reminders:**
```
Error: "SMS service is currently deactivated. Reason: {deactivation_reason}"
```

**Activate SMS:**
```
Success: "SMS service has been activated successfully."
```

**Deactivate SMS:**
```
Success: "SMS service has been deactivated successfully."
```

## Logging

All SMS operations are logged with appropriate levels:
- **Warning:** When SMS is deactivated and send attempt is made
- **Info:** When SMS is sent successfully
- **Error:** When SMS fails to send (API errors)

## Frontend Integration Required

The frontend SMS management page needs to be updated to include:

1. **SMS Status Display:**
   - Active/Inactive badge
   - Deactivation reason (if deactivated)
   - Last updated by (user name)
   - Last updated timestamp

2. **Activate Button:**
   - Only visible if SMS is currently deactivated
   - Requires `manage sms settings` permission
   - POST to `/sms-balance/activate`

3. **Deactivate Button:**
   - Only visible if SMS is currently active
   - Requires `manage sms settings` permission
   - Shows modal/dialog to enter deactivation reason
   - POST to `/sms-balance/deactivate` with reason field

4. **Balance Display:**
   - Current balance from GeezSMS API
   - Refresh button
   - Last updated timestamp

## Testing Checklist

### Backend Testing (Completed ✅)
- [x] Migration created and run successfully
- [x] SmsSettings model created with methods
- [x] GeezSMSService checks activation status
- [x] Controllers updated to handle deactivated status
- [x] Permission seeded to database
- [x] Routes added for activate/deactivate

### Frontend Testing (Pending)
- [ ] SMS management page shows current status
- [ ] Activate button works and updates status
- [ ] Deactivate button shows modal for reason input
- [ ] Deactivate button updates status with reason
- [ ] Warning messages display correctly when SMS is deactivated
- [ ] Permission-based button visibility works

### Integration Testing (Pending)
- [ ] Pre-order status change to "Paid" when SMS is deactivated
- [ ] Pre-order status change to "Paid" when SMS is active
- [ ] Bulk SMS reminders when SMS is deactivated
- [ ] Bulk SMS reminders when SMS is active
- [ ] Balance check works regardless of activation status

## Usage Example

### Deactivate SMS:
```php
// In controller or console
SmsSettings::deactivate('Low balance - recharging account', auth()->id());
```

### Activate SMS:
```php
// In controller or console
SmsSettings::activate(auth()->id());
```

### Check Status:
```php
if (SmsSettings::isActive()) {
    // Send SMS
} else {
    // Show warning
}
```

## Security Notes

- Only users with `manage sms settings` permission can activate/deactivate
- All changes are tracked (who made the change and when)
- Deactivation requires a reason (helps with auditing)
- Activation clears the deactivation reason

## Database Seeding Note

The system automatically creates a default SMS settings record with:
- `is_active = true`
- `deactivation_reason = null`
- No updater initially

This ensures the system works immediately after migration without manual setup.
