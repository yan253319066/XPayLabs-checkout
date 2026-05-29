import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { URLParams, PaymentParams, OrderStatus, PaymentConfig, PaymentError } from '@/types/payment'
import { PaymentValidator, TimeUtils } from '@/utils/payment'
import { getPaymentAPI } from '@/services/api'

export const usePaymentStore = defineStore('payment', () => {
    // State
    const urlParams = ref<URLParams | null>(null)
    const paymentParams = ref<PaymentParams | null>(null)
    const currentStatus = ref<OrderStatus>('INIT' as OrderStatus)
    const isPolling = ref(false)
    const errors = ref<PaymentError[]>([])
    const lastUpdate = ref<number>(0)

    // Configuration
    const config = ref<PaymentConfig>({
        pollingInterval: 3000, // Poll every 3 seconds
        maxPollingTime: 0, // No limit on maximum polling time, use expiredTime instead
        timeoutBeforeExpiry: 300 // Remind 5 minutes before expiration (seconds)
    })

    // Polling related
    let pollingTimer: number | null = null
    let expiryTimer: number | null = null // Expiration check timer

    // Computed properties
    const isExpired = computed(() => {
        if (!paymentParams.value) return false
        return TimeUtils.isExpired(paymentParams.value.expiredTime)
    })

    const expiryTime = computed(() => {
        if (!paymentParams.value) return ''
        // Force reactive update, trigger recalculation through lastUpdate
        lastUpdate.value // Access to establish reactive dependency
        return TimeUtils.formatTimeRemaining(paymentParams.value.expiredTime)
    })

    const isNearExpiry = computed(() => {
        if (!paymentParams.value) return false
        // Force reactive update
        lastUpdate.value
        return TimeUtils.isNearExpiry(paymentParams.value.expiredTime, config.value.timeoutBeforeExpiry)
    })

    const canPoll = computed(() => {
        return !isExpired.value &&
            ['INIT', 'PENDING', 'PENDING_CONFIRMATION'].includes(currentStatus.value)
    })

    // Methods
    const setURLParams = (params: URLParams) => {
        urlParams.value = params
    }

    const setPaymentParams = (params: PaymentParams) => {
        // Validate parameters
        const validation = PaymentValidator.validatePaymentParams(params)
        if (!validation.isValid) {
            errors.value = validation.errors
            throw new Error('Payment parameter validation failed')
        }

        paymentParams.value = params
        // Set initial status to provided status or default INIT
        currentStatus.value = params.status || ('INIT' as OrderStatus)
        errors.value = []
        lastUpdate.value = Date.now()

        // Start expiration check timer
        startExpiryCheck()
    }

    const updateStatus = (status: OrderStatus) => {
        currentStatus.value = status
        lastUpdate.value = Date.now()

        // Stop polling for terminal states
        if (['SUCCESS', 'EXPIRED', 'FAILED'].includes(status)) {
            stopPolling()
        }
    }

    const addError = (error: PaymentError) => {
        errors.value.push(error)
    }

    const clearErrors = () => {
        errors.value = []
    }

    const startPolling = async () => {
        if (!urlParams.value || !paymentParams.value || isPolling.value) return

        isPolling.value = true


        await pollOrderStatus()
    }

    const stopPolling = () => {
        if (pollingTimer) {
            clearTimeout(pollingTimer)
            pollingTimer = null
        }
        isPolling.value = false

    }

    const startExpiryCheck = () => {
        // Clear previous timers
        if (expiryTimer) {
            clearInterval(expiryTimer)
        }

        // Check expiration status every second and update display
        expiryTimer = window.setInterval(() => {
            // Update lastUpdate to trigger computed property recalculation
            lastUpdate.value = Date.now()

            if (isExpired.value && currentStatus.value !== 'EXPIRED') {
                updateStatus('EXPIRED' as OrderStatus)
                // addError({
                //     code: 'PAYMENT_EXPIRED',
                //     message: 'Payment expired'
                // })
                if (expiryTimer) {
                    clearInterval(expiryTimer)
                    expiryTimer = null
                }
            }
        }, 1000)
    }

    const stopExpiryCheck = () => {
        if (expiryTimer) {
            clearInterval(expiryTimer)
            expiryTimer = null
        }
    }

    const pollOrderStatus = async () => {

        if (!canPoll.value || !urlParams.value) {
            stopPolling()
            return
        }

        try {
            const api = getPaymentAPI()
            const response = await api.getOrderStatus(urlParams.value.orderId, urlParams.value.sign)


            // Get status from response data field
            updateStatus(response.data.status)

            // If status is not complete and polling can continue, set next poll
            if (canPoll.value) {
                pollingTimer = window.setTimeout(pollOrderStatus, config.value.pollingInterval)
            }
        } catch (error: any) {
            console.error('Order status polling failed:', error)

            // Extract specific error information
            let errorMessage = 'Status polling failed'

            if (error && typeof error === 'object') {
                if (error.message) {
                    errorMessage = error.message
                } else if (error.details && error.details.msg) {
                    errorMessage = error.details.msg
                } else if (error.details && error.details.message) {
                    errorMessage = error.details.message
                }
            } else if (error instanceof Error) {
                errorMessage = error.message
            }

            addError({
                code: error.code || 'POLLING_ERROR',
                message: errorMessage
            })

            // If it's a network error, continue retrying
            if (error.code === 'NETWORK_ERROR' && canPoll.value) {
                pollingTimer = window.setTimeout(pollOrderStatus, config.value.pollingInterval * 2)
            } else {
                stopPolling()
            }
        }
    }

    const handlePaymentComplete = async () => {
        stopPolling()

        // Payment completion handling logic, such as showing success message

        // Try to get returnUrl from URL and redirect
        // try {
        //     const url = new URL(window.location.href)
        //     const returnUrl = url.searchParams.get('returnUrl')
        //     if (returnUrl) {
        //         window.location.href = returnUrl
        //         return
        //     }
        // } catch (error) {

        // }

        // If no returnUrl, try to close window or show message
        // Payment successful, but no returnUrl, cannot auto-redirect
    }

    const reset = () => {
        stopPolling()
        stopExpiryCheck()
        urlParams.value = null
        paymentParams.value = null
        currentStatus.value = 'INIT' as OrderStatus
        errors.value = []
        lastUpdate.value = 0
    }

    // Clean up timers
    const cleanup = () => {
        stopPolling()
        stopExpiryCheck()
    }

    return {
        // State
        urlParams,
        paymentParams,
        currentStatus,
        isPolling,
        errors,
        lastUpdate,
        config,

        // Computed properties
        isExpired,
        expiryTime,
        isNearExpiry,
        canPoll,

        // Methods
        setURLParams,
        setPaymentParams,
        updateStatus,
        addError,
        clearErrors,
        startPolling,
        stopPolling,
        startExpiryCheck,
        stopExpiryCheck,
        handlePaymentComplete,
        reset,
        cleanup
    }
})