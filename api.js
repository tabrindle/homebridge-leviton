const fetch = require('node-fetch');
const SockJS = require('sockjs-client');

const baseURL = 'https://my.leviton.com/api';
const toQueryString = (params) =>
  Object.keys(params)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

// Get a list of switches for a residenceID
async function getResidenceIotSwitches({ residenceID, token }) {
  try {
    const response = await fetch(`${baseURL}/Residences/${residenceID}/iotSwitches`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Access-Token': token,
      },
    });
    return response.json();
  } catch (error) {
    console.error(`Error in getResidenceIotSwitches: ${error.message}`);
    throw error;
  }
}

// Get the state of a specific switch
async function getIotSwitch({ switchID, token }) {
  try {
    const response = await fetch(`${baseURL}/IotSwitches/${switchID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Access-Token': token,
      },
    });
    return response.json();
  } catch (error) {
    console.error(`Error in getIotSwitch: ${error.message}`);
    throw error;
  }
}

// Update a switch's state (power and brightness)
async function putIotSwitch({ switchID, power, brightness, token }) {
  try {
    const body = {};
    if (brightness) body.brightness = brightness;
    if (power) body.power = power;
    const response = await fetch(`${baseURL}/IotSwitches/${switchID}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Access-Token': token,
      },
    });
    return response.json();
  } catch (error) {
    console.error(`Error in putIotSwitch: ${error.message}`);
    throw error;
  }
}

// Retrieve residential permissions using personID
async function getPersonResidentialPermissions({ personID, token }) {
  try {
    const response = await fetch(`${baseURL}/Person/${personID}/residentialPermissions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Access-Token': token,
      },
    });
    return response.json();
  } catch (error) {
    console.error(`Error in getPersonResidentialPermissions: ${error.message}`);
    throw error;
  }
}

// Use accountID to get residence details
async function getResidentialAccounts({ accountID, token }) {
  try {
    const response = await fetch(`${baseURL}/ResidentialAccounts/${accountID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Access-Token': token,
      },
    });
    return response.json();
  } catch (error) {
    console.error(`Error in getResidentialAccounts: ${error.message}`);
    throw error;
  }
}

// Alternative method to get residence details (version 2)
async function getResidentialAccountsV2({ residenceObjectID, token }) {
  try {
    const response = await fetch(`${baseURL}/ResidentialAccounts/${residenceObjectID}/residences`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Access-Token': token,
      },
    });
    return response.json();
  } catch (error) {
    console.error(`Error in getResidentialAccountsV2: ${error.message}`);
    throw error;
  }
}

// Obtain a user token for X-Access-Token header
async function postPersonLogin({ email, password }) {
  try {
    const query = toQueryString({ include: 'user' });
    const response = await fetch(`${baseURL}/Person/login?${query}`, {
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
    });
    return response.json();
  } catch (error) {
    console.error(`Error in postPersonLogin: ${error.message}`);
    throw error;
  }
}

// Subscribe to WebSocket notifications for device updates
function subscribe(login, devices, callback, scope) {
  const ws = new SockJS('https://my.leviton.com/socket', {
    origin: 'https://my.leviton.com',
  });

  ws.onclose = (event) => {
    scope.log.error(`Socket connection closed: ${JSON.stringify(event)}`);
  };

  ws.onopen = (event) => {
    scope.log.debug(`Socket connection opened: ${JSON.stringify(event)}`);
    ws.send(JSON.stringify({ token: login }));
  };

  ws.onmessage = (message) => {
    try {
      const data = JSON.parse(message.data);
      switch (data.type) {
        case 'challenge':
          ws.send(JSON.stringify({ token: login }));
          break;
        case 'status':
          if (data.status === 'ready') {
            devices.forEach((device) => {
              ws.send(JSON.stringify({
                type: 'subscribe',
                subscription: { modelName: 'IotSwitch', modelId: device.id },
              }));
            });
          }
          break;
        case 'notification':
          if (data.notification?.data?.power) {
            const payload = {
              id: data.notification.modelId,
              power: data.notification.data.power,
              brightness: data.notification.data.brightness,
            };
            callback(payload);
          }
          break;
      }
    } catch (error) {
      scope.log.error(`Error processing WebSocket message: ${error.message}`);
    }
  };
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
};
