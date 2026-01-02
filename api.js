/**
 * @fileoverview Leviton API client for interacting with My Leviton cloud services
 * @module api
 * @requires Node.js 18+ (uses native fetch)
 */

const SockJS = require('sockjs-client')
const fs = require('fs')
const path = require('path')

// Note: Using native fetch (available in Node.js 18+)
// No import needed - fetch is a global

// API Configuration
const BASE_URL = 'https://my.leviton.com/api'
const SOCKET_URL = 'https://my.leviton.com/socket'
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
}

// Rate limiting configuration
const RATE_LIMIT_MAX_REQUESTS = 60 // Maximum requests per window
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minute window

// API response cache configuration
const CACHE_TTL_MS = 2000 // 2 seconds cache TTL

// API request timeout configuration
const API_REQUEST_TIMEOUT_MS = 10000 // 10 seconds timeout for API requests

// Circuit breaker configuration
const CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5 // Number of failures before opening circuit
const CIRCUIT_BREAKER_RESET_TIMEOUT = 30000 // 30 seconds before trying again
const CIRCUIT_BREAKER_HALF_OPEN_MAX = 3 // Max requests in half-open state

// Device persistence configuration
const PERSISTENCE_FILE = '.homebridge-leviton-state.json'

/**
 * Simple token bucket rate limiter
 * @class RateLimiter
 */
class RateLimiter {
  constructor(maxRequests = RATE_LIMIT_MAX_REQUESTS, windowMs = RATE_LIMIT_WINDOW_MS) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = [] // Array of timestamps
  }

  /**
   * Acquire a token for a request
   * @returns {boolean} True if request allowed, false if rate limited
   */
  acquire() {
    const now = Date.now()
    // Remove requests outside the window
    this.requests = this.requests.filter((timestamp) => now - timestamp < this.windowMs)

    if (this.requests.length >= this.maxRequests) {
      return false
    }

    this.requests.push(now)
    return true
  }

  /**
   * Wait if rate limited, then acquire token
   * @returns {Promise<void>}
   */
  async waitIfNeeded() {
    while (!this.acquire()) {
      // Calculate wait time until oldest request expires
      if (this.requests.length > 0) {
        const oldest = this.requests[0]
        const waitTime = this.windowMs - (Date.now() - oldest)
        if (waitTime > 0) {
          // Wait for the oldest request to expire (with small increments)
          await new Promise((resolve) => setTimeout(resolve, Math.min(waitTime, 1000)))
        } else {
          // Oldest request expired, remove it and retry
          this.requests.shift()
        }
      } else {
        // No requests, should be able to acquire
        break
      }
    }
  }
}

/**
 * Simple cache for API responses
 * @class ResponseCache
 */
class ResponseCache {
  constructor(ttlMs = CACHE_TTL_MS) {
    this.cache = new Map() // key -> { data, timestamp }
    this.ttlMs = ttlMs
  }

  /**
   * Get cached value if still valid
   * @param {string} key - Cache key
   * @returns {Object|null} Cached data or null if expired/missing
   */
  get(key) {
    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    const age = Date.now() - entry.timestamp
    if (age > this.ttlMs) {
      // Expired, remove from cache
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set cache value
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * Clear expired entries
   */
  clearExpired() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear()
  }
}

/**
 * Circuit breaker states
 * @readonly
 * @enum {string}
 */
const CircuitState = {
  CLOSED: 'CLOSED', // Normal operation - requests flow through
  OPEN: 'OPEN', // Circuit tripped - requests fail immediately
  HALF_OPEN: 'HALF_OPEN', // Testing if service recovered
}

/**
 * Circuit breaker pattern implementation for API resilience
 * Prevents cascading failures when the Leviton API is down
 * @class CircuitBreaker
 */
class CircuitBreaker {
  /**
   * Creates a new CircuitBreaker instance
   * @param {Object} options - Configuration options
   * @param {number} [options.failureThreshold=5] - Failures before opening circuit
   * @param {number} [options.resetTimeout=30000] - Time in ms before trying half-open
   * @param {number} [options.halfOpenMax=3] - Max requests allowed in half-open state
   */
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || CIRCUIT_BREAKER_FAILURE_THRESHOLD
    this.resetTimeout = options.resetTimeout || CIRCUIT_BREAKER_RESET_TIMEOUT
    this.halfOpenMax = options.halfOpenMax || CIRCUIT_BREAKER_HALF_OPEN_MAX
    this.state = CircuitState.CLOSED
    this.failures = 0
    this.successes = 0
    this.lastFailureTime = null
    this.halfOpenRequests = 0
  }

