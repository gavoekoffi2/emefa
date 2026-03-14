# EMEFA Integrations - Setup Guide

## 🌍 Tier 1 Integrations (African Focus)

---

## 1️⃣ WhatsApp Integration

### Overview
Connect your EMEFA assistants to WhatsApp Business API for messaging.

### Setup

#### Step 1: Get Meta Developer Account
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a business app (type: Business)
3. Add WhatsApp product

#### Step 2: Get Credentials
- **Phone Number ID**: Your WhatsApp Business phone number ID
- **Access Token**: Long-lived access token from Meta
- **Business Account ID**: Your WhatsApp Business Account ID
- **Webhook Verify Token**: Any random string (e.g., `emefa_whatsapp_2024`)

#### Step 3: Configure EMEFA
In your `.env`:
```bash
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxx
WHATSAPP_BUSINESS_ACCOUNT_ID=999999999999999
WHATSAPP_WEBHOOK_TOKEN=emefa_whatsapp_2024
```

#### Step 4: Set Webhook in Meta Dashboard
```
Webhook URL: https://your-domain.com/api/v1/webhooks/whatsapp
Verify Token: emefa_whatsapp_2024
Subscribe to: messages, message_status
```

#### Step 5: Test
```bash
curl -X POST http://localhost:8000/api/v1/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_phone": "233123456789",
    "message": "Hello from EMEFA!"
  }'
```

### Usage in Skills

```python
from app.integrations import WhatsAppIntegration

async def send_whatsapp_reply(skill_config: dict, recipient: str, message: str):
    wa = WhatsAppIntegration(
        phone_number_id=skill_config["phone_number_id"],
        access_token=skill_config["access_token"],
        business_account_id=skill_config["business_account_id"],
    )
    
    response = await wa.send_text_message(recipient, message)
    await wa.close()
    return response
```

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check access token validity and expiry |
| Webhook not called | Ensure webhook URL is public and HTTPS |
| Messages not sent | Verify phone number format (+country_code) |
| Rate limited | Wait 1 hour or use queue system |

---

## 2️⃣ Telegram Integration

### Overview
Build Telegram bots powered by EMEFA assistants.

### Setup

#### Step 1: Create Bot
1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Follow instructions to create bot
4. Copy your **Bot Token** (format: `123456789:ABCdefGHIjklmno-PQRstuvWxyzABC`)

#### Step 2: Configure EMEFA
In your `.env`:
```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmno-PQRstuvWxyzABC
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/v1/webhooks/telegram
```

#### Step 3: Set Webhook
```bash
curl -X POST https://api.telegram.org/bot{BOT_TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/v1/webhooks/telegram",
    "allowed_updates": ["message", "callback_query"]
  }'
```

#### Step 4: Test
Send a message to your bot on Telegram - it should be processed by EMEFA.

### Usage in Skills

```python
from app.integrations import TelegramIntegration

async def send_telegram_message(skill_config: dict, chat_id: int, text: str):
    telegram = TelegramIntegration(
        bot_token=skill_config["bot_token"],
    )
    
    response = await telegram.send_message(
        chat_id=chat_id,
        text=text,
        parse_mode="HTML"
    )
    await telegram.close()
    return response
```

### Interactive Messages

```python
# Send buttons
await telegram.send_message(
    chat_id=123456,
    text="Choose an option:",
    keyboard={
        "type": "inline",
        "buttons": [
            [{"text": "Option 1", "callback_data": "opt1"}],
            [{"text": "Option 2", "callback_data": "opt2"}],
        ]
    }
)
```

---

## 3️⃣ Google Sheets Integration

### Overview
Read/write data directly to Google Sheets from assistants.

### Setup

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable **Google Sheets API**
4. Enable **Google Drive API**

#### Step 2: Create Service Account
1. Go to **Service Accounts** in Google Cloud Console
2. Create new service account
3. Create JSON key
4. Download the JSON file

#### Step 3: Share Spreadsheet
1. Create a Google Sheet
2. Click **Share**
3. Add the service account email (from JSON file) with **Editor** access

#### Step 4: Configure EMEFA
Save the JSON file to your project:
```bash
cp ~/Downloads/service-account-key.json ./backend/config/gsheet-credentials.json
```

In `.env`:
```bash
GOOGLE_SHEETS_CREDENTIALS=./config/gsheet-credentials.json
GOOGLE_SHEETS_SPREADSHEET_ID=1aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890
```

#### Step 5: Test
```python
from app.integrations import GoogleSheetsIntegration

gsheet = GoogleSheetsIntegration("./config/gsheet-credentials.json")

# Read values
values = await gsheet.get_values("Sheet1!A1:D10")
print(values)

# Append row
success = await gsheet.append_row_as_dict("Sheet1", {
    "Name": "John Doe",
    "Email": "john@example.com",
    "Status": "Active"
})

await gsheet.close()
```

### Common Ranges
- `Sheet1!A1:D10` - Specific range
- `Sheet1` - Entire sheet
- `'My Sheet'!A1:A` - Entire column

