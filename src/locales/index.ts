// Define translation text types
interface Translations {
    [lang: string]: {
        [key: string]: string;
    };
}

// Language pack
export const translations: Translations = {
    // Simplified Chinese
    'zh-CN': {
        loading: '正在加载支付信息...',
        error_title: '支付参数错误',
        error_return: '返回',
        payment_info: '支付信息',
        payment_amount: '支付金额:',
        blockchain: '区块链:',
        order_id: '订单号:',
        copy: '复制',
        copied: '已复制',
        receive_address: '收款地址',
        scan_to_pay: '扫码支付',
        instructions: '支付说明',
        instruction_1: '请确保发送的金额准确无误:',
        instruction_2: '请在',
        instruction_3: '网络上发送',
        instruction_4: '支付完成后系统将自动检测并跳转',
        instruction_5: '如有问题请联系客服',
        payment_success: '支付成功!',
        payment_expired: '支付已过期',
        payment_failed: '支付失败',
        payment_expired_message: '支付时间已过期，请重新发起支付',
        payment_failed_message: '支付过程中出现错误，请重新尝试或联系客服',
        retry: '返回重试',
        return: '返回',
        status_init: '等待支付',
        status_pending: '检测到交易，等待确认',
        status_pending_confirmation: '交易确认中',
        status_success: '支付成功',
        status_expired: '支付已过期',
        status_failed: '支付失败',
        status_unknown: '未知状态'
    },

    // Traditional Chinese
    'zh-TW': {
        loading: '正在加載支付信息...',
        error_title: '支付參數錯誤',
        error_return: '返回',
        payment_info: '支付信息',
        payment_amount: '支付金額:',
        blockchain: '區塊鏈:',
        order_id: '訂單號:',
        copy: '複製',
        copied: '已複製',
        receive_address: '收款地址',
        scan_to_pay: '掃碼支付',
        instructions: '支付說明',
        instruction_1: '請確保發送的金額準確無誤:',
        instruction_2: '請在',
        instruction_3: '網絡上發送',
        instruction_4: '支付完成後系統將自動檢測並跳轉',
        instruction_5: '如有問題請聯繫客服',
        payment_success: '支付成功!',
        payment_expired: '支付已過期',
        payment_failed: '支付失敗',
        payment_expired_message: '支付時間已過期，請重新發起支付',
        payment_failed_message: '支付過程中出現錯誤，請重新嘗試或聯繫客服',
        retry: '返回重試',
        return: '返回',
        status_init: '等待支付',
        status_pending: '檢測到交易，等待確認',
        status_pending_confirmation: '交易確認中',
        status_success: '支付成功',
        status_expired: '支付已過期',
        status_failed: '支付失敗',
        status_unknown: '未知狀態'
    },

    // English
    'en': {
        loading: 'Loading payment information...',
        error_title: 'Payment Parameter Error',
        error_return: 'Return',
        payment_info: 'Payment Information',
        payment_amount: 'Payment Amount:',
        blockchain: 'Blockchain:',
        order_id: 'Order ID:',
        copy: 'Copy',
        copied: 'Copied',
        receive_address: 'Receiving Address',
        scan_to_pay: 'Scan to Pay',
        instructions: 'Payment Instructions',
        instruction_1: 'Please ensure the sending amount is accurate:',
        instruction_2: 'Please send on',
        instruction_3: 'network',
        instruction_4: 'The system will automatically detect and redirect after payment',
        instruction_5: 'Please contact customer service if you have any issues',
        payment_success: 'Payment Successful!',
        payment_expired: 'Payment Expired',
        payment_failed: 'Payment Failed',
        payment_expired_message: 'Payment time has expired, please initiate payment again',
        payment_failed_message: 'An error occurred during payment, please try again or contact customer service',
        retry: 'Retry',
        return: 'Return',
        status_init: 'Waiting for Payment',
        status_pending: 'Transaction Detected, Awaiting Confirmation',
        status_pending_confirmation: 'Transaction Confirmation in Progress',
        status_success: 'Payment Successful',
        status_expired: 'Payment Expired',
        status_failed: 'Payment Failed',
        status_unknown: 'Unknown Status'
    }
}

// Get current language
export function getCurrentLanguage(url: string): string {
    try {
        const urlObj = new URL(url)
        const lang = urlObj.searchParams.get('lang')

        if (lang === 'en') return 'en'
        if (lang === 'zh-TW') return 'zh-TW'
        return 'en' // Default Simplified Chinese
    } catch (error) {
        return 'en' // Default Simplified Chinese
    }
}

// Get translated text
export function t(key: string, lang: string = 'zh-CN'): string {
    return translations[lang]?.[key] || translations['zh-CN'][key] || key
}