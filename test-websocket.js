#!/usr/bin/env node
/**
 * Test script for Leviton WebSocket authentication
 * Usage: node test-websocket.js <email> <password>
 */

const SockJS = require('sockjs-client')
const crypto = require('crypto')

const BASE_URL = 'https://my.leviton.com/api'
const SOCKET_URL = 'https://my.leviton.com/socket'

async function login(email, password) {
  console.log('Logging in...')
  const response = await fetch(`${BASE_URL}/Person/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`)
  }
  
  const data = await response.json()
  console.log('Login successful!')
  console.log('Token (id):', data.id?.substring(0, 20) + '...')
  console.log('UserId:', data.userId)
  console.log('Full login response:', JSON.stringify(data, null, 2))
  return data
}

async function makeRestCall(token, userId) {
  // Make a REST call to "activate" the token / establish session
  console.log('Making REST API call to establish session...')
  const response = await fetch(`${BASE_URL}/Person/${userId}/ResidentialPermissions`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
  })
  
  if (!response.ok) {
    console.log('REST call failed:', response.status)
    return false
  }
  
  const data = await response.json()
  console.log('REST call successful, got', data.length, 'permissions')
  return true
}

function testWebSocket(login) {
  return new Promise((resolve, reject) => {
    console.log('Connecting to WebSocket...')
    const ws = new SockJS(SOCKET_URL)
    let success = false
    
    ws.onopen = () => {
      console.log('WebSocket opened')
    }
    
    ws.onmessage = (message) => {
      let data
      try {
        data = JSON.parse(message.data)
      } catch (e) {
        console.log('Raw message:', message.data)
        return
      }
      
      console.log('Received:', JSON.stringify(data))
      
      if (data.type === 'challenge') {
        console.log('Nonce:', data.nonce)
        tryAuthResponses(ws, login, data.nonce)
      }
      
      if (data.type === 'status' && data.status === 'ready') {
        console.log('\n🎉🎉🎉 AUTH SUCCESS! 🎉🎉🎉')
        console.log(`Approach ${currentApproach} WORKS!`)
        success = true
        ws.close()
        resolve(true)
      }
    }
    
    ws.onclose = (ev) => {
      if (!success) {
        console.log('Closed:', ev.code, ev.reason)
      }
      resolve(success)
    }
    
    ws.onerror = (err) => {
      console.log('Error:', err.message)
      resolve(false)
    }
  })
}

// Track which approach to try
let currentApproach = 0

function tryAuthResponses(ws, login, nonce) {
  const token = login.id
  const userId = login.userId
  
  const approaches = [
    // 0. Current: just token
    () => {
      console.log('\nApproach 0: { token }')
      return JSON.stringify({ token })
    },
    // 1. Token + userId
    () => {
      console.log('\nApproach 1: { token, userId }')
      return JSON.stringify({ token, userId })
    },
    // 2. Token + nonce (echo back)
    () => {
      console.log('\nApproach 2: { token, nonce }')
      return JSON.stringify({ token, nonce })
    },
    // 3. HMAC-SHA256(nonce) with token as key
    () => {
      const sig = crypto.createHmac('sha256', token).update(nonce).digest('base64')
      console.log('\nApproach 3: { token, signature: HMAC(token, nonce) }')
      return JSON.stringify({ token, signature: sig })
    },
    // 4. Just the HMAC signature
    () => {
      const sig = crypto.createHmac('sha256', token).update(nonce).digest('base64')
      console.log('\nApproach 4: { signature: HMAC(token, nonce) }')
      return JSON.stringify({ signature: sig })
    },
    // 5. HMAC with decoded nonce
    () => {
      const decodedNonce = Buffer.from(nonce, 'base64')
      const sig = crypto.createHmac('sha256', token).update(decodedNonce).digest('base64')
      console.log('\nApproach 5: { token, signature: HMAC(token, decode(nonce)) }')
      return JSON.stringify({ token, signature: sig })
    },
    // 6. Response field instead of signature
    () => {
      const sig = crypto.createHmac('sha256', token).update(nonce).digest('base64')
      console.log('\nApproach 6: { response: HMAC(token, nonce) }')
      return JSON.stringify({ response: sig })
    },
    // 7. Token + response
    () => {
      const sig = crypto.createHmac('sha256', token).update(nonce).digest('base64')
      console.log('\nApproach 7: { token, response: HMAC(token, nonce) }')
      return JSON.stringify({ token, response: sig })
    },
    // 8. SHA256 hash instead of HMAC
    () => {
      const hash = crypto.createHash('sha256').update(token + nonce).digest('base64')
      console.log('\nApproach 8: { token, hash: SHA256(token+nonce) }')
      return JSON.stringify({ token, hash })
    },
    // 9. accessToken field name
    () => {
      console.log('\nApproach 9: { accessToken }')
      return JSON.stringify({ accessToken: token })
    },
    // 10. access_token field name
    () => {
      console.log('\nApproach 10: { access_token }')
      return JSON.stringify({ access_token: token })
    },
    // 11. id field (raw token field name from login)
    () => {
      console.log('\nApproach 11: { id }')
      return JSON.stringify({ id: token })
    },
  ]
  
  if (currentApproach >= approaches.length) {
    console.log('\n❌ All approaches exhausted!')
    return
  }
  
  const response = approaches[currentApproach]()
  console.log('Sending:', response.substring(0, 100) + (response.length > 100 ? '...' : ''))
  ws.send(response)
}

