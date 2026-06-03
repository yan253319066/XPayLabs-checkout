# XPay Labs (xpay) Checkout — Self-Hosted Crypto Payment Checkout Page

English | [中文](README.zh.md)

**XPay Labs (xpay) Checkout** is a self-hosted, white-label cryptocurrency payment checkout page built with Vue 3 + TypeScript. It renders a seamless payment UI that connects to your [XPay Labs (xpay)](https://www.xpaylabs.com) self-hosted gateway — customers see your brand, pay with USDT/USDC on TRON, EVM chains, or SUI, and get real-time payment status updates.

## Features

- **White-label** — No third-party branding. Your brand, your domain, your checkout.
- **Multi-chain support** — TRON (TRC20), Ethereum, BNB Chain, Polygon, Arbitrum, Optimism, Base, and more
- **Multi-language** — English, Chinese (Simplified), Chinese (Traditional)
- **Real-time payment polling** — Detects transaction confirmations as they happen
- **QR code payment** — Displays payment QR codes for mobile wallet users
- **Responsive design** — Works on desktop and mobile
- **Lightweight** — Vue 3 + TypeScript + Vite

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173/?orderId=ORDER_123&sign=your_signature&lang=en`

## Tech Stack

- Vue 3 + TypeScript + Vite 7
- Pinia (state management)
- Vue Router
- Axios (HTTP client)
- QRCode (payment QR generation)

## Integration

This checkout page works with the XPay Labs payment gateway. Point it at your self-hosted gateway API to create invoices, generate payment addresses, and poll for transaction status.

### Related Repositories

- [XPay Labs Website](https://github.com/yan253319066/XPayLabs) — Marketing site & docs
- [Node.js SDK](https://github.com/yan253319066/XPayLabs-node-sdk) — Backend API client
- [Java SDK](https://github.com/yan253319066/XPayLabs-java-sdk) — Java/Spring Boot API client
- [React Example](https://github.com/yan253319066/XPayLabs-example-react) — React integration demo
- [Vue 3 Example](https://github.com/yan253319066/XPayLabs-example-vue) — Vue 3 integration demo

## License

MIT
