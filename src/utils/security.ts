// Security configuration and middleware
export class SecurityConfig {
    // Get environment variable configuration
    static getConfig() {
        return {
            apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
            // Polling configuration hardcoded in code
            pollingInterval: 3000, // Poll every 3 seconds
            timeoutBeforeExpiry: 300000 // Remind 5 minutes before expiration
        }
    }

    // Validate environment configuration
    static validateConfig() {
        const config = this.getConfig()
        const errors: string[] = []

        if (!config.apiBaseUrl) {
            errors.push('Missing API base URL configuration')
        }

        if (config.pollingInterval < 1000) {
            errors.push('Polling interval cannot be less than 1 second')
        }

        return {
            isValid: errors.length === 0,
            errors,
            config
        }
    }
}

// Error reporting and monitoring
export class ErrorReporter {
    private static errors: Array<{
        timestamp: number
        error: any
        context?: any
    }> = []

    static reportError(error: any, context?: any) {
        const errorData = {
            timestamp: Date.now(),
            error: {
                message: error.message || String(error),
                stack: error.stack,
                name: error.name
            },
            context
        }

        this.errors.push(errorData)

        // Console output
        console.error('Payment system error:', errorData)

        // Send to monitoring service (optional)
        if (import.meta.env.PROD) {
            this.sendToMonitoring(errorData)
        }
    }

    private static async sendToMonitoring(errorData: any) {
        try {
            // This is where you can send to error monitoring service
            // await fetch('/api/errors', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(errorData)
            // })
        } catch (error) {
            console.error('Failed to send error report:', error)
        }
    }

    static getErrors() {
        return [...this.errors]
    }

    static clearErrors() {
        this.errors = []
    }
}

// Initialize security configuration
export function initSecurity() {
    // Validate configuration
    const validation = SecurityConfig.validateConfig()
    if (!validation.isValid) {
        console.error('Security configuration validation failed:', validation.errors)
        throw new Error('Security configuration is incorrect')
    }


}