  /**
   * Check if circuit allows requests
   * @returns {boolean} True if request should proceed
   */
  canRequest() {
    if (this.state === CircuitState.CLOSED) {
      return true
    }

    if (this.state === CircuitState.OPEN) {
      // Check if enough time has passed to try again
      const now = Date.now()
      if (this.lastFailureTime && (now - this.lastFailureTime) >= this.resetTimeout) {
        this.state = CircuitState.HALF_OPEN
        this.halfOpenRequests = 0
        return true
      }
      return false
    }

    if (this.state === CircuitState.HALF_OPEN) {
      // Allow limited requests in half-open state
      return this.halfOpenRequests < this.halfOpenMax
    }

    return false
  }

  /**
   * Record a successful request
   */
  recordSuccess() {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++
      // After enough successes in half-open, close the circuit
      if (this.successes >= this.halfOpenMax) {
        this.reset()
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Gradually reduce failure count on success
      if (this.failures > 0) {
        this.failures--
      }
    }
  }

  /**
   * Record a failed request
   */
  recordFailure() {
    this.lastFailureTime = Date.now()

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state opens the circuit again
      this.state = CircuitState.OPEN
      this.halfOpenRequests = 0
      this.successes = 0
    } else if (this.state === CircuitState.CLOSED) {
      this.failures++
      if (this.failures >= this.failureThreshold) {
        this.state = CircuitState.OPEN
      }
    }
  }

  /**
   * Track half-open request
   */
  trackHalfOpenRequest() {
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenRequests++
    }
  }

  /**
   * Reset the circuit breaker to closed state
   */
  reset() {
    this.state = CircuitState.CLOSED
    this.failures = 0
    this.successes = 0
    this.lastFailureTime = null
    this.halfOpenRequests = 0
  }

  /**
   * Get current circuit breaker status
   * @returns {Object} Status object with state and metrics
   */
  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      halfOpenRequests: this.halfOpenRequests,
    }
  }

  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn - Async function to execute
   * @returns {Promise<*>} Result of the function
   * @throws {Error} If circuit is open or function fails
   */
  async execute(fn) {
    if (!this.canRequest()) {
      const waitTime = this.resetTimeout - (Date.now() - this.lastFailureTime)
      throw new Error(`Circuit breaker is OPEN. Service unavailable. Retry in ${Math.ceil(waitTime / 1000)}s`)
    }

    if (this.state === CircuitState.HALF_OPEN) {
      this.trackHalfOpenRequest()
    }

    try {
      const result = await fn()
      this.recordSuccess()
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }
}

/**
 * Device state persistence for faster startup and offline resilience
 * @class DevicePersistence
 */
class DevicePersistence {
  /**
   * Creates a new DevicePersistence instance
   * @param {string} [storagePath] - Path to store state file
   */
  constructor(storagePath) {
    this.storagePath = storagePath || path.join(process.env.HOME || '/tmp', PERSISTENCE_FILE)
    this.deviceStates = new Map()
    this.loaded = false
  }

