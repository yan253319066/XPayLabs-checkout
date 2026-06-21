# XPay Labs（简称 xpay）Checkout — 自托管加密货币支付结账页面

[English](README.md) | 中文

**XPay Labs（简称 xpay）Checkout** 是基于 Vue 3 + TypeScript 构建的自托管、白标加密货币支付结账页面。它提供无缝的支付 UI，连接到你的 [XPay Labs (xpay)](https://www.xpaylabs.com) 自托管网关 — 客户看到你的品牌，使用 USDT/USDC 在 TRON、EVM 链或 SUI 上支付，并实时获取支付状态更新。

## 功能特性

- **白标** — 无第三方品牌标识，你的品牌、你的域名、你的结账页面
- **多链支持** — TRON (TRC20)、Ethereum、BNB Chain、Polygon、Arbitrum、Optimism、Base 等
- **多语言** — 英文、简体中文、繁体中文
- **实时支付轮询** — 实时检测交易确认
- **二维码支付** — 支持手机钱包扫码支付
- **响应式设计** — 桌面端和移动端适配

## 快速开始

```bash
npm install
npm run dev
```

访问 `http://localhost:5173/?orderId=ORDER_123&sign=your_signature&lang=en`

## 技术栈

- Vue 3 + TypeScript + Vite 7
- Pinia（状态管理）
- Vue Router
- Axios（HTTP 客户端）
- QRCode（二维码生成）

## 仓库

**GitHub:** [yan253319066/XPayLabs-checkout](https://github.com/yan253319066/XPayLabs-checkout)
**Gitee（镜像）:** [XPayLabs/XPayLabs-checkout](https://gitee.com/XPayLabs/XPayLabs-checkout)

## 许可证

MIT
