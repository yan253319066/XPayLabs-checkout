<template>
  <div class="payment-container">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>{{ t('loading') }}</p>
    </div>

    <!-- Error state -->
    <div v-else-if="hasErrors" class="error-container">
      <div class="error-icon">⚠️</div>
      <h2>{{ t('error_title') }}</h2>
      <ul class="error-list">
        <li v-for="error in paymentStore.errors" :key="error.code">
          {{ error.message }}
        </li>
      </ul>
      <button @click="goBack" class="retry-button">{{ t('error_return') }}</button>
    </div>

    <!-- Payment information -->
    <div v-else-if="paymentStore.paymentParams" class="payment-info">
      <!-- Status indicator -->
      <div class="status-indicator" :class="statusClass">
        <div class="status-icon" :class="{ 'rotating': paymentStore.isPolling }">{{ statusIcon }}</div>
        <h2>{{ statusText }}</h2>
        <div v-if="!isTerminalStatus" class="time-remaining" :class="{ 'warning': paymentStore.isNearExpiry }">
          {{ t('payment_expired') }}: {{ paymentStore.expiryTime }}
        </div>
      </div>

      <!-- Payment details -->
      <div class="payment-details">
        <!-- Payment information and receiving address -->
        <div class="main-info-card">
          <div class="payment-summary">
            <div class="payment-details-header">
              <h3>{{ t('payment_info') }}</h3>
            </div>
            <div class="amount-display">
              <div class="amount-row">
                <span class="label">{{ t('payment_amount') }}</span>
                <span class="amount">{{ paymentStore.paymentParams.amount }} {{ paymentStore.paymentParams.symbol }}</span>
              </div>
              <div class="chain-row">
                <span class="label">{{ t('blockchain') }}</span>
                <span class="chain">{{ formatChainName(paymentStore.paymentParams.chain) }}</span>
              </div>
            </div>
            <div class="order-info">
              <span class="label">{{ t('order_id') }}</span>
              <span class="order-id" @click="copyOrderId">{{ paymentStore.paymentParams.orderId }}</span>
              <button @click="copyOrderId" class="copy-button" :disabled="orderIdCopied">
                {{ orderIdCopied ? t('copied') : t('copy') }}
              </button>
            </div>
          </div>
          
          <div class="address-section">
            <h3>{{ t('receive_address') }}</h3>
            <div class="address-with-copy">
              <div class="address-text" @click="copyAddress">{{ paymentStore.paymentParams.address }}</div>
              <button @click.stop="copyAddress" class="copy-button" :disabled="copied">
                {{ copied ? t('copied') : t('copy') }}
              </button>
            </div>
          </div>
          
          <!-- QR code -->
          <div class="qr-section">
            <canvas ref="qrCanvas" class="qr-code"></canvas>
            <p class="qr-tip">{{ t('scan_to_pay') }}</p>
          </div>
        </div>

        <!-- Payment instructions and actions -->
        <div class="bottom-section">
          <div class="instructions-card">
            <h3>{{ t('instructions') }}</h3>
            <ol class="instructions-list">
              <li>{{ t('instruction_1') }} <strong>{{ paymentStore.paymentParams.amount }} {{ paymentStore.paymentParams.symbol }}</strong></li>
              <li>{{ t('instruction_2') }} <strong>{{ formatChainName(paymentStore.paymentParams.chain) }}</strong> {{ t('instruction_3') }}</li>
              <li>{{ t('instruction_4') }}</li>
              <li>{{ t('instruction_5') }}</li>
            </ol>
          </div>
          
        </div>
      </div>

      <!-- Payment success state -->
      <div v-if="isSuccessStatus" class="success-container">
        <div class="success-icon">✅</div>
        <h2>{{ t('payment_success') }}</h2>
        <div class="loading-spinner"></div>
        <button @click="goBack" class="retry-button">{{ t('return') }}</button>
      </div>

      <!-- Payment failed/expired state -->
      <div v-else-if="isFailedStatus" class="failed-container">
        <!-- <div v-if="currentStatus === 'EXPIRED'" class="failed-icon">⏰</div>
        <div v-if="currentStatus === 'FAILED'" class="failed-icon">❌</div> -->
        <h2>{{ currentStatus === 'EXPIRED' ? t('payment_expired') : t('payment_failed') }}</h2>
        <p>{{ getFailedMessage() }}</p>
        <button @click="goBack" class="retry-button">{{ t('retry') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePaymentStore } from '@/stores/payment'
import { PaymentValidator } from '@/utils/payment'
import { SecurityConfig, ErrorReporter } from '@/utils/security'
import { createPaymentAPI, getPaymentAPI } from '@/services/api'
import QRCode from 'qrcode'
import { getCurrentLanguage, t as translate } from '@/locales'

// Component state
const isLoading = ref(true)
const copied = ref(false)
const orderIdCopied = ref(false)
const qrCanvas = ref<HTMLCanvasElement | null>(null)

// Router and store
const route = useRoute()
const router = useRouter()
const paymentStore = usePaymentStore()

// Language state
const currentLanguage = ref(getCurrentLanguage(window.location.href))

// Translation function
const t = (key: string): string => {
  return translate(key, currentLanguage.value)
}

// Computed properties
const hasErrors = computed(() => paymentStore.errors.length > 0)

const currentStatus = computed(() => paymentStore.currentStatus)

const isTerminalStatus = computed(() => 
  ['SUCCESS', 'EXPIRED', 'FAILED'].includes(currentStatus.value)
)

const isSuccessStatus = computed(() => currentStatus.value === 'SUCCESS')

const isFailedStatus = computed(() => 
  ['EXPIRED', 'FAILED'].includes(currentStatus.value)
)

const statusClass = computed(() => ({
  'status-init': currentStatus.value === 'INIT',
  'status-pending': ['PENDING', 'PENDING_CONFIRMATION'].includes(currentStatus.value),
  'status-success': currentStatus.value === 'SUCCESS',
  'status-failed': ['EXPIRED', 'FAILED'].includes(currentStatus.value)
}))

const statusIcon = computed(() => {
  switch (currentStatus.value) {
    case 'INIT': return '⏳'
    case 'PENDING': return '🔍'
    case 'PENDING_CONFIRMATION': return '⌛'
    case 'SUCCESS': return '✅'
    case 'EXPIRED': return '⏰'
    case 'FAILED': return '❌'
    default: return '⏳'
  }
})

const statusText = computed(() => {
  switch (currentStatus.value) {
    case 'INIT': return t('status_init')
    case 'PENDING': return t('status_pending')
    case 'PENDING_CONFIRMATION': return t('status_pending_confirmation')
    case 'SUCCESS': return t('payment_success')
    case 'EXPIRED': return t('payment_expired')
    case 'FAILED': return t('payment_failed')
    default: return t('status_unknown')
  }
})

// Methods
const formatChainName = (chain: string): string => {
  const chainNames: Record<string, string> = {
    'ethereum': 'Ethereum (ETH)',
    'bitcoin': 'Bitcoin (BTC)',
    'bsc': 'BSC (BNB)',
    'polygon': 'Polygon (MATIC)',
    'tron': 'Tron (TRX)'
  }
  return chainNames[chain.toLowerCase()] || chain.toUpperCase()
}

const copyAddress = async () => {
  if (!paymentStore.paymentParams) return
  
  try {
    await navigator.clipboard.writeText(paymentStore.paymentParams.address)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Copy failed:', error)
    // Fallback solution
    const textArea = document.createElement('textarea')
    textArea.value = paymentStore.paymentParams.address
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

const copyOrderId = async () => {
  if (!paymentStore.paymentParams) return
  
  try {
    await navigator.clipboard.writeText(paymentStore.paymentParams.orderId)
    orderIdCopied.value = true
    setTimeout(() => {
      orderIdCopied.value = false
    }, 2000)
  } catch (error) {
    console.error('Copy failed:', error)
    // Fallback solution
    const textArea = document.createElement('textarea')
    textArea.value = paymentStore.paymentParams.orderId
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    orderIdCopied.value = true
    setTimeout(() => {
      orderIdCopied.value = false
    }, 2000)
  }
}

const generateQRCode = async () => {
  if (!paymentStore.paymentParams) {
    return
  }
  
  if (!qrCanvas.value) {
    // Try to get canvas element through DOM query
    await nextTick()
    const canvasEl = document.querySelector('canvas.qr-code') as HTMLCanvasElement
    if (canvasEl) {
      qrCanvas.value = canvasEl
    } else {
      return
    }
  }
  
  try {
    // Generate payment QR code using chain and address information
    const { chain, address, amount, symbol } = paymentStore.paymentParams
    let qrContent = ''
    
    // Generate QR code parameters:
    
    // Generate different QR code content formats based on chain
    switch (chain.toLowerCase()) {
      case 'ethereum':
      case 'eth':
      case 'bsc':
      case 'polygon':
      case 'matic':
        qrContent = `ethereum:${address}?value=${parseFloat(amount) * 1e18}`
        break
      case 'bitcoin':
      case 'btc':
        qrContent = `bitcoin:${address}?amount=${amount}`
        break
      case 'tron':
      case 'trx':
      case 'tron_test':
        qrContent = `tron:${address}?amount=${amount}`
        break
      default:
        qrContent = address
    }
    
    // QR code content:
    
    await QRCode.toCanvas(qrCanvas.value, qrContent, {
      width: 160,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    

  } catch (error) {
    console.error('QR code generation failed:', error)
  }
}

const refreshStatus = async () => {
  if (!paymentStore.paymentParams || !paymentStore.urlParams) return
  
  try {
    const api = getPaymentAPI()
    const response = await api.getOrderStatus(paymentStore.urlParams.orderId, paymentStore.urlParams.sign)
    paymentStore.updateStatus(response.data.status)
  } catch (error: any) {
    console.error('Manual status check failed:', error)
    
    // Extract specific error information
    let errorMessage = 'Status check failed'
    
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
    
    paymentStore.addError({
      code: error.code || 'STATUS_CHECK_ERROR',
      message: errorMessage
    })
  }
}

const getFailedMessage = (): string => {
  if (currentStatus.value === 'EXPIRED') {
    return t('payment_expired_message')
  }
  return t('payment_failed_message')
}

const goBack = () => {
  // Since the new API doesn't have returnUrl, we can simply close the window or show a prompt
  if (window.history.length > 1) {
    router.back()
  } else {
    window.close()
  }
}

const initializePayment = async () => {
  try {
    isLoading.value = true
    
    // Step 1: Get orderId and sign parameters from URL
    const urlParams = PaymentValidator.parseURLParams(window.location.href)
    if (!urlParams) {
      throw new Error('Invalid URL parameters, missing orderId or sign')
    }
    

    paymentStore.setURLParams(urlParams)
    
    // Get security configuration
    const securityValidation = SecurityConfig.validateConfig()
    if (!securityValidation.isValid) {
      throw new Error('Security configuration invalid: ' + securityValidation.errors.join(', '))
    }
    
    const config = securityValidation.config
    
    // Initialize API
    const api = createPaymentAPI(config.apiBaseUrl)
    
    // Step 2: Call backend API to get payment information
    const paymentInfo = await api.getPaymentInfo(urlParams.orderId, urlParams.sign)
    

    
    // Set payment parameters - get from response data field, and pass initial status
    paymentStore.setPaymentParams(paymentInfo.data)
    
    // Update polling configuration
    paymentStore.config.pollingInterval = config.pollingInterval
    paymentStore.config.timeoutBeforeExpiry = config.timeoutBeforeExpiry
    
    // Generate QR code
    await nextTick()
    // Wait extra time to ensure DOM is fully rendered
    setTimeout(async () => {
      await generateQRCode()
    }, 100)
    
    // Step 3: Check order status, start polling if not in terminal state
    // Note: We've already got the initial status above, here we're checking the latest status
    if (!['SUCCESS', 'EXPIRED', 'FAILED'].includes(paymentStore.currentStatus)) {
      await paymentStore.startPolling()
    } else {
      // Order is already in terminal state, no need to poll:
    }
    
  } catch (error: any) {
    console.error('Payment initialization failed:', error)
    ErrorReporter.reportError(error, { stage: 'payment_init' })
    
    // Extract specific error information
    let errorMessage = 'Initialization failed'
    
    if (error && typeof error === 'object') {
      // Prioritize using specific error information returned by API
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
    
    paymentStore.addError({
      code: error.code || 'INIT_ERROR',
      message: errorMessage
    })
  } finally {
    isLoading.value = false
  }
}

// Watch for payment success status
watch(isSuccessStatus, (isSuccess) => {
  if (isSuccess) {
    // Delay redirect to let user see success status
    setTimeout(() => {
      paymentStore.handlePaymentComplete()
    }, 2000)
  }
})

// Watch for payment parameter changes, regenerate QR code
watch(() => paymentStore.paymentParams, async (newParams) => {
  if (newParams) {
    await nextTick()
    setTimeout(async () => {
      await generateQRCode()
    }, 200)
  }
}, { immediate: false })

// Lifecycle
onMounted(() => {
  initializePayment()
})

onUnmounted(() => {
  paymentStore.cleanup()
})
</script>

<style scoped>
@import '@/assets/payment.css';
</style>