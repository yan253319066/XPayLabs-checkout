// URL参数接口（从URL获取的参数）
export interface URLParams {
    orderId: string
    sign: string
}

// 支付参数接口（从后端获取的支付信息）
export interface PaymentParams {
    address: string // 注意：后端返回的是address，不是receiveAddress
    amount: string
    symbol: string
    chain: string
    uid?: string | null
    orderId: string
    expiredTime: number
    status: OrderStatus
}

// 订单状态枚举
export enum OrderStatus {
    INIT = 'INIT',
    PENDING = 'PENDING',
    PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
    SUCCESS = 'SUCCESS',
    EXPIRED = 'EXPIRED',
    FAILED = 'FAILED'
}

// 标准API响应格式
export interface ApiResponse<T> {
    code: number
    msg: string
    data: T
}

// 支付接口响应
export interface PaymentResponse extends ApiResponse<PaymentParams> { }

// 订单状态查询响应
export interface OrderStatusResponse extends ApiResponse<{
    status: OrderStatus
}> { }

// 支付配置接口
export interface PaymentConfig {
    pollingInterval: number // 轮询间隔(毫秒)
    maxPollingTime: number // 最大轮询时间(毫秒)
    timeoutBeforeExpiry: number // 过期前的提醒时间(秒数)
}

// 错误类型
export interface PaymentError {
    code: string
    message: string
    details?: any
}