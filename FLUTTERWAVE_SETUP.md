# Flutterwave Payment Integration Guide

## Overview

Ecclesia now uses **Flutterwave** for payment processing. Flutterwave supports:
- 🌍 **150+ countries**
- 💰 **34 currencies** including NGN, USD, GBP, EUR, etc.
- 💳 **Multiple payment methods**: Cards, Bank Transfer, USSD, Mobile Money
- 🇳🇬 **Perfect for Nigerian and international businesses**

## ✅ What's Been Implemented

1. **Payment Service** (`lib/services/payment-service.ts`)
   - Flutterwave SDK integration
   - Payment initialization with payment links
   - Payment verification

2. **API Endpoints**
   - `/api/payments/initialize` - Initialize payment and get payment URL
   - `/api/payments/verify` - Verify payment status
   - `/api/payments/callback` - Handle redirects from Flutterwave
   - `/api/webhooks/flutterwave` - Handle Flutterwave webhooks

3. **Frontend Integration**
   - Updated `DonateModal` component to redirect to Flutterwave
   - Added payment success/error handling in `GivingProjects`
   - Payment flow: User fills form → Redirects to Flutterwave → Returns to app → Webhook creates giving record

## 🔧 Setup Instructions

### 1. Sign up for Flutterwave

- Visit [flutterwave.com](https://flutterwave.com)
- Create an account (free to start)
- Complete business verification (required for live mode)

### 2. Get API Keys

1. Log in to your Flutterwave dashboard
2. Go to **Settings → API**
3. Copy your:
   - **Public Key** (starts with `FLWPUBK-`)
   - **Secret Key** (starts with `FLWSECK-`)
   - **Secret Hash** (for webhook verification)

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# Flutterwave API Keys
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
FLUTTERWAVE_SECRET_HASH=your-webhook-secret-hash

# For testing, use test keys instead
# FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
# FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
```

### 4. Configure Webhook

1. In Flutterwave dashboard, go to **Settings → Webhooks**
2. Add webhook URL: `https://your-domain.com/api/webhooks/flutterwave`
3. Copy the **Secret Hash** and add it to your environment variables
4. Select event: **charge.completed**
5. Save changes

## 🔄 Payment Flow

### User Journey
1. User clicks "Donate" on a project
2. User fills donation form (amount, type, notes)
3. User clicks "Donate" button
4. App calls `/api/payments/initialize`
5. User is redirected to Flutterwave payment page
6. User selects payment method (card, bank transfer, USSD, etc.)
7. User completes payment on Flutterwave
8. Flutterwave redirects back to `/api/payments/callback`
9. User sees success message on giving page

### Backend Flow
1. Payment initialized → Payment link created in Flutterwave
2. User completes payment → Flutterwave sends webhook to `/api/webhooks/flutterwave`
3. Webhook verifies payment → Creates giving record → Sends receipt email
4. User redirected back → Sees success message

## 🧪 Testing

### Test Mode
Use test keys (starts with `FLWPUBK_TEST-` and `FLWSECK_TEST-`):

**Test Cards:**
- **Successful Payment:**
  - Card: `5531886652142950`
  - CVV: `564`
  - Expiry: `09/32`
  - PIN: `3310`
  - OTP: `12345`

- **Declined Payment:**
  - Card: `5143010522339965`
  - CVV: `276`
  - Expiry: `08/32`
  - PIN: `3310`

- **Insufficient Funds:**
  - Card: `5258585922666506`
  - CVV: `883`
  - Expiry: `09/32`
  - PIN: `3310`

### Test Currencies
Test mode supports:
- NGN (Nigerian Naira)
- USD (US Dollar)
- GBP (British Pound)
- EUR (Euro)
- And many more...

## 🌍 Supported Countries

Flutterwave supports payments from **150+ countries**, including:

**Africa:**
- Nigeria, Kenya, Ghana, South Africa, Uganda, Tanzania, Rwanda, Zambia, etc.

**Europe:**
- UK, France, Germany, Spain, Italy, Netherlands, etc.

**Americas:**
- USA, Canada, Brazil, Mexico, etc.

**Asia:**
- India, UAE, Saudi Arabia, Singapore, etc.

## 💰 Supported Currencies

34 currencies supported, including:
- **NGN** - Nigerian Naira
- **USD** - US Dollar
- **GBP** - British Pound
- **EUR** - Euro
- **GHS** - Ghanaian Cedi
- **KES** - Kenyan Shilling
- **ZAR** - South African Rand
- **TZS** - Tanzanian Shilling
- **UGX** - Ugandan Shilling
- And 25 more...

## 📋 Checklist

- [ ] Flutterwave account created
- [ ] Business verification completed (for live mode)
- [ ] API keys (Public & Secret) added to environment variables
- [ ] Secret Hash added to environment variables
- [ ] Webhook URL configured in Flutterwave dashboard
- [ ] Webhook secret hash matches environment variable
- [ ] Test payment flow end-to-end in test mode
- [ ] Verify webhook receives payment events
- [ ] Test donation receipt email after payment
- [ ] Verify giving records are created correctly
- [ ] Test with real payment (small amount) in live mode

## 🐛 Troubleshooting

### Payment Not Initializing
- ✅ Check API keys are correct (Public & Secret)
- ✅ Verify environment variables are loaded
- ✅ Check browser console for errors
- ✅ Verify user is authenticated
- ✅ Check server logs for Flutterwave API errors

### Webhook Not Receiving Events
- ✅ Verify webhook URL is correct and publicly accessible
- ✅ Check webhook secret hash matches your environment variable
- ✅ Review Flutterwave dashboard for webhook logs
- ✅ Check server logs for errors
- ✅ Ensure webhook endpoint returns 200 OK

### Giving Record Not Created
- ✅ Verify webhook is receiving `charge.completed` event
- ✅ Check webhook signature verification
- ✅ Review server logs for errors
- ✅ Verify metadata (userId, type) is included in payment
- ✅ Check transaction status is 'successful'

### Email Receipt Not Sending
- ✅ Verify email service is configured
- ✅ Check email service logs
- ✅ Verify user email is valid
- ✅ Check spam folder

### Test Mode Issues
- ✅ Use test API keys (starts with `_TEST-`)
- ✅ Use test cards from documentation
- ✅ Follow test card prompts exactly (PIN, OTP, etc.)
- ✅ Check test mode is enabled in dashboard

## 💳 Payment Methods Supported

Flutterwave supports multiple payment methods:

1. **Cards**
   - Visa, Mastercard, Verve
   - Local and international cards

2. **Bank Transfer**
   - Direct bank transfers
   - Instant confirmation

3. **USSD**
   - Bank USSD codes
   - No internet required

4. **Mobile Money**
   - MTN, Vodafone, Airtel, etc.
   - Popular in East Africa

5. **Bank Account**
   - Pay directly from bank account
   - Supports Nigerian banks

## 🔐 Security

- Webhook signatures are verified using secret hash
- Payment metadata is validated before creating giving records
- User authentication is required for payment initialization
- Transaction IDs are stored to prevent duplicate processing
- Flutterwave is PCI-DSS compliant
- All payment data is encrypted

## 💵 Pricing

**Transaction Fees:**
- **Local cards (Nigeria):** 1.4% + ₦100 (capped at ₦2,000)
- **International cards:** 3.8%
- **Bank transfers:** 1.4% (capped at ₦5,000)
- **USSD:** ₦50 flat fee

Note: Fees may vary by country and payment method. Check [Flutterwave pricing](https://flutterwave.com/ng/pricing) for details.

## 📝 Notes

- **Default Currency**: NGN (Nigerian Naira)
- **Amount Format**: Actual amount (not smallest unit like kobo)
- **Metadata**: Payment metadata includes userId, type, projectId, and notes
- **Webhook Security**: Webhooks are verified using secret hash
- **Idempotency**: Duplicate payments are prevented by checking existing transaction IDs
- **Multi-currency**: Automatically converts to local currency when needed

## 📚 Resources

- [Flutterwave Documentation](https://developer.flutterwave.com/docs)
- [Flutterwave API Reference](https://developer.flutterwave.com/reference)
- [Test Cards](https://developer.flutterwave.com/docs/integration-guides/testing-helpers)
- [Webhook Guide](https://developer.flutterwave.com/docs/integration-guides/webhooks)
- [Country Support](https://flutterwave.com/ng/support/general/which-countries-does-flutterwave-support)
- [Currency Support](https://developer.flutterwave.com/docs/integration-guides/currencies)

## 🆘 Support

- **Flutterwave Support:** [support@flutterwave.com](mailto:support@flutterwave.com)
- **Documentation:** [developer.flutterwave.com](https://developer.flutterwave.com)
- **Community:** [Flutterwave Developer Community](https://developer.flutterwave.com/discuss)

## ⚡ Quick Start

```bash
# 1. Install dependencies (already done)
npm install flutterwave-node-v3

# 2. Add environment variables
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your-key-here
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your-key-here
FLUTTERWAVE_SECRET_HASH=your-webhook-hash

# 3. Test the integration
# - Go to /giving page
# - Click "Donate"
# - Fill form and submit
# - Complete payment with test card
# - Verify success message

# 4. Switch to live mode
# - Update to live API keys (remove _TEST)
# - Complete business verification
# - Test with small real payment
```

---

**Ready to accept donations from anywhere in the world! 🌍💰**