  /**
   * Load persisted device states from disk
   * @returns {Map<string, Object>} Map of device ID to state
   */
  load() {
    if (this.loaded) {
      return this.deviceStates
    }

    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8')
        const parsed = JSON.parse(data)
        
        // Validate and convert to Map
        if (parsed && typeof parsed === 'object' && parsed.devices) {
          for (const [id, state] of Object.entries(parsed.devices)) {
            if (state && typeof state === 'object') {
              this.deviceStates.set(id, {
                ...state,
                _cached: true,
                _cachedAt: parsed.timestamp || Date.now(),
              })
            }
          }
        }
      }
    } catch {
      // Ignore load errors - start fresh
      this.deviceStates.clear()
    }

    this.loaded = true
    return this.deviceStates
  }

  /**
   * Save device states to disk
   * @returns {boolean} True if saved successfully
   */
  save() {
    try {
      const devices = {}
      for (const [id, state] of this.deviceStates.entries()) {
        // Remove internal properties before saving
        const { _cached, _cachedAt, ...cleanState } = state
        devices[id] = cleanState
      }

      const data = JSON.stringify({
        version: 1,
        timestamp: Date.now(),
        devices,
      }, null, 2)

      fs.writeFileSync(this.storagePath, data, 'utf8')
      return true
    } catch {
      return false
    }
  }

  /**
   * Update state for a device
   * @param {string} deviceId - Device ID
   * @param {Object} state - Device state
   */
  updateDevice(deviceId, state) {
    if (!deviceId || !state) return

    this.deviceStates.set(deviceId, {
      ...state,
      _cached: false,
      _updatedAt: Date.now(),
    })
  }

  /**
   * Get cached state for a device
   * @param {string} deviceId - Device ID
   * @returns {Object|null} Cached state or null
   */
  getDevice(deviceId) {
    return this.deviceStates.get(deviceId) || null
  }

  /**
   * Clear all persisted states
   */
  clear() {
    this.deviceStates.clear()
    try {
      if (fs.existsSync(this.storagePath)) {
        fs.unlinkSync(this.storagePath)
      }
    } catch {
      // Ignore delete errors
    }
  }

  /**
   * Get all cached device states
   * @returns {Map<string, Object>} Map of device states
   */
  getAllDevices() {
    return this.deviceStates
  }
}

/**
 * Structured logging helper for machine-parseable logs
 * @class StructuredLogger
 */
class StructuredLogger {
  /**
   * Creates a StructuredLogger wrapper
   * @param {Object} homebridgeLog - Homebridge log function
   * @param {boolean} [enableStructured=false] - Enable structured JSON output
   */
  constructor(homebridgeLog, enableStructured = false) {
    this.log = homebridgeLog
    this.structured = enableStructured
    this.correlationId = null
  }

  /**
   * Set correlation ID for request tracing
   * @param {string} id - Correlation ID
   */
  setCorrelationId(id) {
    this.correlationId = id
  }

  /**
   * Generate a new correlation ID
   * @returns {string} New correlation ID
   */
  generateCorrelationId() {
    this.correlationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    return this.correlationId
  }

  /**
   * Format a log entry
   * @private
   * @param {string} level - Log level
   * @param {string|Object} message - Message or structured data
   * @param {Object} [context] - Additional context
   * @returns {string} Formatted log entry
   */
  _format(level, message, context = {}) {
    if (this.structured) {
      const entry = {
        timestamp: new Date().toISOString(),
        level,
        correlationId: this.correlationId,
        ...(typeof message === 'object' ? message : { message }),
        ...context,
      }
      return JSON.stringify(entry)
    }

    // Traditional string format
    if (typeof message === 'object') {
      const { event, ...rest } = message
      const contextStr = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : ''
      return `[${event || 'log'}]${contextStr}`
    }

    return message
  }

  /**
   * Log debug message
   * @param {string|Object} message - Message or structured data
   * @param {Object} [context] - Additional context
   */
  debug(message, context) {
    if (this.log && this.log.debug) {
      this.log.debug(this._format('debug', message, context))
    }
  }

  /**
   * Log info message
   * @param {string|Object} message - Message or structured data
   * @param {Object} [context] - Additional context
   */
  info(message, context) {
    if (this.log && this.log.info) {
      this.log.info(this._format('info', message, context))
    }
  }

  /**
   * Log warning message
   * @param {string|Object} message - Message or structured data
   * @param {Object} [context] - Additional context
   */
  warn(message, context) {
    if (this.log && this.log.warn) {
      this.log.warn(this._format('warn', message, context))
    }
  }

