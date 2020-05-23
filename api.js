require('isomorphic-fetch')

const baseURL = 'https://my.leviton.com/api'
const toQueryString = (params) =>
  Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')

function getResidenceIotSwitches({ residenceID, token }) {
  return fetch(`${baseURL}/Residences/${residenceID}/iotSwitches`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Access-Token': token,
    },
  }).then((res) => res.json())
}

function getIotSwitch({ switchID, token }) {
  return fetch(`${baseURL}/IotSwitches/${switchID}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Access-Token': token,
    },
  }).then((res) => res.json())
}

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

function getPersonResidentialPermissions({ personID, token }) {
  return fetch(`${baseURL}/Person/${personID}/residentialPermissions`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Access-Token': token,
    },
  }).then((res) => res.json())
}

function getResidentialAccounts({ accountID, token }) {
  return fetch(`${baseURL}/ResidentialAccounts/${accountID}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Access-Token': token,
    },
  }).then((res) => res.json())
}

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
