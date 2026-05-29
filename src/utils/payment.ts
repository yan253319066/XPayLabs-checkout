import type { URLParams, PaymentParams, PaymentError } from '@/types/payment'

// Payment parameter validation utility
export class PaymentValidator {
    private static readonly URL_REQUIRED_FIELDS = ['orderId', 'sign']

    private static readonly PAYMENT_REQUIRED_FIELDS = [
        'orderId', 'chain', 'symbol', 'address', 'amount', 'expiredTime'
    ]

    private static readonly CHAIN_PATTERNS = {
        ethereum: /^0x[a-fA-F0-9]{40}$/,
        bitcoin: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
        bsc: /^0x[a-fA-F0-9]{40}$/,
        polygon: /^0x[a-fA-F0-9]{40}$/,
        tron: /^T[a-zA-Z0-9]{33}$/
    }

    /**
     * Validate URL parameter completeness
     */
    static validateURLParams(params: any): { isValid: boolean; errors: PaymentError[] } {
        const errors: PaymentError[] = []

        // Check required fields
        for (const field of this.URL_REQUIRED_FIELDS) {
            if (!params[field]) {
                errors.push({
                    code: 'MISSING_FIELD',
                    message: `Missing required field: ${field}`
                })
            }
        }

        return { isValid: errors.length === 0, errors }
    }

    /**
     * Validate payment parameter completeness and format
     */
    static validatePaymentParams(params: any): { isValid: boolean; errors: PaymentError[] } {
        const errors: PaymentError[] = []

        // Check required fields
        for (const field of this.PAYMENT_REQUIRED_FIELDS) {
            if (!params[field]) {
                errors.push({
                    code: 'MISSING_FIELD',
                    message: `Missing required field: ${field}`
                })
            }
        }

        if (errors.length > 0) {
            return { isValid: false, errors }
        }

        // Validate address format
        const addressPattern = this.CHAIN_PATTERNS[params.chain.toLowerCase() as keyof typeof this.CHAIN_PATTERNS]
        if (addressPattern && !addressPattern.test(params.address)) {
            errors.push({
                code: 'INVALID_ADDRESS',
                message: `Invalid ${params.chain} address format`
            })
        }

        // Validate amount format
        if (isNaN(parseFloat(params.amount)) || parseFloat(params.amount) <= 0) {
            errors.push({
                code: 'INVALID_AMOUNT',
                message: 'Invalid payment amount'
            })
        }

        // Validate expiration time (countdown seconds)
        const expiredTime = parseInt(params.expiredTime)
        if (isNaN(expiredTime) || expiredTime < 0) {
            errors.push({
                code: 'INVALID_EXPIRED_TIME',
                message: 'Order has expired'
            })
        }

        return { isValid: errors.length === 0, errors }
    }

    /**
     * Safely parse URL parameters
     */
    static parseURLParams(url: string): URLParams | null {
        try {
            const urlObj = new URL(url)
            const params: any = {}

            for (const [key, value] of urlObj.searchParams) {
                // Sanitize parameters to prevent XSS attacks
                params[key] = this.sanitizeParam(value)
            }

            const validation = this.validateURLParams(params)
            if (!validation.isValid) {
                console.error('URL parameter validation failed:', validation.errors)
                return null
            }

            return params as URLParams
        } catch (error) {
            console.error('URL parsing failed:', error)
            return null
        }
    }

    /**
     * Sanitize parameters to prevent XSS attacks
     */
    private static sanitizeParam(value: string): string {
        return value
            .replace(/[<>]/g, '') // Remove dangerous characters
            .trim()
    }
}

// Time utility class
export class TimeUtils {
    /**
     * Format remaining time
     * @param expiredTime Unix timestamp (seconds) or countdown seconds
     */
    static formatTimeRemaining(expiredTime: number): string {
        let remainingSeconds: number

        // Determine if it's a Unix timestamp (greater than 10 digits indicates timestamp)
        if (expiredTime > 999999999) {
            // Unix timestamp (seconds), calculate remaining time
            remainingSeconds = Math.max(0, expiredTime - Math.floor(Date.now() / 1000))
        } else {
            // Countdown seconds
            remainingSeconds = Math.max(0, expiredTime)
        }

        if (remainingSeconds <= 0) return 'Expired'

        const hours = Math.floor(remainingSeconds / 3600)
        const minutes = Math.floor((remainingSeconds % 3600) / 60)
        const seconds = remainingSeconds % 60

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`
        }
    }

    /**
     * Check if expiration is near
     * @param expiredTime Unix timestamp (seconds) or countdown seconds
     * @param warningTime Warning time (seconds)
     */
    static isNearExpiry(expiredTime: number, warningTime: number = 300): boolean {
        let remainingSeconds: number

        if (expiredTime > 999999999) {
            remainingSeconds = Math.max(0, expiredTime - Math.floor(Date.now() / 1000))
        } else {
            remainingSeconds = Math.max(0, expiredTime)
        }

        return remainingSeconds > 0 && remainingSeconds <= warningTime
    }

    /**
     * Check if expired
     * @param expiredTime Unix timestamp (seconds) or countdown seconds
     */
    static isExpired(expiredTime: number): boolean {
        if (expiredTime > 999999999) {
            return Date.now() / 1000 >= expiredTime
        } else {
            return expiredTime <= 0
        }
    }
}

// URL utility class
export class URLUtils {
    /**
     * Safe redirect to prevent malicious redirection
     */
    static safeRedirect(url: string): boolean {
        try {
            const urlObj = new URL(url)

            // Only allow http and https protocols
            if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
                console.warn('Unsafe protocol:', urlObj.protocol)
                return false
            }

            window.location.href = url
            return true
        } catch (error) {
            console.error('URL redirect failed:', error)
            return false
        }
    }
}