  /**
   * Log error message
   * @param {string|Object} message - Message or structured data
   * @param {Object} [context] - Additional context
   */
  error(message, context) {
    if (this.log && this.log.error) {
      this.log.error(this._format('error', message, context))
    }
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter()

// Global circuit breaker instance
const circuitBreaker = new CircuitBreaker()

// Global device persistence instance
const devicePersistence = new DevicePersistence()

// Global response cache instance
const responseCache = new ResponseCache()

// WebSocket message types
const WS_MESSAGE_TYPES = {
  CHALLENGE: 'challenge',
  STATUS: 'status',
  NOTIFICATION: 'notification',
}

// WebSocket status values
const WS_STATUS_READY = 'ready'

/**
 * Converts an object to a URL query string
 * @param {Object} params - Parameters to convert
 * @returns {string} Query string
 */
function toQueryString(params) {
  return Object.keys(params)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
}

/**
 * Makes an API request with error handling, rate limiting, circuit breaker, and optional caching
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {Object} [cacheOptions] - Cache options
 * @param {boolean} [cacheOptions.useCache] - Whether to use cache (default: false)
 * @param {string} [cacheOptions.cacheKey] - Cache key (default: url)
 * @param {boolean} [cacheOptions.bypassCircuitBreaker] - Bypass circuit breaker (for critical requests)
 * @returns {Promise<Object>} JSON response
 * @throws {Error} If request fails or response is not OK
 */
async function apiRequest(url, options = {}, cacheOptions = {}) {
  const { useCache = false, cacheKey = url, bypassCircuitBreaker = false } = cacheOptions

  // Check cache first if enabled
  if (useCache) {
    const cached = responseCache.get(cacheKey)
    if (cached !== null) {
      return cached
    }
  }

  // Check circuit breaker (unless bypassed for critical requests like login)
  if (!bypassCircuitBreaker && !circuitBreaker.canRequest()) {
    const status = circuitBreaker.getStatus()
    const waitTime = circuitBreaker.resetTimeout - (Date.now() - status.lastFailureTime)
    throw new Error(`Circuit breaker is OPEN. Service unavailable. Retry in ${Math.ceil(waitTime / 1000)}s`)
  }

  // Rate limiting: wait if needed
  await rateLimiter.waitIfNeeded()

  // Track half-open request if applicable
  if (!bypassCircuitBreaker && circuitBreaker.state === CircuitState.HALF_OPEN) {
    circuitBreaker.trackHalfOpenRequest()
  }

  // Create AbortController for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, API_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...DEFAULT_HEADERS,
        ...options.headers,
      },
    })

    clearTimeout(timeoutId)

    // Get response text first (can only be read once)
    const responseText = await response.text()

    if (!response.ok) {
      // Try to provide better error messages
      let errorBody = ''
      try {
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('text/html')) {
          // API returned HTML (likely an error page)
          errorBody = ' (received HTML instead of JSON)'
        } else if (responseText && responseText.length > 0) {
          errorBody = responseText.length > 200 ? ` (${responseText.substring(0, 200)}...)` : ` (${responseText})`
        }
      } catch {
        // Ignore errors when processing error response
      }
      
      // Record failure for circuit breaker (server errors indicate service issues)
      if (!bypassCircuitBreaker && response.status >= 500) {
        circuitBreaker.recordFailure()
      }
      
      throw new Error(`API request failed: ${response.status} ${response.statusText}${errorBody}`)
    }

    // Check Content-Type before parsing JSON
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
      // API returned non-JSON (likely HTML error page)
      const preview = responseText.length > 200 ? responseText.substring(0, 200) + '...' : responseText
      
      // Record failure - non-JSON response often indicates service issues
      if (!bypassCircuitBreaker) {
        circuitBreaker.recordFailure()
      }
      
      throw new Error(`API returned non-JSON response (Content-Type: ${contentType}). Response preview: ${preview}`)
    }

    // Parse JSON with error handling
    let data
    try {
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response body')
      }
      data = JSON.parse(responseText)
    } catch (jsonError) {
      // Handle JSON parsing errors (e.g., when API returns HTML despite Content-Type)
      const preview = responseText.length > 200 ? responseText.substring(0, 200) + '...' : responseText
      
      // Record failure for circuit breaker
      if (!bypassCircuitBreaker) {
        circuitBreaker.recordFailure()
      }
      
      if (jsonError.message && jsonError.message.includes('Unexpected token')) {
        throw new Error(`Failed to parse JSON response: received HTML or invalid JSON. Response preview: ${preview}`)
      }
      throw new Error(`Failed to parse JSON response: ${jsonError.message}. Response preview: ${preview}`)
    }

    // Record success for circuit breaker
    if (!bypassCircuitBreaker) {
      circuitBreaker.recordSuccess()
    }

    // Cache response if enabled
    if (useCache) {
      responseCache.set(cacheKey, data)
    }

    return data
  } catch (error) {
    clearTimeout(timeoutId)

    // Handle timeout/abort errors
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      // Timeouts indicate service issues - record for circuit breaker
      if (!bypassCircuitBreaker) {
        circuitBreaker.recordFailure()
      }
      throw new Error(`API request timeout after ${API_REQUEST_TIMEOUT_MS}ms`)
    }

    // Re-throw circuit breaker errors as-is
    if (error.message && error.message.includes('Circuit breaker')) {
      throw error
    }

    // Re-throw API errors as-is (they already have good context)
    if (error.message && (
      error.message.includes('API request failed') ||
      error.message.includes('Failed to parse JSON') ||
      error.message.includes('API returned non-JSON')
    )) {
      throw error
    }
    
    // Network errors indicate service issues
    if (!bypassCircuitBreaker) {
      circuitBreaker.recordFailure()
    }
    
    // Wrap network errors with more context
    throw new Error(`Network error: ${error.message}`)
  }
}

