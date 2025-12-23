<?php

namespace App\Notifications;

use App\Services\GeezSMSService;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PreOrderPaidGeezSMSNotification extends Notification
{
    use Queueable;

    protected $preOrder;
    protected $smsService;

    public function __construct($preOrder)
    {
        $this->preOrder = $preOrder;
        $this->smsService = app(GeezSMSService::class);
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        // Since this is for customer SMS, we'll call this manually from the controller
        return [];
    }

    /**
     * Send SMS directly to customer using GeezSMS
     */
    public function sendCustomerSMS(): bool
    {
        if (!$this->smsService->isConfigured()) {
            return false;
        }

        $message = $this->generateSMSMessage();
        
        return $this->smsService->sendMessage(
            $this->preOrder->phone_number,
            $message
        );
    }

    /**
     * Generate the SMS message (optimized for GeezSMS - max 335 characters)
     */
    private function generateSMSMessage(): string
    {
        $message = "KALDIS - Order Confirmed!\n";
        $message .= "Order #: {$this->preOrder->order_number}\n";
        $message .= "Hi {$this->preOrder->client_name},\n";
        $message .= "Your order is PAID & confirmed.\n\n";
        
        $message .= "Collection:\n";
        $message .= "Day: {$this->preOrder->collectionDay->name}\n";
        $message .= "Branch: {$this->preOrder->collectionBranch->name}\n\n";
        
        $message .= "Total: \${$this->preOrder->total_amount}\n";
        $message .= "Items: " . count($this->preOrder->items) . "\n\n";
        $message .= "Thank you!";
        
        return $message;
    }
}
