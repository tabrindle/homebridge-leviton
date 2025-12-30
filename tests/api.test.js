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
        json: async () => mockResponse,
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
        json: async () => mockResponse,
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
        json: async () => mockResponse,
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
        json: async () => mockResponse,
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
        json: async () => mockResponse,
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
        json: async () => mockResponse,
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
  })

  describe('putIotSwitch', () => {
    it('should update switch power', async () => {
      const mockResponse = {
        id: 'switch-1',
        power: 'ON',
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
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
        json: async () => mockResponse,
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
})

