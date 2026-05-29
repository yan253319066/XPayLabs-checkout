import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'
import type { PaymentResponse, OrderStatusResponse, PaymentError } from '@/types/payment'

// API configuration
export class PaymentAPI {
    private api: AxiosInstance
    private readonly maxRetries = 3
    private readonly retryDelay = 1000

    constructor(baseURL: string, timeout: number = 10000) {
        this.api = axios.create({
            baseURL,
            timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        })

        // Request interceptor
        this.api.interceptors.request.use(
            (config) => {
                // Add timestamp to prevent caching
                config.params = {
                    ...config.params,
                    _t: Date.now()
                }
                return config
            },
            (error) => Promise.reject(error)
        )

        // Response interceptor
        this.api.interceptors.response.use(
            (response) => {
                // Check for business-level errors
                if (response.data && response.data.code !== 200) {
                    const businessError = {
                        response: {
                            status: response.data.code,
                            data: {
                                message: response.data.msg || 'Business processing failed',
                                details: response.data
                            }
                        }
                    }
                    throw businessError
                }
                return response
            },
            (error) => {
                console.error('API request failed:', error)
                return Promise.reject(this.handleAPIError(error))
            }
        )
    }

    /**
     * Get payment information
     */
    async getPaymentInfo(orderId: string, sign: string): Promise<PaymentResponse> {
        try {
            const response = await this.retryRequest(() =>
                this.api.get<PaymentResponse>('/v1/order/pay', {
                    params: {
                        orderId,
                        sign
                    }
                })
            )
            return response.data
        } catch (error) {
            throw this.handleAPIError(error)
        }
    }

    /**
     * Query order status
     */
    async getOrderStatus(orderId: string, sign: string): Promise<OrderStatusResponse> {
        try {
            const response = await this.retryRequest(() =>
                this.api.get<OrderStatusResponse>('/v1/order/getOrderStatus', {
                    params: {
                        orderId,
                        sign
                    }
                })
            )
            return response.data
        } catch (error) {
            throw this.handleAPIError(error)
        }
    }

    /**
     * Request with retry mechanism
     */
    private async retryRequest<T>(
        requestFn: () => Promise<AxiosResponse<T>>,
        retryCount = 0
    ): Promise<AxiosResponse<T>> {
        try {
            return await requestFn()
        } catch (error: any) {
            if (retryCount < this.maxRetries && this.shouldRetry(error)) {
                await this.delay(this.retryDelay * (retryCount + 1))
                return this.retryRequest(requestFn, retryCount + 1)
            }
            throw error
        }
    }

    /**
     * Determine if retry should be attempted
     */
    private shouldRetry(error: any): boolean {
        // Network errors or 5xx server errors can be retried
        return !error.response ||
            error.code === 'NETWORK_ERROR' ||
            (error.response?.status >= 500 && error.response?.status < 600)
    }

    /**
     * Delay function
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * Unified error handling
     */
    private handleAPIError(error: any): PaymentError {
        if (error.response) {
            const status = error.response.status
            const data = error.response.data

            // Business-level errors (determined from API response code field)
            if (status >= 400 && status < 600) {
                return {
                    code: `BUSINESS_ERROR_${status}`,
                    message: data?.message || data?.msg || this.getDefaultErrorMessage(status),
                    details: data
                }
            }

            // HTTP-level errors
            return {
                code: `HTTP_${status}`,
                message: data?.message || data?.msg || 'Server request failed',
                details: data
            }
        } else if (error.request) {
            // Network errors
            return {
                code: 'NETWORK_ERROR',
                message: 'Network connection failed, please check your network connection',
                details: error.message
            }
        } else {
            // Other errors
            return {
                code: 'UNKNOWN_ERROR',
                message: error.message || 'Unknown error',
                details: error
            }
        }
    }

    /**
     * Get default error messages
     */
    private getDefaultErrorMessage(status: number): string {
        switch (status) {
            case 400:
                return 'Bad request parameters'
            case 401:
                return 'Unauthorized access'
            case 403:
                return 'Forbidden access'
            case 404:
                return 'Requested resource not found'
            case 500:
                return 'Internal server error'
            case 502:
                return 'Gateway error'
            case 503:
                return 'Service unavailable'
            case 504:
                return 'Gateway timeout'
            default:
                return 'Server request failed'
        }
    }
}

// Singleton API instance
let apiInstance: PaymentAPI | null = null

export function createPaymentAPI(baseURL: string): PaymentAPI {
    if (!apiInstance) {
        apiInstance = new PaymentAPI(baseURL)
    }
    return apiInstance
}

export function getPaymentAPI(): PaymentAPI {
    if (!apiInstance) {
        throw new Error('PaymentAPI not initialized, please call createPaymentAPI first')
    }
    return apiInstance
}