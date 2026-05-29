# XPay Labs Checkout

[English](README.md) | 中文

XPay Labs 加密货币支付结算页面 — 基于 Vue 3 + TypeScript 的支付网关界面。

## 功能特性

- 多语言支持（英文、简体中文、繁体中文）
- 多链加密货币支付（Ethereum、Bitcoin、BSC、Polygon、Tron）
- 实时支付状态轮询
- 响应式设计

## 快速开始

```bash
npm install
npm run dev
```

访问 `http://localhost:5173/?orderId=ORDER_123&sign=your_signature&lang=en`

## 技术栈

- Vue 3 + TypeScript + Vite
- Pinia（状态管理）
- Vue Router
- Axios（HTTP 客户端）
- QRCode（支付二维码生成）

## 许可证

MIT
