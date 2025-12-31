/**
 * @fileoverview Tests for Leviton API module
 * All tests run in sandboxed environment with mocked network calls
 */

const Leviton = require('../api')
const fetch = require('node-fetch')
const SockJS = require('sockjs-client')

// Mock dependencies - prevents any real network calls
jest.mock('node-fetch')
jest.mock('sockjs-client')

// Ensure we're in test environment
if (process.env.NODE_ENV !== 'test') {
  throw new Error('Tests must run in test environment')
}

describe('Leviton API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Note: toQueryString is a private function, tested indirectly through postPersonLogin

  describe('postPersonLogin', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        id: 'test-token',
        userId: 'test-user-id',
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'application/json'
            return null
          }),
        },
        text: async () => JSON.stringify(mockResponse),
      })

      const result = await Leviton.postPersonLogin({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/Person/login'),
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should reject with missing email', async () => {
      await expect(Leviton.postPersonLogin({ password: 'test' })).rejects.toThrow('email and password are required')
    })

    it('should reject with missing password', async () => {
      await expect(Leviton.postPersonLogin({ email: 'test@example.com' })).rejects.toThrow('email and password are required')
    })

    it('should reject with non-string email', async () => {
      await expect(Leviton.postPersonLogin({ email: 123, password: 'test' })).rejects.toThrow('email and password must be strings')
    })

    it('should handle API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'application/json'
            return null
          }),
        },
        text: async () => JSON.stringify({ error: 'Unauthorized' }),
      })

      await expect(
        Leviton.postPersonLogin({
          email: 'test@example.com',
          password: 'wrong',
        })
      ).rejects.toThrow('API request failed')
    })
  })

  describe('getPersonResidentialPermissions', () => {
    it('should get residential permissions', async () => {
      const mockResponse = [{ residentialAccountId: 'account-123' }]

      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'application/json'
            return null
          }),
        },
        text: async () => JSON.stringify(mockResponse),
      })

      const result = await Leviton.getPersonResidentialPermissions({
        personID: 'person-123',
        token: 'token-123',
      })

      expect(result).toEqual(mockResponse)
    })

    it('should reject with missing parameters', async () => {
      await expect(Leviton.getPersonResidentialPermissions({ personID: 'test' })).rejects.toThrow('personID and token are required')
    })
  })

  describe('getResidentialAccounts', () => {
    it('should get residential accounts', async () => {
      const mockResponse = {
        primaryResidenceId: 'residence-123',
        id: 'object-123',
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'application/json'
            return null
          }),
        },
        text: async () => JSON.stringify(mockResponse),
      })

      const result = await Leviton.getResidentialAccounts({
        accountID: 'account-123',
        token: 'token-123',
      })

      expect(result).toEqual(mockResponse)
    })

    it('should reject with missing parameters', async () => {
      await expect(Leviton.getResidentialAccounts({ accountID: 'test' })).rejects.toThrow('accountID and token are required')
    })
  })

  describe('getResidentialAccountsV2', () => {
    it('should get residential accounts v2', async () => {
      const mockResponse = [{ id: 'residence-123' }]

      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'application/json'
            return null
          }),
        },
        text: async () => JSON.stringify(mockResponse),
      })

      const result = await Leviton.getResidentialAccountsV2({
        residenceObjectID: 'object-123',
        token: 'token-123',
      })

      expect(result).toEqual(mockResponse)
    })

    it('should reject with missing parameters', async () => {
      await expect(Leviton.getResidentialAccountsV2({ residenceObjectID: 'test' })).rejects.toThrow('residenceObjectID and token are required')
    })
  })

  describe('getResidenceIotSwitches', () => {
    it('should get IoT switches', async () => {
      const mockResponse = [
        { id: 'switch-1', name: 'Switch 1', model: 'DW6HD' },
        { id: 'switch-2', name: 'Switch 2', model: 'DW15P' },
      ]

      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'application/json'
            return null
          }),
        },
        text: async () => JSON.stringify(mockResponse),
      })

      const result = await Leviton.getResidenceIotSwitches({
        residenceID: 'residence-123',
        token: 'token-123',
      })

      expect(result).toEqual(mockResponse)
    })

    it('should reject with missing parameters', async () => {
      await expect(Leviton.getResidenceIotSwitches({ residenceID: 'test' })).rejects.toThrow('residenceID and token are required')
    })
  })

  describe('getIotSwitch', () => {
    it('should get IoT switch status', async () => {
      const mockResponse = {
        id: 'switch-1',
        power: 'ON',
        brightness: 75,
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'application/json'
            return null
          }),
        },
        text: async () => JSON.stringify(mockResponse),
      })

      const result = await Leviton.getIotSwitch({
        switchID: 'switch-123',
        token: 'token-123',
      })

      expect(result).toEqual(mockResponse)
    })

    it('should reject with missing parameters', async () => {
      await expect(Leviton.getIotSwitch({ switchID: 'test' })).rejects.toThrow('switchID and token are required')
    })

    it('should handle API request timeout', async () => {
      // Mock fetch to reject with AbortError (simulating timeout)
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      fetch.mockRejectedValue(abortError)

      await expect(
        Leviton.getIotSwitch({
          switchID: 'switch-1',
          token: 'token-123',
        })
      ).rejects.toThrow('API request timeout after 10000ms')
    })

    it('should handle HTML response instead of JSON', async () => {
      // Mock API returning HTML (error page) instead of JSON
      fetch.mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'text/html'
            return null
          }),
        },
        text: async () => '<html><body>Error 500</body></html>',
      })

      await expect(
        Leviton.getIotSwitch({
          switchID: 'switch-1',
          token: 'token-123',
        })
      ).rejects.toThrow('API returned non-JSON response')
    })

    it('should handle invalid JSON response', async () => {
      // Mock API returning invalid JSON
      fetch.mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'application/json'
            return null
          }),
        },
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0')
        },
        text: async () => '<html><body>Error</body></html>',
      })

      await expect(
        Leviton.getIotSwitch({
          switchID: 'switch-1',
          token: 'token-123',
        })
      ).rejects.toThrow('Failed to parse JSON response')
    })

    it('should handle non-200 response with HTML error page', async () => {
      // Mock API returning HTML error page for non-200 status
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'text/html'
            return null
          }),
        },
        text: async () => '<html><body>Server Error</body></html>',
      })

      await expect(
        Leviton.getIotSwitch({
          switchID: 'switch-1',
          token: 'token-123',
        })
      ).rejects.toThrow('API request failed: 500 Internal Server Error')
    })
  })

  describe('putIotSwitch', () => {
    it('should update switch power', async () => {
      const mockResponse = {
        id: 'switch-1',
        power: 'ON',
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'application/json'
            return null
          }),
        },
        text: async () => JSON.stringify(mockResponse),
      })

      const result = await Leviton.putIotSwitch({
        switchID: 'switch-123',
        power: 'ON',
        token: 'token-123',
      })

      expect(result).toEqual(mockResponse)
    })

    it('should update switch brightness', async () => {
      const mockResponse = {
        id: 'switch-1',
        brightness: 50,
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'application/json'
            return null
          }),
        },
        text: async () => JSON.stringify(mockResponse),
      })

      const result = await Leviton.putIotSwitch({
        switchID: 'switch-123',
        brightness: 50,
        token: 'token-123',
      })

      expect(result).toEqual(mockResponse)
    })

    it('should reject invalid brightness', async () => {
      await expect(
        Leviton.putIotSwitch({
          switchID: 'switch-123',
          brightness: 150,
          token: 'token-123',
        })
      ).rejects.toThrow('brightness must be a number between 0 and 100')
    })

    it('should reject invalid power value', async () => {
      await expect(
        Leviton.putIotSwitch({
          switchID: 'switch-123',
          power: 'INVALID',
          token: 'token-123',
        })
      ).rejects.toThrow("power must be 'ON' or 'OFF'")
    })

    it('should reject when no power or brightness provided', async () => {
      await expect(
        Leviton.putIotSwitch({
          switchID: 'switch-123',
          token: 'token-123',
        })
      ).rejects.toThrow('At least one of power or brightness must be provided')
    })

    it('should reject with missing parameters', async () => {
      await expect(Leviton.putIotSwitch({ switchID: 'test' })).rejects.toThrow('switchID and token are required')
    })
  })

  describe('subscribe', () => {
    let mockWs
    let mockCallback
    let mockScope

    beforeEach(() => {
      jest.useFakeTimers()
      mockWs = {
        onclose: null,
        onopen: null,
        onerror: null,
        onmessage: null,
        send: jest.fn(),
        close: jest.fn(),
      }

      SockJS.mockImplementation(() => mockWs)

      mockCallback = jest.fn()
      mockScope = {
        log: {
          debug: jest.fn(),
          error: jest.fn(),
          info: jest.fn(),
        },
      }
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should create WebSocket connection', () => {
      Leviton.subscribe({ id: 'token' }, [{ id: 'device-1' }], mockCallback, mockScope)

      expect(SockJS).toHaveBeenCalled()
    })

    it('should handle challenge message', () => {
      const login = { id: 'token', userId: 'user-1' }
      Leviton.subscribe(login, [{ id: 'device-1' }], mockCallback, mockScope)

      const challengeMessage = {
        data: JSON.stringify({ type: 'challenge' }),
      }

      mockWs.onmessage(challengeMessage)

      expect(mockWs.send).toHaveBeenCalled()
      // Verify token string is sent, not full login object
      const sendCall = mockWs.send.mock.calls[0][0]
      const sentData = JSON.parse(sendCall[0])
      expect(sentData.token).toBe('token')
    })

    it('should handle ready status and subscribe to devices', () => {
      const login = { id: 'token', userId: 'user-1' }
      const devices = [{ id: 'device-1' }, { id: 'device-2' }]
      Leviton.subscribe(login, devices, mockCallback, mockScope)

      const readyMessage = {
        data: JSON.stringify({ type: 'status', status: 'ready' }),
      }

      mockWs.onmessage(readyMessage)

      expect(mockWs.send).toHaveBeenCalledTimes(devices.length)
    })

    it('should handle notification messages', () => {
      const login = { id: 'token', userId: 'user-1' }
      Leviton.subscribe(login, [{ id: 'device-1' }], mockCallback, mockScope)

      const notificationMessage = {
        data: JSON.stringify({
          type: 'notification',
          notification: {
            modelId: 'device-1',
            data: {
              power: 'ON',
              brightness: 75,
            },
          },
        }),
      }

      mockWs.onmessage(notificationMessage)

      expect(mockCallback).toHaveBeenCalledWith({
        id: 'device-1',
        power: 'ON',
        brightness: 75,
      })
    })

    it('should handle WebSocket close', () => {
      const login = { id: 'token', userId: 'user-1' }
      Leviton.subscribe(login, [{ id: 'device-1' }], mockCallback, mockScope)

      mockWs.onclose({ code: 1000 })

      expect(mockScope.log.error).toHaveBeenCalled()
    })

    it('should handle WebSocket errors', () => {
      const login = { id: 'token', userId: 'user-1' }
      Leviton.subscribe(login, [{ id: 'device-1' }], mockCallback, mockScope)

      mockWs.onerror({ message: 'Connection error' })

      expect(mockScope.log.error).toHaveBeenCalled()
    })

    it('should reject with invalid parameters', () => {
      expect(() => {
        Leviton.subscribe(null, [], jest.fn(), {})
      }).toThrow('login, devices array, callback, and scope are required')
    })

    it('should handle invalid JSON in messages', () => {
      const login = { id: 'token', userId: 'user-1' }
      Leviton.subscribe(login, [{ id: 'device-1' }], mockCallback, mockScope)

      const invalidMessage = {
        data: 'invalid json',
      }

      mockWs.onmessage(invalidMessage)

      expect(mockScope.log.error).toHaveBeenCalled()
    })

    it('should handle WebSocket connection timeout', () => {
      const login = { id: 'token', userId: 'user-1' }
      Leviton.subscribe(login, [{ id: 'device-1' }], mockCallback, mockScope)

      // Fast-forward past timeout
      jest.advanceTimersByTime(10001)

      expect(mockScope.log.error).toHaveBeenCalledWith(expect.stringContaining('timeout'))
      expect(mockWs.close).toHaveBeenCalled()
    })

    it('should handle WebSocket reconnection on close', () => {
      const login = { id: 'token', userId: 'user-1' }
      Leviton.subscribe(login, [{ id: 'device-1' }], mockCallback, mockScope)

      // Close with error code
      mockWs.onclose({ code: 1006, wasClean: false })

      // Fast-forward past initial delay
      jest.advanceTimersByTime(1001)

      // Should attempt reconnection
      expect(mockScope.log.info).toHaveBeenCalledWith(expect.stringContaining('reconnect'))
      expect(SockJS).toHaveBeenCalledTimes(2)
    })

    it('should stop reconnecting after max attempts', () => {
      const login = { id: 'token', userId: 'user-1' }
      Leviton.subscribe(login, [{ id: 'device-1' }], mockCallback, mockScope)

      // Close 10 times to exceed max attempts
      for (let i = 0; i < 11; i++) {
        mockWs.onclose({ code: 1006, wasClean: false })
        // Fast-forward past delay (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, i), 60000)
        jest.advanceTimersByTime(delay + 100)
      }

      expect(mockScope.log.error).toHaveBeenCalledWith(expect.stringContaining('reconnection failed'))
    })

    it('should handle network error in apiRequest', async () => {
      const networkError = new Error('Network request failed')
      fetch.mockRejectedValueOnce(networkError)

      await expect(
        Leviton.getIotSwitch({ switchID: 'switch-1', token: 'token-1' })
      ).rejects.toThrow('Network error')
    })

    it('should handle non-object data in WebSocket message', () => {
      const login = { id: 'token', userId: 'user-1' }
      Leviton.subscribe(login, [{ id: 'device-1' }], mockCallback, mockScope)

      const invalidMessage = {
        data: JSON.stringify('not an object'),
      }

      mockWs.onmessage(invalidMessage)

      // Should not call callback for invalid data
      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should require login.id property', () => {
      expect(() => {
        Leviton.subscribe({ userId: 'user-1' }, [{ id: 'device-1' }], mockCallback, mockScope)
      }).toThrow('login object must have an id property')
    })

    it('should handle WebSocket open event', () => {
      const login = { id: 'token', userId: 'user-1' }
      Leviton.subscribe(login, [{ id: 'device-1' }], mockCallback, mockScope)

      mockWs.onopen()

      expect(mockScope.log.debug).toHaveBeenCalledWith('Socket connection opened')
    })

    it('should not reconnect on normal WebSocket close', () => {
      const login = { id: 'token', userId: 'user-1' }
      Leviton.subscribe(login, [{ id: 'device-1' }], mockCallback, mockScope)

      mockWs.onclose({ code: 1000, wasClean: true })

      // Should log debug, not error, and not attempt reconnection
      expect(mockScope.log.debug).toHaveBeenCalledWith('WebSocket connection closed normally')
      expect(mockScope.log.info).not.toHaveBeenCalled()
    })

    it('should handle reconnection error gracefully', () => {
      const login = { id: 'token', userId: 'user-1' }
      let callCount = 0
      
      // Setup SockJS to throw on second call (reconnection attempt)
      SockJS.mockImplementation(() => {
        callCount++
        if (callCount === 2) {
          throw new Error('Connection failed')
        }
        return mockWs
      })
      
      Leviton.subscribe(login, [{ id: 'device-1' }], mockCallback, mockScope)

      // Close with error to trigger reconnection
      mockWs.onclose({ code: 1006, wasClean: false })

      // Fast-forward past delay to trigger reconnection attempt
      jest.advanceTimersByTime(1001)

      // Should have logged the reconnection error
      const errorCalls = mockScope.log.error.mock.calls.filter(call =>
        call[0] && typeof call[0] === 'string' && call[0].includes('Failed to reconnect')
      )
      expect(errorCalls.length).toBeGreaterThan(0)
    })

    it('should handle error without message property', () => {
      const login = { id: 'token', userId: 'user-1' }
      Leviton.subscribe(login, [{ id: 'device-1' }], mockCallback, mockScope)

      mockWs.onerror({})

      expect(mockScope.log.error).toHaveBeenCalledWith('Socket error: Unknown error')
    })
  })

  describe('rate limiting', () => {
    beforeEach(() => {
      // Clear rate limiter state and reset fetch mocks
      if (Leviton._rateLimiter) {
        Leviton._rateLimiter.requests = []
      }
      fetch.mockReset()
    })

    it('should rate limit API calls', async () => {
      // Mock successful responses
      fetch.mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'application/json'
            return null
          }),
        },
        text: async () => JSON.stringify({ id: 'test' }),
      })

      // Make a reasonable number of requests for testing
      const testLimit = 10
      const promises = []
      for (let i = 0; i < testLimit; i++) {
        promises.push(
          Leviton.getIotSwitch({
            switchID: `switch-${i}`,
            token: 'token-123',
          })
        )
      }

      await Promise.all(promises)

      // Verify all requests were made
      expect(fetch).toHaveBeenCalledTimes(testLimit)
    })

    it('should wait when rate limit is exceeded', async () => {
      // Test that rate limiter acquire() method works
      if (Leviton._rateLimiter) {
        const limiter = Leviton._rateLimiter
        const testLimit = 5
        limiter.maxRequests = testLimit
        limiter.requests = []

        // Fill up the rate limit
        for (let i = 0; i < testLimit; i++) {
          const acquired = limiter.acquire()
          expect(acquired).toBe(true)
        }

        // Next one should be rate limited
        const shouldBeLimited = limiter.acquire()
        expect(shouldBeLimited).toBe(false)

        // Verify requests array
        expect(limiter.requests.length).toBe(testLimit)
      }
    })

    it('should test waitIfNeeded with expired requests', async () => {
      if (Leviton._rateLimiter) {
        const limiter = Leviton._rateLimiter
        const originalMaxRequests = limiter.maxRequests
        const originalWindowMs = limiter.windowMs
        
        limiter.maxRequests = 2
        limiter.windowMs = 1000 // 1 second window
        limiter.requests = []

        // Fill up the rate limit
        limiter.acquire()
        limiter.acquire()

        // Make oldest request expired (older than window, so waitTime <= 0)
        // This tests the branch at line 67-69 (else branch when waitTime <= 0)
        const expiredTimestamp = Date.now() - 2000 // 2 seconds ago (expired)
        limiter.requests[0] = expiredTimestamp

        // Test waitIfNeeded directly - it should remove expired request
        // Since we're at limit (2 requests), waitIfNeeded will try to acquire, fail,
        // then see expired request (waitTime <= 0), remove it, and retry acquire
        await limiter.waitIfNeeded()

        // After waitIfNeeded, the expired request should have been removed
        // (it may have been replaced by a new request if acquire() succeeded)
        expect(limiter.requests.length).toBeGreaterThanOrEqual(1)
        expect(limiter.requests.length).toBeLessThanOrEqual(2)
        // The expired timestamp should not be in the array anymore
        expect(limiter.requests.includes(expiredTimestamp)).toBe(false)
        
        // Restore original values
        limiter.maxRequests = originalMaxRequests
        limiter.windowMs = originalWindowMs
        limiter.requests = []
      }
    })

    it('should test waitIfNeeded with empty requests array', async () => {
      if (Leviton._rateLimiter) {
        const limiter = Leviton._rateLimiter
        limiter.requests = [] // Empty array - tests the else branch at line 71-73

        // waitIfNeeded should return immediately when requests is empty
        await limiter.waitIfNeeded()

        // Should be able to acquire immediately
        const canAcquire = limiter.acquire()
        expect(canAcquire).toBe(true)
      }
    })

    it('should test waitIfNeeded when waitTime > 0', async () => {
      if (Leviton._rateLimiter) {
        const limiter = Leviton._rateLimiter
        const originalMaxRequests = limiter.maxRequests
        const originalWindowMs = limiter.windowMs
        
        limiter.maxRequests = 1
        limiter.windowMs = 100 // Very short window for testing
        limiter.requests = []

        // Fill up the rate limit
        limiter.acquire()

        // Add a recent request (not expired, but within window)
        // waitTime = 100 - (Date.now() - (Date.now() - 50)) = 100 - 50 = 50 > 0
        // This tests the branch at line 64-66 (when waitTime > 0)
        limiter.requests[0] = Date.now() - 50 // 50ms ago (still within 100ms window)

        // Test waitIfNeeded - it should wait because waitTime > 0
        // The wait will be Math.min(50, 1000) = 50ms
        const startTime = Date.now()
        await limiter.waitIfNeeded()
        const elapsed = Date.now() - startTime

        // Should have waited at least a bit (allowing for timing variance)
        expect(elapsed).toBeGreaterThanOrEqual(40) // At least 40ms
        
        // Restore original values
        limiter.maxRequests = originalMaxRequests
        limiter.windowMs = originalWindowMs
        limiter.requests = []
      }
    })
  })

  describe('response caching', () => {
    beforeEach(() => {
      // Clear cache and rate limiter state
      if (Leviton._responseCache) {
        Leviton._responseCache.clear()
      }
      if (Leviton._rateLimiter) {
        Leviton._rateLimiter.requests = []
      }
    })

    it('should cache getIotSwitch responses', async () => {
      const mockResponse = {
        id: 'switch-1',
        power: 'ON',
        brightness: 50,
      }

      fetch.mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'application/json'
            return null
          }),
        },
        text: async () => JSON.stringify(mockResponse),
      })

      // First call - should hit API
      const result1 = await Leviton.getIotSwitch({
        switchID: 'switch-1',
        token: 'token-123',
      })

      expect(result1).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledTimes(1)

      // Second call within cache TTL - should use cache
      const result2 = await Leviton.getIotSwitch({
        switchID: 'switch-1',
        token: 'token-123',
      })

      expect(result2).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledTimes(1) // Still 1, cache used
    })

    it('should invalidate cache after putIotSwitch', async () => {
      // Clear state before test
      if (Leviton._responseCache) {
        Leviton._responseCache.clear()
      }
      if (Leviton._rateLimiter) {
        Leviton._rateLimiter.requests = []
      }

      const mockGetResponse = {
        id: 'switch-1',
        power: 'ON',
        brightness: 50,
      }

      const mockPutResponse = {
        id: 'switch-1',
        power: 'OFF',
        brightness: 0,
      }

      const mockHeaders = {
        get: jest.fn((header) => {
          if (header === 'content-type') return 'application/json'
          return null
        }),
      }
      fetch
        .mockResolvedValueOnce({
          ok: true,
          headers: mockHeaders,
          text: async () => JSON.stringify(mockGetResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: mockHeaders,
          text: async () => JSON.stringify(mockPutResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: mockHeaders,
          text: async () => JSON.stringify(mockGetResponse),
        })

      // Get initial state (cached)
      await Leviton.getIotSwitch({
        switchID: 'switch-1',
        token: 'token-123',
      })

      // Update state (invalidates cache)
      await Leviton.putIotSwitch({
        switchID: 'switch-1',
        power: 'OFF',
        token: 'token-123',
      })

      // Get again - should hit API (cache invalidated)
      await Leviton.getIotSwitch({
        switchID: 'switch-1',
        token: 'token-123',
      })

      // Should have made 3 API calls (get, put, get after invalidation)
      expect(fetch).toHaveBeenCalledTimes(3)
    })

    it('should expire cache after TTL', async () => {
      // Clear state before test
      if (Leviton._responseCache) {
        Leviton._responseCache.clear()
      }
      if (Leviton._rateLimiter) {
        Leviton._rateLimiter.requests = []
      }

      const mockResponse = {
        id: 'switch-1',
        power: 'ON',
      }

      fetch.mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'application/json'
            return null
          }),
        },
        text: async () => JSON.stringify(mockResponse),
      })

      // First call
      await Leviton.getIotSwitch({
        switchID: 'switch-1',
        token: 'token-123',
      })

      expect(fetch).toHaveBeenCalledTimes(1)

      // Verify cache is populated
      if (Leviton._responseCache) {
        const cached = Leviton._responseCache.get('getIotSwitch:switch-1')
        expect(cached).not.toBeNull()
        expect(cached).toEqual(mockResponse)

        // Manually expire cache by manipulating timestamp
        const cacheEntry = Leviton._responseCache.cache.get('getIotSwitch:switch-1')
        if (cacheEntry) {
          cacheEntry.timestamp = Date.now() - 3000 // Make it 3 seconds old (past TTL)
        }

        // Verify cache.get() returns null for expired entry
        const expiredCache = Leviton._responseCache.get('getIotSwitch:switch-1')
        expect(expiredCache).toBeNull()
        // Verify expired entry was removed from cache
        expect(Leviton._responseCache.cache.has('getIotSwitch:switch-1')).toBe(false)
      }

      // Next call should hit API again (cache expired)
      await Leviton.getIotSwitch({
        switchID: 'switch-1',
        token: 'token-123',
      })

      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should clear expired cache entries', () => {
      if (Leviton._responseCache) {
        const cache = Leviton._responseCache
        cache.clear()

        // Add an entry that's already expired
        const expiredEntry = {
          data: { id: 'test' },
          timestamp: Date.now() - 3000, // 3 seconds ago (past TTL)
        }
        cache.cache.set('test-key', expiredEntry)

        // Add a valid entry
        const validEntry = {
          data: { id: 'test2' },
          timestamp: Date.now(), // Just now
        }
        cache.cache.set('test-key2', validEntry)

        // Clear expired entries
        cache.clearExpired()

        // Expired entry should be removed
        expect(cache.cache.has('test-key')).toBe(false)
        // Valid entry should remain
        expect(cache.cache.has('test-key2')).toBe(true)
      }
    })
  })

  describe('edge cases', () => {
    it('should handle empty response body', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'application/json'
            return null
          }),
        },
        text: async () => '',
      })

      await expect(
        Leviton.getIotSwitch({
          switchID: 'switch-1',
          token: 'token-123',
        })
      ).rejects.toThrow('Empty response body')
    })

    it('should handle JSON parsing error without Unexpected token', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'application/json'
            return null
          }),
        },
        text: async () => '{ invalid json }',
      })

      await expect(
        Leviton.getIotSwitch({
          switchID: 'switch-1',
          token: 'token-123',
        })
      ).rejects.toThrow('Failed to parse JSON response')
    })

    it('should reject subscribe with login object missing id', () => {
      expect(() => {
        Leviton.subscribe({ userId: 'user-1' }, [{ id: 'device-1' }], jest.fn(), {
          log: { debug: jest.fn(), error: jest.fn(), info: jest.fn() },
        })
      }).toThrow('login object must have an id property (token)')
    })

    it('should handle API request timeout with AbortController', async () => {
      // Mock fetch to reject with AbortError (simulating timeout)
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      fetch.mockRejectedValueOnce(abortError)

      await expect(
        Leviton.getIotSwitch({
          switchID: 'switch-1',
          token: 'token-123',
        })
      ).rejects.toThrow('API request timeout after 10000ms')
    })
  })
})

