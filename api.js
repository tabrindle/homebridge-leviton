require('isomorphic-fetch')

const SockJS = require('sockjs-client')

const baseURL = 'https://my.leviton.com/api'
const toQueryString = (params) =>
  Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')

// returns a list of switches, given a residenceID
function getResidenceIotSwitches({ residenceID, token }) {
  return fetch(`${baseURL}/Residences/${residenceID}/iotSwitches`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Access-Token': token,
    },
  }).then((res) => res.json())
}

// gets state of a given switchID
function getIotSwitch({ switchID, token }) {
  return fetch(`${baseURL}/IotSwitches/${switchID}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Access-Token': token,
    },
  }).then((res) => res.json())
}

// updates the state of a given switch, especially power and brightness
// power is an integer 1-100, power is a string, 'ON' or 'OFF'
function putIotSwitch({ switchID, power, brightness, token }) {
  const body = {}
  if (brightness) body.brightness = brightness
  if (power) body.power = power
  return fetch(`${baseURL}/IotSwitches/${switchID}`, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Access-Token': token,
    },
  }).then((res) => res.json())
}

// uses a personID/userId to get accountID
function getPersonResidentialPermissions({ personID, token }) {
  return fetch(`${baseURL}/Person/${personID}/residentialPermissions`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Access-Token': token,
    },
  }).then((res) => res.json())
}

// use accountID to get residenceIDs
function getResidentialAccounts({ accountID, token }) {
  return fetch(`${baseURL}/ResidentialAccounts/${accountID}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Access-Token': token,
    },
  }).then((res) => res.json())
}

// obtain a user token to use in X-Access-Token header on all requests
function postPersonLogin({ email, password }) {
  const query = toQueryString({
    include: 'user',
  })
  return fetch(`${baseURL}/Person/login?${query}`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      loggedInVia: 'myLeviton',
      password,
      rememberMe: true,
    }),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  }).then((res) => res.json())
}

function subscribe(login, devices, callback, scope) {
  const ws = new SockJS('https://my.leviton.com/socket', {
    origin: 'https://my.leviton.com',
    headers: {
      'Sec-WebSocket-Key': 'J4AAFNBWV3zbd71kD72LMQ==',
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

  ws.onclose = function onclose(ev) {
    scope.log('Socket connection closed', ev)
  }

  ws.onopen = function onopen(ev) {
    scope.log('Socket connection opened', ev)
  }

  ws.onmessage = function onmessage(message) {
    const data = JSON.parse(message.data)
    if (data.type === 'challenge') {
      const response = [JSON.stringify({ token: login })]
      ws.send(response)
    }
    if (data.type === 'status' && data.status === 'ready') {
      devices.forEach((element) => {
        ws.send([JSON.stringify({ type: 'subscribe', subscription: { modelName: 'IotSwitch', modelId: element.id } })])
      })
    }
    if (data.type === 'notification' && data.notification.data.power) {
      const payload = {
        id: data.notification.modelId,
        power: data.notification.data.power,
      }
      if (data.notification.data.brightness) payload.brightness = data.notification.data.brightness
      callback(payload)
    }
  }
}

module.exports = {
  getIotSwitch,
  getPersonResidentialPermissions,
  getResidenceIotSwitches,
  getResidentialAccounts,
  postPersonLogin,
  putIotSwitch,
  subscribe,
}
