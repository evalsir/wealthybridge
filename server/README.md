# WealthyBridge Backend

## Setup
1. Copy .env.example to .env and fill in values.
2. npm install
3. npm start

## Features
- User registration with OTP verification (email/phone) and $10 fee.
- Login with username/email.
- Investment plans with limits, profits, cancellations.
- Payment gateways integrated with real-time currency conversion (base USD to chosen currency).
- Referrals with bonuses.
- Auto-reinvest via cron.
- Admin privileges: Create users, cancel investments, monitor transactions, update daily limits.
- Comment section with admin approval.
- Secure and logged.

## Security Notes
- Use HTTPS in production.
- Add rate limiting.
- Monitor logs.