/**
 * Returns a list of IoT switches for a given residence
 * @param {Object} params - Parameters
 * @param {string} params.residenceID - Residence ID
 * @param {string} params.token - Authentication token
 * @returns {Promise<Array>} Array of IoT switch devices
 */
function getResidenceIotSwitches({ residenceID, token }) {
  if (!residenceID || !token) {
    return Promise.reject(new Error('residenceID and token are required'))
  }

  return apiRequest(`${BASE_URL}/Residences/${residenceID}/iotSwitches`, {
    method: 'GET',
    headers: {
      Authorization: token,
    },
  })
}

/**
 * Gets the current state of a specific IoT switch
 * @param {Object} params - Parameters
 * @param {string} params.switchID - Switch device ID
 * @param {string} params.token - Authentication token
 * @returns {Promise<Object>} Switch state object
 */
function getIotSwitch({ switchID, token }) {
  if (!switchID || !token) {
    return Promise.reject(new Error('switchID and token are required'))
  }

  const url = `${BASE_URL}/IotSwitches/${switchID}`
  const cacheKey = `getIotSwitch:${switchID}`

  return apiRequest(
    url,
    {
      method: 'GET',
      headers: {
        Authorization: token,
      },
    },
    {
      useCache: true,
      cacheKey,
    }
  )
}

/**
 * Updates the state of an IoT switch (power and/or brightness)
 * @param {Object} params - Parameters
 * @param {string} params.switchID - Switch device ID
 * @param {string} [params.power] - Power state ('ON' or 'OFF')
 * @param {number} [params.brightness] - Brightness level (0-100)
 * @param {string} params.token - Authentication token
 * @returns {Promise<Object>} Updated switch state
 */
function putIotSwitch({ switchID, power, brightness, token }) {
  if (!switchID || !token) {
    return Promise.reject(new Error('switchID and token are required'))
  }

  const body = {}
  if (brightness !== undefined && brightness !== null) {
    if (typeof brightness !== 'number' || brightness < 0 || brightness > 100) {
      return Promise.reject(new Error('brightness must be a number between 0 and 100'))
    }
    body.brightness = brightness
  }
  if (power !== undefined && power !== null) {
    if (power !== 'ON' && power !== 'OFF') {
      return Promise.reject(new Error("power must be 'ON' or 'OFF'"))
    }
    body.power = power
  }

  if (Object.keys(body).length === 0) {
    return Promise.reject(new Error('At least one of power or brightness must be provided'))
  }

  const url = `${BASE_URL}/IotSwitches/${switchID}`
  const cacheKey = `getIotSwitch:${switchID}`

  // Update device (no caching for PUT requests)
  return apiRequest(
    url,
    {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        Authorization: token,
      },
    },
    {
      useCache: false,
    }
  ).then((result) => {
    // Invalidate cache for this device after successful update
    responseCache.cache.delete(cacheKey)
    return result
  })
}

/**
 * Gets residential permissions for a person
 * @param {Object} params - Parameters
 * @param {string} params.personID - Person/user ID
 * @param {string} params.token - Authentication token
 * @returns {Promise<Array>} Array of residential permissions
 */
function getPersonResidentialPermissions({ personID, token }) {
  if (!personID || !token) {
    return Promise.reject(new Error('personID and token are required'))
  }

  return apiRequest(`${BASE_URL}/Person/${personID}/residentialPermissions`, {
    method: 'GET',
    headers: {
      Authorization: token,
    },
  })
}

/**
 * Gets residential accounts for an account ID
 * @param {Object} params - Parameters
 * @param {string} params.accountID - Account ID
 * @param {string} params.token - Authentication token
 * @returns {Promise<Object>} Residential account information
 */