// Alternative approaches to try:
function generateAlternativeResponses(login, nonce) {
  const token = login.id
  const userId = login.userId
  
  console.log('\n--- Alternative approaches to try ---')
  
  // 1. HMAC-SHA256 of nonce with token as key
  const hmac1 = crypto.createHmac('sha256', token).update(nonce).digest('base64')
  console.log('1. HMAC(token, nonce):', hmac1)
  
  // 2. HMAC-SHA256 of token with nonce as key  
  const hmac2 = crypto.createHmac('sha256', nonce).update(token).digest('base64')
  console.log('2. HMAC(nonce, token):', hmac2)
  
  // 3. Concatenate and hash
  const hash = crypto.createHash('sha256').update(token + nonce).digest('base64')
  console.log('3. SHA256(token+nonce):', hash)
  
  // 4. Maybe nonce needs to be decoded first
  try {
    const decodedNonce = Buffer.from(nonce, 'base64')
    const hmac3 = crypto.createHmac('sha256', token).update(decodedNonce).digest('base64')
    console.log('4. HMAC(token, decode64(nonce)):', hmac3)
  } catch (e) {
    console.log('4. Failed to decode nonce')
  }
  
  // 5. Different response formats to try
  console.log('\n--- Response formats to try ---')
  console.log('A:', JSON.stringify({ token }))
  console.log('B:', JSON.stringify({ token, nonce }))
  console.log('C:', JSON.stringify({ token, userId }))
  console.log('D:', JSON.stringify({ token, userId, nonce }))
  console.log('E:', JSON.stringify({ token, response: hmac1 }))
  console.log('F:', JSON.stringify({ response: hmac1 }))
}

async function testWithRestFirst(email, password) {
  console.log('\n' + '='.repeat(60))
  console.log('TEST: Login -> REST call -> WebSocket (same token)')
  console.log('='.repeat(60))
  
  const loginData = await login(email, password)
  
  // Make a REST call first to "activate" the session
  await makeRestCall(loginData.id, loginData.userId)
  
  // Wait a bit
  await new Promise(r => setTimeout(r, 500))
  
  // Now try WebSocket with same token
  console.log('\nNow trying WebSocket with the SAME token...')
  currentApproach = 0  // Just try basic { token }
  return await testWebSocket(loginData)
}

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]
  const mode = process.argv[4]
  
  if (!email || !password) {
    console.log('Usage: node test-websocket.js <email> <password> [mode]')
    console.log('  mode: number (0-11) for specific approach')
    console.log('        "rest" to test REST-then-WebSocket with same token')
    console.log('        omit to try all approaches')
    process.exit(1)
  }
  
  try {
    // Special mode: test with REST call first
    if (mode === 'rest') {
      const success = await testWithRestFirst(email, password)
      process.exit(success ? 0 : 1)
    }
    
    const loginData = await login(email, password)
    const specificApproach = mode ? parseInt(mode) : null
    
    if (specificApproach !== null && !isNaN(specificApproach)) {
      // Try just one approach
      currentApproach = specificApproach
      console.log(`\n--- Testing approach ${specificApproach} ---`)
      const success = await testWebSocket(loginData)
      process.exit(success ? 0 : 1)
    } else {
      // Try all approaches
      const maxApproaches = 12
      for (let i = 0; i < maxApproaches; i++) {
        currentApproach = i
        console.log(`\n${'='.repeat(50)}`)
        console.log(`Testing approach ${i}`)
        console.log('='.repeat(50))
        
        // Need fresh login for each attempt (token might get invalidated)
        const freshLogin = await login(email, password)
        const success = await testWebSocket(freshLogin)
        
        if (success) {
          console.log(`\n\n✅ FOUND WORKING APPROACH: ${i}`)
          process.exit(0)
        }
        
        // Small delay between attempts
        await new Promise(r => setTimeout(r, 500))
      }
      
      console.log('\n\n❌ No working approach found in basic tests')
      
      // Also try the REST-first approach
      console.log('\nTrying REST-first approach as last resort...')
      const restSuccess = await testWithRestFirst(email, password)
      process.exit(restSuccess ? 0 : 1)
    }
    
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

main()

