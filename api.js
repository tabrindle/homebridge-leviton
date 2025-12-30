/**
 * @fileoverview Leviton API client for interacting with My Leviton cloud services
 * @module api
 */

const fetch = require('node-fetch')
const SockJS = require('sockjs-client')

// API Configuration
const BASE_URL = 'https://my.leviton.com/api'
const SOCKET_URL = 'https://my.leviton.com/socket'
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
}

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
 * Makes an API request with error handling
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} JSON response
 * @throws {Error} If request fails or response is not OK
 */
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...DEFAULT_HEADERS,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    // Re-throw API errors as-is
    if (error.message && error.message.includes('API request failed')) {
      throw error
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

  return apiRequest(`${BASE_URL}/IotSwitches/${switchID}`, {
    method: 'GET',
    headers: {
      Authorization: token,
    },
  })
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

  return apiRequest(`${BASE_URL}/IotSwitches/${switchID}`, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: {
      Authorization: token,
    },
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

  return apiRequest(`${BASE_URL}/Person/login?${query}`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  })
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

  const token = login.id
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

      reconnectTimeout = setTimeout(() => {
        try {
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
      // Send token string, not the full login object
      const response = [JSON.stringify({ token })]
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
  getIotSwitch,
  getPersonResidentialPermissions,
  getResidenceIotSwitches,
  getResidentialAccounts,
  getResidentialAccountsV2,
  postPersonLogin,
  putIotSwitch,
  subscribe,
}