function getResidentialAccounts({ accountID, token }) {
  if (!accountID || !token) {
    return Promise.reject(new Error('accountID and token are required'))
  }

  return apiRequest(`${BASE_URL}/ResidentialAccounts/${accountID}`, {
    method: 'GET',
    headers: {
      Authorization: token,
    },
  })
}

/**
 * Gets residential accounts using v2 API
 * @param {Object} params - Parameters
 * @param {string} params.residenceObjectID - Residence object ID
 * @param {string} params.token - Authentication token
 * @returns {Promise<Array>} Array of residence objects
 */
function getResidentialAccountsV2({ residenceObjectID, token }) {
  if (!residenceObjectID || !token) {
    return Promise.reject(new Error('residenceObjectID and token are required'))
  }

  return apiRequest(`${BASE_URL}/ResidentialAccounts/${residenceObjectID}/residences`, {
    method: 'GET',
    headers: {
      Authorization: token,
    },
  })
}

/**
 * Authenticates a user and obtains an authentication token
 * @param {Object} params - Parameters
 * @param {string} params.email - User email address
 * @param {string} params.password - User password
 * @returns {Promise<Object>} Login response with token and user ID
 */
function postPersonLogin({ email, password }) {
  if (!email || !password) {
    return Promise.reject(new Error('email and password are required'))
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    return Promise.reject(new Error('email and password must be strings'))
  }

  const query = toQueryString({
    include: 'user',
  })

  // Login bypasses circuit breaker - it's a critical request needed to recover
  return apiRequest(
    `${BASE_URL}/Person/login?${query}`,
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    },
    {
      bypassCircuitBreaker: true,
    }
  )
}

// WebSocket reconnection configuration
const WS_RECONNECT_MAX_ATTEMPTS = 10
const WS_RECONNECT_INITIAL_DELAY = 1000 // 1 second
const WS_RECONNECT_MAX_DELAY = 60000 // 60 seconds
const WS_CONNECTION_TIMEOUT = 10000 // 10 seconds

/**
 * Creates a WebSocket connection with reconnection logic
 * @param {Object} login - Login response object containing token
 * @param {Array} devices - Array of device objects to subscribe to
 * @param {Function} callback - Callback function for device updates
 * @param {Object} scope - Scope object (platform instance) for logging
 * @param {number} reconnectAttempt - Current reconnection attempt number
 * @returns {SockJS} WebSocket connection instance
 */