---

## 4️⃣ African SMS Integration

### Overview
Send SMS via **Africas Talking** (primary) or **Twilio** (fallback).

### Africa's Talking (Recommended for Africa)

#### Setup

1. Sign up at [africastalking.com](https://africastalking.com)
2. Go to Dashboard > Settings
3. Copy **API Key**
4. Note your **Username** (usually "sandbox" for testing)

#### Configure EMEFA
In `.env`:
```bash
SMS_PROVIDER=africastalking
AFRICAS_TALKING_API_KEY=xxx_yyy_zzz
AFRICAS_TALKING_USERNAME=sandbox
```

#### Usage
```python
from app.integrations import AfricaTalkingSMSIntegration

sms = AfricaTalkingSMSIntegration(
    api_key="xxx_yyy_zzz",
    username="sandbox"
)

# Send single SMS
response = await sms.send_sms(
    phone_number="+233123456789",
    message="Hello from EMEFA!",
    sender_id="EMEFA"
)

# Send bulk
response = await sms.send_bulk_sms(
    phone_numbers=["+233123456789", "+233987654321"],
    message="Bulk message",
    sender_id="EMEFA"
)

# Check balance
balance = await sms.get_account_balance()
print(f"Balance: {balance['UserData']['balance']}")

await sms.close()
```

#### Supported Countries
- Ghana (GH)
- Nigeria (NG)
- Kenya (KE)
- Uganda (UG)
- Tanzania (TZ)
- Senegal (SN)
- Ivory Coast (CI)
- More...

### Twilio (Global Fallback)

#### Setup

1. Sign up at [twilio.com](https://twilio.com)
2. Get **Account SID** and **Auth Token** from dashboard
3. Buy a phone number

#### Configure EMEFA
In `.env`:
```bash
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

#### Usage
```python
from app.integrations import TwilioSMSIntegration

sms = TwilioSMSIntegration(
    account_sid="AC...",
    auth_token="xxx..."
)

response = await sms.send_sms(
    to_phone="+233123456789",
    from_phone="+1234567890",
    message="Hello from EMEFA!"
)

await sms.close()
```

### Phone Number Validation

```python
from app.integrations import SMSIntegrationFactory
from app.integrations.african_sms_integration import PaymentValidator

# Validate phone
is_valid = PaymentValidator.validate_phone_number(
    phone="233123456789",
    country_code="GH"
)
```

---

## 5️⃣ African Payment Integration

### Overview
Process payments via **Paystack** (Primary) or **Mobile Money** (Regional).

### Paystack (Recommended Pan-African)

#### Setup

1. Sign up at [paystack.com](https://paystack.com)
2. Go to Settings > API Keys & Webhooks
3. Copy **Secret Key** (starts with `sk_`)
4. Copy **Public Key**

#### Configure EMEFA
In `.env`:
```bash
PAYMENT_PROVIDER=paystack
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
```

#### Usage

**Initialize Transaction:**
```python
from app.integrations import PaystackIntegration

paystack = PaystackIntegration(secret_key="sk_live_xxxxxxxxxxxxx...")

# Initialize payment (amount in kobo, 1 kobo = 1/100 of currency unit)
response = await paystack.initialize_transaction(
    amount=100000,  # 1000 NGN or 10 GHS
    email="customer@example.com",
    phone="233123456789",
    metadata={"order_id": "123", "product": "Premium"}
)

# Returns:
# {
#   "authorization_url": "https://checkout.paystack.com/xxx",
#   "access_code": "xxx",
#   "reference": "ref_xxx"
# }

await paystack.close()
```

**Verify Transaction:**
```python
paystack = PaystackIntegration(secret_key="sk_live_xxxxxxxxxxxxx...")

# After user completes payment
transaction = await paystack.verify_transaction(reference="ref_xxx")

if transaction["status"] == "success":
    print(f"Payment of {transaction['amount']/100} received!")
    print(f"Customer: {transaction['customer']['email']}")

await paystack.close()
```

#### Webhook Handling
```python
@router.post("/api/v1/webhooks/paystack")
async def handle_paystack_webhook(payload: dict):
    if payload["event"] == "charge.success":
        reference = payload["data"]["reference"]
        paystack = PaystackIntegration(secret_key=PAYSTACK_SECRET_KEY)
        
        transaction = await paystack.verify_transaction(reference)
        if transaction["status"] == "success":
            # Update order, send confirmation, etc.
            await order_service.mark_paid(reference)
        
        await paystack.close()
    
    return {"status": "ok"}
```

### Mobile Money (MOMO)

#### Setup

1. Register at [MTN MoMo API](https://www.mtn.com) or [Orange Money](https://www.orange.com)
2. Get **API Key**, **API Secret**, **Primary Key**

#### Configure EMEFA
In `.env`:
```bash
PAYMENT_PROVIDER=momo_africa
MOMO_API_KEY=xxxxxx
MOMO_API_SECRET=xxxxxx
MOMO_PRIMARY_KEY=xxxxxx
```

#### Usage
```python
from app.integrations import MOMOAfricaIntegration

momo = MOMOAfricaIntegration(
    api_key="xxx",
    api_secret="xxx",
    primary_key="xxx"
)

# Request payment
response = await momo.request_to_pay(
    amount=50.00,
    currency="XOF",  # West African Franc
    external_id="order_123",
    payer_message="Payment for order",
    payee_note="Order #123",
    phone_number="233123456789"
)

# Check status
import time
time.sleep(2)

status = await momo.get_transaction_status(response["reference_id"])
print(f"Status: {status['status']}")

await momo.close()
```

### Payment Validation

```python
from app.integrations.african_payments_integration import PaymentValidator

# Validate phone
is_valid_phone = PaymentValidator.validate_phone_number(
    phone="233123456789",
    country_code="GH"
)

# Validate amount
is_valid_amount = PaymentValidator.validate_amount(100.50)
```

---

## 🔄 Integration Patterns

### Pattern 1: Multi-Channel Messaging

```python
# Send via WhatsApp, fallback to SMS
async def send_notification(phone: str, message: str):
    try:
        # Try WhatsApp first
        wa = WhatsAppIntegration(...)
        await wa.send_text_message(phone, message)
    except Exception as e:
        logger.warning(f"WhatsApp failed: {e}, trying SMS")
        # Fallback to SMS
        sms = AfricaTalkingSMSIntegration(...)
        await sms.send_sms(phone, message)
```

### Pattern 2: Payment + Webhook

```python
# 1. Initialize payment
paystack = PaystackIntegration(...)
init = await paystack.initialize_transaction(
    amount=amount,
    email=email,
    metadata={"order_id": order_id}
)

# 2. Store reference
await db.save_payment(
    reference=init["reference"],
    order_id=order_id,
    status="pending"
)

# 3. Return checkout URL to frontend
return {"checkout_url": init["authorization_url"]}

# 4. Webhook verifies and updates
@router.post("/webhooks/paystack")
async def verify_payment(payload: dict):
    reference = payload["data"]["reference"]
    paystack = PaystackIntegration(...)
    transaction = await paystack.verify_transaction(reference)
    
    if transaction["status"] == "success":
        await db.update_payment(reference, "completed")
        await send_confirmation_email(transaction["customer"]["email"])
```

### Pattern 3: Sheet-Based Workflow

```python
# Store chat history in Google Sheets
gsheet = GoogleSheetsIntegration(...)

await gsheet.append_row_as_dict("Conversations", {
    "Timestamp": datetime.now().isoformat(),
    "User ID": user_id,
    "Message": user_message,
    "Assistant": assistant_name,
    "Response": assistant_response,
    "Sentiment": sentiment,
    "Category": category
})

await gsheet.close()
```

---

## 📊 Configuration Examples

### Complete .env
```bash
# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxx
WHATSAPP_BUSINESS_ACCOUNT_ID=999999999999999
WHATSAPP_WEBHOOK_TOKEN=emefa_whatsapp_2024

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmno
TELEGRAM_WEBHOOK_URL=https://api.example.com/webhooks/telegram

# Google Sheets
GOOGLE_SHEETS_CREDENTIALS=./config/gsheet-credentials.json

# SMS
SMS_PROVIDER=africastalking
AFRICAS_TALKING_API_KEY=xxx
AFRICAS_TALKING_USERNAME=sandbox

# Payments
PAYMENT_PROVIDER=paystack
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxx

# Fallback SMS
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🐛 Troubleshooting

### WhatsApp

| Error | Fix |
|-------|-----|
| `401 Unauthorized` | Check token validity at developers.facebook.com |
| `400 Bad Request` | Verify phone format (no + symbol, country code included) |
| `29 Error` | Check rate limits; wait and retry |

### Telegram

| Error | Fix |
|-------|-----|
| `Unauthorized bot` | Verify bot token is correct |
| `Webhook URL mismatch` | Use HTTPS, ensure URL is publicly accessible |

### Google Sheets

| Error | Fix |
|-------|-----|
| `403 Forbidden` | Check service account has access (shared with editor role) |
| `Invalid range` | Use proper A1 notation (e.g., "Sheet1!A1:D10") |

### SMS

| Error | Fix |
|-------|-----|
| `Invalid phone` | Use full format: +country_code + number |
| `Insufficient balance` | Top up account at provider website |
| `Provider timeout` | Retry with exponential backoff |

### Payments

| Error | Fix |
|-------|-----|
| `Invalid reference` | Check reference format and timing |
| `Transaction not found` | Wait a few seconds after initialization |
| `Insufficient funds` | User needs to top up account |

---

## 📚 Additional Resources

- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Telegram Bot API Docs](https://core.telegram.org/bots/api)
- [Google Sheets API Docs](https://developers.google.com/sheets/api)
- [Africas Talking Docs](https://africastalking.com/sms/api)
- [Paystack Docs](https://paystack.com/docs)

---

**Need help?** Check the examples in `/templates/skills/` or open an issue on GitHub.
