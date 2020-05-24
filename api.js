require('isomorphic-fetch')

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

// uses a personID/userId to get accocuntID
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

module.exports = {
  getIotSwitch,
  getPersonResidentialPermissions,
  getResidenceIotSwitches,
  getResidentialAccounts,
  postPersonLogin,
  putIotSwitch,
}