function createWebSocketConnection(login, devices, callback, scope, reconnectAttempt = 0) {
  // Validate login object has required id property
  if (!login || !login.id) {
    throw new Error('login object with id property is required')
  }

  let reconnectTimeout

  const ws = new SockJS(SOCKET_URL, {
    origin: 'https://my.leviton.com',
    headers: {
      'Sec-WebSocket-Extensions': 'permessage-deflate',
      'Sec-WebSocket-Version': 13,
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      Origin: 'https://my.leviton.com',
      Connection: 'keep-alive, Upgrade',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
      Upgrade: 'websocket',
    },
  })

  // Connection timeout - close if not opened within timeout period
  let isOpen = false
  const connectionTimeout = setTimeout(() => {
    if (!isOpen) {
      scope.log.error('WebSocket connection timeout')
      try {
        ws.close()
      } catch {
        // Ignore errors when closing
      }
    }
  }, WS_CONNECTION_TIMEOUT)

  ws.onclose = function onclose(ev) {
    clearTimeout(connectionTimeout)
    clearTimeout(reconnectTimeout)

    const wasClean = ev && ev.wasClean
    const code = ev && ev.code

    if (wasClean && code === 1000) {
      // Normal closure - don't reconnect
      scope.log.debug('WebSocket connection closed normally')
      return
    }

    scope.log.error(`Socket connection closed: ${JSON.stringify(ev)}`)

    // Attempt reconnection with exponential backoff
    if (reconnectAttempt < WS_RECONNECT_MAX_ATTEMPTS) {
      const delay = Math.min(
        WS_RECONNECT_INITIAL_DELAY * Math.pow(2, reconnectAttempt),
        WS_RECONNECT_MAX_DELAY
      )

      scope.log.info(`Attempting to reconnect WebSocket in ${delay}ms (attempt ${reconnectAttempt + 1}/${WS_RECONNECT_MAX_ATTEMPTS})`)

      reconnectTimeout = setTimeout(async () => {
        try {
          // On 401 Unauthorized, re-authenticate before reconnecting
          if (code === 401 && scope.config && scope.config.email && scope.config.password) {
            scope.log.info('Token expired, re-authenticating...')
            try {
              const newLogin = await postPersonLogin({
                email: scope.config.email,
                password: scope.config.password,
              })
              // Update login object with new token
              login.id = newLogin.id
              login.userId = newLogin.userId
              scope.log.info('Re-authentication successful, reconnecting WebSocket...')
            } catch (authError) {
              scope.log.error(`Re-authentication failed: ${authError.message}`)
              // Continue with old token anyway, will fail but count as attempt
            }
          }
          createWebSocketConnection(login, devices, callback, scope, reconnectAttempt + 1)
        } catch (error) {
          scope.log.error(`Failed to reconnect WebSocket: ${error.message}`)
        }
      }, delay)
    } else {
      scope.log.error(`WebSocket reconnection failed after ${WS_RECONNECT_MAX_ATTEMPTS} attempts`)
    }
  }

  ws.onopen = function onopen() {
    clearTimeout(connectionTimeout)
    isOpen = true
    scope.log.debug('Socket connection opened')
  }

  ws.onerror = function onerror(error) {
    clearTimeout(connectionTimeout)
    scope.log.error(`Socket error: ${error.message || 'Unknown error'}`)
  }

  ws.onmessage = function onmessage(message) {
    let data
    try {
      data = JSON.parse(message.data)
    } catch {
      // Log parse errors for debugging
      scope.log.error(`Received bad JSON: ${String(message.data)}`)
      return
    }

    if (!data || typeof data !== 'object') {
      return
    }

    // Handle challenge message
    if (data.type === WS_MESSAGE_TYPES.CHALLENGE) {
      // Send token from login object (may be updated on re-auth)
      const response = [JSON.stringify({ token: login.id })]
      ws.send(response)
      return
    }

    // Handle status ready message
    if (data.type === WS_MESSAGE_TYPES.STATUS && data.status === WS_STATUS_READY) {
      devices.forEach((device) => {
        if (device && device.id) {
          ws.send([
            JSON.stringify({
              type: 'subscribe',
              subscription: {
                modelName: 'IotSwitch',
                modelId: device.id,
              },
            }),
          ])
        }
      })
      return
    }

    // Handle notification messages
    if (
      data.type === WS_MESSAGE_TYPES.NOTIFICATION &&
      data.notification &&
      data.notification.data &&
      data.notification.data.power
    ) {
      const payload = {
        id: data.notification.modelId,
        power: data.notification.data.power,
      }

      if (data.notification.data.brightness !== undefined) {
        payload.brightness = data.notification.data.brightness
      }

      callback(payload)
    }
  }

  return ws
}

/**
 * Subscribes to real-time updates for IoT switches via WebSocket
 * @param {Object} login - Login response object containing token
 * @param {Array} devices - Array of device objects to subscribe to
 * @param {Function} callback - Callback function for device updates
 * @param {Object} scope - Scope object (platform instance) for logging
 * @returns {SockJS} WebSocket connection instance
 */
function subscribe(login, devices, callback, scope) {
  if (!login || !devices || !Array.isArray(devices) || !callback || !scope) {
    throw new Error('login, devices array, callback, and scope are required')
  }

  if (!login.id) {
    throw new Error('login object must have an id property (token)')
  }

  return createWebSocketConnection(login, devices, callback, scope, 0)
}

module.exports = {
  // API functions
  getIotSwitch,
  getPersonResidentialPermissions,
  getResidenceIotSwitches,
  getResidentialAccounts,
  getResidentialAccountsV2,
  postPersonLogin,
  putIotSwitch,
  subscribe,
  
  // Classes for external use
  CircuitBreaker,
  DevicePersistence,
  StructuredLogger,
  RateLimiter,
  ResponseCache,
  
  // Expose instances for testing and advanced usage
  _rateLimiter: rateLimiter,
  _responseCache: responseCache,
  _circuitBreaker: circuitBreaker,
  _devicePersistence: devicePersistence,
  
  // Constants
  RATE_LIMIT_MAX_REQUESTS,
  CircuitState,
}
