/**
 * @fileoverview Homebridge platform plugin for Leviton Decora Smart devices
 * @module homebridge-leviton
 */

let Service, Characteristic, Accessory, UUID
const Leviton = require('./api.js')

// Plugin constants
const PLUGIN_NAME = 'homebridge-leviton'
const PLATFORM_NAME = 'LevitonDecoraSmart'
const LOG_LEVELS = ['debug', 'info', 'warn', 'error']
const DEFAULT_LOG_LEVEL = 'info'

// Power states
const POWER_ON = 'ON'
const POWER_OFF = 'OFF'

// Device model constants
const DEVICE_MODELS = {
  FAN: 'DW4SF', // Fan Speed Control
  DIMmer_VOICE: 'DWVAA', // Voice Dimmer with Amazon Alexa
  DIMmer_1000W: 'DW1KD', // 1000W Dimmer
  DIMmer_600W: 'DW6HD', // 600W Dimmer
  DIMmer_600W_GEN2: 'D26HD', // 600W Dimmer (2nd Gen)
  DIMmer_PLUGIN_GEN2: 'D23LP', // Plug-In Dimmer (2nd Gen)
  DIMmer_PLUGIN: 'DW3HL', // Plug-In Dimmer
  OUTLET_TAMPER: 'DW15R', // Tamper Resistant Outlet
  OUTLET_PLUGIN_HP: 'DW15A', // Plug-in Outlet (1/2 HP)
  OUTLET_PLUGIN: 'DW15P', // Plug-in Outlet (3/4 HP)
}

// Dimmer models array for easy checking
const DIMMER_MODELS = [
  DEVICE_MODELS.DIMmer_VOICE,
  DEVICE_MODELS.DIMmer_1000W,
  DEVICE_MODELS.DIMmer_600W,
  DEVICE_MODELS.DIMmer_600W_GEN2,
  DEVICE_MODELS.DIMmer_PLUGIN_GEN2,
  DEVICE_MODELS.DIMmer_PLUGIN,
]

// Outlet models array
const OUTLET_MODELS = [DEVICE_MODELS.OUTLET_TAMPER, DEVICE_MODELS.OUTLET_PLUGIN_HP, DEVICE_MODELS.OUTLET_PLUGIN]

/**
 * Leviton Decora Smart Platform for Homebridge
 * @class LevitonDecoraSmartPlatform
 */
class LevitonDecoraSmartPlatform {
  /**
   * Creates an instance of LevitonDecoraSmartPlatform
   * @param {Function} log - Homebridge logger function
   * @param {Object} config - Plugin configuration
   * @param {string} config.email - My Leviton account email
   * @param {string} config.password - My Leviton account password
   * @param {string} [config.loglevel] - Log level (debug, info, warn, error)
   * @param {Array<string>} [config.excludedModels] - Device models to exclude
   * @param {Array<string>} [config.excludedSerials] - Device serials to exclude
   * @param {Object} api - Homebridge API instance
   */
  constructor(log, config, api) {
    this.config = config
    this.api = api
    this.accessories = []

    // Setup logging with level filtering
    this.log = this._setupLogging(log, config)

    // Validate configuration
    if (!this._validateConfig()) {
      return
    }

    // Initialize on Homebridge launch
    api.on('didFinishLaunching', async () => {
      await this._initialize()
    })
  }

  /**
   * Sets up logging with level filtering
   * @private
   * @param {Function} log - Homebridge logger
   * @param {Object} config - Configuration object
   * @returns {Object} Logger object with level methods
   */
  _setupLogging(log, config) {
    const noop = () => {}
    const logLevel = (config && LOG_LEVELS.includes(config.loglevel) && config.loglevel) || DEFAULT_LOG_LEVEL
    const minLevelIndex = LOG_LEVELS.indexOf(logLevel)

    const logger = (level) => (msg) => {
      if (LOG_LEVELS.indexOf(level) >= minLevelIndex) {
        log(msg)
      }
    }

    return LOG_LEVELS.reduce((loggerObj, level) => {
      loggerObj[level] = logger(level)
      return loggerObj
    }, {})
  }

  /**
   * Validates plugin configuration
   * @private
   * @returns {boolean} True if configuration is valid
   */
  _validateConfig() {
    if (this.config === null || this.config === undefined) {
      this.log.error(`No config for ${PLUGIN_NAME} defined.`)
      return false
    }

    if (!this.config.email || !this.config.password) {
      this.log.error(`email and password for ${PLUGIN_NAME} are required in config.json`)
      return false
    }

    if (typeof this.config.email !== 'string' || typeof this.config.password !== 'string') {
      this.log.error(`email and password must be strings`)
      return false
    }

    return true
  }

  /**
   * Initializes the platform and discovers devices
   * @private
   * @returns {Promise<void>}
   */
  async _initialize() {
    this.log.debug('didFinishLaunching')

    try {
      const { devices, token } = await this.initialize()

      if (!Array.isArray(devices) || devices.length === 0) {
        this.log.error('Unable to initialize: no devices found')
        return
      }

      // Get exclusion lists (fix: use excludedModels not excludeModels)
      const excludedModels = ((this.config.excludedModels || []).map((name) => name.toUpperCase()))
      const excludedSerials = ((this.config.excludedSerials || []).map((name) => name.toUpperCase()))

      // Add accessories for discovered devices
      devices.forEach((device) => {
        if (!this._isDeviceExcluded(device, excludedModels, excludedSerials)) {
          if (!this._accessoryExists(device)) {
            this.addAccessory(device, token)
          }
        }
      })
    } catch (error) {
      this.log.error(`Failed to initialize platform: ${error.message}`)
    }
  }

  /**
   * Checks if a device should be excluded
   * @private
   * @param {Object} device - Device object
   * @param {Array<string>} excludedModels - Excluded model names
   * @param {Array<string>} excludedSerials - Excluded serial numbers
   * @returns {boolean} True if device should be excluded
   */
  _isDeviceExcluded(device, excludedModels, excludedSerials) {
    if (!device || !device.model || !device.serial) {
      return false
    }

    const modelUpper = device.model.toUpperCase()
    const serialUpper = device.serial.toUpperCase()

    return excludedModels.includes(modelUpper) || excludedSerials.includes(serialUpper)
  }

  /**
   * Checks if an accessory already exists for a device
   * @private
   * @param {Object} device - Device object
   * @returns {boolean} True if accessory exists
   */
  _accessoryExists(device) {
    return this.accessories.some((acc) => acc.context.device && acc.context.device.serial === device.serial)
  }

  /**
   * Handles WebSocket subscription callbacks for device state updates
   * @param {Object} payload - Update payload
   * @param {string} payload.id - Device ID
   * @param {string} payload.power - Power state ('ON' or 'OFF')
   * @param {number} [payload.brightness] - Brightness level (0-100)
   */
  subscriptionCallback(payload) {
    if (!payload || !payload.id) {
      this.log.warn('Received invalid subscription payload')
      return
    }

    const accessory = this.accessories.find((acc) => acc.context.device && acc.context.device.id === payload.id)

    // Fix: Check accessory exists before using it
    if (!accessory) {
      this.log.debug(`No accessory found for device ID: ${payload.id}`)
      return
    }

    const { id, power, brightness } = payload

    this.log.debug(`Socket: ${accessory.displayName} (${id}): ${power} ${brightness ? `${brightness}%` : ''}`)

    const service =
      accessory.getService(Service.Fan) ||
      accessory.getService(Service.Switch) ||
      accessory.getService(Service.Outlet) ||
      accessory.getService(Service.Lightbulb)

    if (!service) {
      this.log.warn(`No service found for accessory: ${accessory.displayName}`)
      return
    }

    const isFan = !!accessory.getService(Service.Fan)

    // Update brightness/rotation speed if provided
    if (brightness !== undefined && brightness !== null) {
      const characteristic = isFan ? Characteristic.RotationSpeed : Characteristic.Brightness
      service.getCharacteristic(characteristic).updateValue(brightness)
    }

    // Update power state
    if (power !== undefined) {
      service.getCharacteristic(Characteristic.On).updateValue(power === POWER_ON)
    }
  }

  /**
   * Initializes API connection and retrieves devices
   * @returns {Promise<Object>} Object containing devices array and token
   * @throws {Error} If initialization fails
   */
  async initialize() {
    this.log.debug('initialize')

    let token
    let personID
    let accountID
    let residenceID
    let residenceObjectID
    let devices = []

    // Step 1: Login
    try {
      const login = await Leviton.postPersonLogin({
        email: this.config.email,
        password: this.config.password,
      })

      if (!login || !login.id || !login.userId) {
        throw new Error('Invalid login response: missing token or userId')
      }

      token = login.id
      personID = login.userId
      this.log.debug(`personID: ${personID}, hasToken: ${!!token}`)
    } catch (err) {
      const errorMsg = `Failed to login to Leviton: ${err.message}`
      this.log.error(errorMsg)
      throw new Error(errorMsg)
    }

    // Step 2: Get residential permissions
    try {
      const permissions = await Leviton.getPersonResidentialPermissions({
        personID,
        token,
      })

      if (!Array.isArray(permissions) || permissions.length === 0 || !permissions[0].residentialAccountId) {
        throw new Error('No residential permissions found')
      }

      accountID = permissions[0].residentialAccountId
      this.log.debug(`accountID: ${accountID}`)
    } catch (err) {
      const errorMsg = `Failed to get Leviton accountID: ${err.message}`
      this.log.error(errorMsg)
      throw new Error(errorMsg)
    }

    // Step 3: Get residential accounts
    try {
      const accounts = await Leviton.getResidentialAccounts({
        accountID,
        token,
      })

      if (!accounts || !accounts.primaryResidenceId || !accounts.id) {
        throw new Error('Invalid residential accounts response')
      }

      residenceID = accounts.primaryResidenceId
      residenceObjectID = accounts.id
      this.log.debug(`residenceID: ${residenceID}`)
    } catch (err) {
      const errorMsg = `Failed to get Leviton residenceID: ${err.message}`
      this.log.error(errorMsg)
      throw new Error(errorMsg)
    }

    // Step 4: Get devices
    try {
      devices = await Leviton.getResidenceIotSwitches({
        residenceID,
        token,
      })

      if (!Array.isArray(devices)) {
        devices = []
      }

      this.log.debug(`Found ${devices.length} devices`)
    } catch (err) {
      this.log.error(`Failed to get Leviton devices: ${err.message}`)
      devices = []
    }

    // Step 5: Try v2 API if no devices found
    if (!Array.isArray(devices) || devices.length === 0) {
      this.log.info('No devices found for primary residence id. Trying residence v2')

      try {
        const accountsV2Response = await Leviton.getResidentialAccountsV2({
          residenceObjectID,
          token,
        })

        if (Array.isArray(accountsV2Response) && accountsV2Response.length > 0 && accountsV2Response[0].id) {
          residenceID = accountsV2Response[0].id
          devices = await Leviton.getResidenceIotSwitches({
            residenceID,
            token,
          })

          if (!Array.isArray(devices)) {
            devices = []
          }
        }

        if (!Array.isArray(devices) || devices.length === 0) {
          throw new Error(`No devices found for residenceID: ${residenceID} or residenceIDV2 method: ${residenceObjectID}`)
        }
      } catch (err) {
        const errorMsg = `Failed to get devices via v2 API: ${err.message}`
        this.log.error(errorMsg)
        throw new Error(errorMsg)
      }
    }

    // Step 6: Subscribe to WebSocket updates
    try {
      const login = { id: token, userId: personID }
      Leviton.subscribe(login, devices, this.subscriptionCallback.bind(this), this)
    } catch (err) {
      this.log.error(`Error subscribing devices to websocket updates: ${err.message}`)
      // Don't throw - continue without WebSocket updates
    }

    return { devices, token }
  }

  /**
   * Creates a getter function for power state
   * @param {Object} service - HomeKit service
   * @param {Object} device - Device object
   * @param {string} token - Authentication token
   * @returns {Function} Getter callback function
   */
  onGetPower(service, device, token) {
    return function (callback) {
      if (!callback || typeof callback !== 'function') {
        this.log.error('Invalid callback provided to onGetPower')
        return
      }

      Leviton.getIotSwitch({
        switchID: device.id,
        token,
      })
        .then((res) => {
          if (!res || res.power === undefined) {
            throw new Error('Invalid response from getIotSwitch')
          }

          const isOn = res.power === POWER_ON
          this.log.debug(`onGetPower: ${device.name} ${res.power}`)
          service.getCharacteristic(Characteristic.On).updateValue(isOn)
          callback(null, isOn)
        })
        .catch((err) => {
          this.log.error(`onGetPower error: ${err.message}`)
          callback(err) // Fix: Always call callback with error
        })
    }
  }

  /**
   * Creates a setter function for power state
   * @param {Object} service - HomeKit service
   * @param {Object} device - Device object
   * @param {string} token - Authentication token
   * @returns {Function} Setter callback function
   */
  onSetPower(service, device, token) {
    return function (value, callback) {
      if (!callback || typeof callback !== 'function') {
        this.log.error('Invalid callback provided to onSetPower')
        return
      }

      const powerValue = value ? POWER_ON : POWER_OFF

      Leviton.putIotSwitch({
        switchID: device.id,
        power: powerValue,
        token,
      })
        .then((res) => {
          const isOn = res.power === POWER_ON
          this.log.info(`onSetPower: ${device.name} ${res.power}`)
          service.getCharacteristic(Characteristic.On).updateValue(isOn)
          callback() // Success - no error
        })
        .catch((err) => {
          this.log.error(`onSetPower error: ${err.message}`)
          callback(err) // Fix: Always call callback with error
        })
    }
  }

  /**
   * Creates a getter function for brightness
   * @param {Object} service - HomeKit service
   * @param {Object} device - Device object
   * @param {string} token - Authentication token
   * @returns {Function} Getter callback function
   */
  onGetBrightness(service, device, token) {
    return function (callback) {
      if (!callback || typeof callback !== 'function') {
        this.log.error('Invalid callback provided to onGetBrightness')
        return
      }

      Leviton.getIotSwitch({
        switchID: device.id,
        token,
      })
        .then((res) => {
          if (!res || res.brightness === undefined) {
            throw new Error('Invalid response from getIotSwitch')
          }

          this.log.debug(`onGetBrightness: ${device.name} @ ${res.brightness}%`)
          service.getCharacteristic(Characteristic.Brightness).updateValue(res.brightness)
          callback(null, res.brightness)
        })
        .catch((err) => {
          this.log.error(`onGetBrightness error: ${err.message}`)
          callback(err) // Fix: Always call callback with error
        })
    }
  }

  /**
   * Creates a setter function for brightness
   * @param {Object} service - HomeKit service
   * @param {Object} device - Device object
   * @param {string} token - Authentication token
   * @returns {Function} Setter callback function
   */
  onSetBrightness(service, device, token) {
    return function (brightness, callback) {
      if (!callback || typeof callback !== 'function') {
        this.log.error('Invalid callback provided to onSetBrightness')
        return
      }

      if (typeof brightness !== 'number' || brightness < 0 || brightness > 100) {
        const err = new Error('Brightness must be between 0 and 100')
        this.log.error(`onSetBrightness error: ${err.message}`)
        callback(err)
        return
      }

      Leviton.putIotSwitch({
        switchID: device.id,
        brightness,
        token,
      })
        .then((res) => {
          this.log.info(`onSetBrightness: ${device.name} @ ${res.brightness}%`)
          service.getCharacteristic(Characteristic.Brightness).updateValue(res.brightness)
          callback() // Success
        })
        .catch((err) => {
          this.log.error(`onSetBrightness error: ${err.message}`)
          callback(err) // Fix: Always call callback with error
        })
    }
  }

  /**
   * Creates a getter function for rotation speed (fan)
   * @param {Object} service - HomeKit service
   * @param {Object} device - Device object
   * @param {string} token - Authentication token
   * @returns {Function} Getter callback function
   */
  onGetRotationSpeed(service, device, token) {
    return function (callback) {
      if (!callback || typeof callback !== 'function') {
        this.log.error('Invalid callback provided to onGetRotationSpeed')
        return
      }

      Leviton.getIotSwitch({
        switchID: device.id,
        token,
      })
        .then((res) => {
          if (!res || res.brightness === undefined) {
            throw new Error('Invalid response from getIotSwitch')
          }

          this.log.debug(`onGetRotationSpeed: ${device.name} @ ${res.brightness}%`)
          service.getCharacteristic(Characteristic.RotationSpeed).updateValue(res.brightness)
          callback(null, res.brightness)
        })
        .catch((err) => {
          this.log.error(`onGetRotationSpeed error: ${err.message}`)
          callback(err) // Fix: Always call callback with error
        })
    }
  }

  /**
   * Creates a setter function for rotation speed (fan)
   * @param {Object} service - HomeKit service
   * @param {Object} device - Device object
   * @param {string} token - Authentication token
   * @returns {Function} Setter callback function
   */
  onSetRotationSpeed(service, device, token) {
    return function (speed, callback) {
      if (!callback || typeof callback !== 'function') {
        this.log.error('Invalid callback provided to onSetRotationSpeed')
        return
      }

      if (typeof speed !== 'number' || speed < 0 || speed > 100) {
        const err = new Error('Rotation speed must be between 0 and 100')
        this.log.error(`onSetRotationSpeed error: ${err.message}`)
        callback(err)
        return
      }

      Leviton.putIotSwitch({
        switchID: device.id,
        brightness: speed, // Fan uses brightness field for speed
        token,
      })
        .then((res) => {
          this.log.info(`onSetRotationSpeed: ${device.name} @ ${res.brightness}%`)
          service.getCharacteristic(Characteristic.RotationSpeed).updateValue(res.brightness)
          callback() // Success
        })
        .catch((err) => {
          this.log.error(`onSetRotationSpeed error: ${err.message}`)
          callback(err) // Fix: Always call callback with error
        })
    }
  }

  /**
   * Adds a new accessory to the platform
   * @param {Object} device - Device object from Leviton API
   * @param {string} token - Authentication token
   * @returns {Promise<void>}
   */
  async addAccessory(device, token) {
    if (!device || !device.serial || !device.name) {
      this.log.error('Invalid device object provided to addAccessory')
      return
    }

    this.log.info(`addAccessory ${device.name}`)

    // Generate UUID based on device serial and create accessory
    const uuid = UUID.generate(device.serial)
    
    // Defensive check: ensure platformAccessory is a function
    if (typeof this.api.platformAccessory !== 'function') {
      this.log.error(`platformAccessory is not a function: ${typeof this.api.platformAccessory}`)
      throw new Error('platformAccessory is not a function')
    }
    
    const accessory = new this.api.platformAccessory(device.name, uuid)

    // Ensure context exists (defensive check for test environment)
    if (!accessory.context) {
      accessory.context = {}
    }
    
    // Defensive check: ensure getService is a function
    if (typeof accessory.getService !== 'function') {
      const keys = Object.keys(accessory)
      const getServiceType = typeof accessory.getService
      const getServiceValue = accessory.getService
      this.log.error(`accessory.getService is not a function: type=${getServiceType}, value=${getServiceValue}, keys=${keys.join(', ')}, accessory=${JSON.stringify(accessory, null, 2)}`)
      throw new Error(`accessory.getService is not a function (type: ${getServiceType}, keys: ${keys.join(', ')})`)
    }

    // Save device and token information to context
    accessory.context.device = device
    accessory.context.token = token

    // Set device info in AccessoryInformation service
    const infoService = accessory.getService(Service.AccessoryInformation)
    if (infoService) {
      infoService
        .setCharacteristic(Characteristic.Name, device.name || 'Unknown Device')
        .setCharacteristic(Characteristic.SerialNumber, device.serial || 'Unknown')
        .setCharacteristic(Characteristic.Manufacturer, device.manufacturer || 'Leviton')
        .setCharacteristic(Characteristic.Model, device.model || 'Unknown')
        .setCharacteristic(Characteristic.FirmwareRevision, device.version || 'Unknown')
    }

    // Setup service (adds characteristics and handlers)
    await this.setupService(accessory)

    // Register with Homebridge
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory])

    // Add to accessories array
    this.accessories.push(accessory)
    this.log.debug(`Finished adding accessory ${device.name}`)
  }

  /**
   * Configures a cached accessory (restored from Homebridge cache)
   * @param {Object} accessory - Cached platform accessory
   * @returns {Promise<void>}
   */
  async configureAccessory(accessory) {
    this.log.debug(`configureAccessory: ${accessory.displayName}`)
    await this.setupService(accessory)
    this.accessories.push(accessory)
  }

  /**
   * Fetches the current status of a device
   * @param {Object} device - Device object
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Device status object
   */
  async getStatus(device, token) {
    if (!device || !device.id || !token) {
      throw new Error('device.id and token are required')
    }

    this.log.debug(`getStatus: ${device.name}`)
    return Leviton.getIotSwitch({
      switchID: device.id,
      token,
    })
  }

  /**
   * Sets up the appropriate service for a device based on its model
   * @param {Object} accessory - Platform accessory
   * @returns {Promise<void>}
   */
  async setupService(accessory) {
    this.log.debug(`setupService: ${accessory.displayName}`)

    const device = accessory.context.device
    const token = accessory.context.token

    if (!device || !token) {
      this.log.error(`Missing device or token in accessory context: ${accessory.displayName}`)
      return
    }

    if (!device.model) {
      this.log.warn(`Device missing model, defaulting to Switch: ${accessory.displayName}`)
      await this.setupSwitchService(accessory)
      return
    }

    this.log.debug(`Device Model: ${device.model}`)

    // Determine service type based on model
    if (device.model === DEVICE_MODELS.FAN) {
      await this.setupFanService(accessory)
    } else if (DIMMER_MODELS.includes(device.model)) {
      await this.setupLightbulbService(accessory)
    } else if (OUTLET_MODELS.includes(device.model)) {
      await this.setupOutletService(accessory)
    } else {
      // Default to switch for unknown models
      await this.setupSwitchService(accessory)
    }
  }

  /**
   * Sets up a basic switch service
   * @param {Object} accessory - Platform accessory
   * @returns {Promise<void>}
   */
  async setupSwitchService(accessory) {
    this.log.debug(`Setting up device as Switch: ${accessory.displayName}`)
    await this._setupBasicService(accessory, Service.Switch)
  }

  /**
   * Sets up an outlet service
   * @param {Object} accessory - Platform accessory
   * @returns {Promise<void>}
   */
  async setupOutletService(accessory) {
    this.log.debug(`Setting up device as Outlet: ${accessory.displayName}`)
    await this._setupBasicService(accessory, Service.Outlet)
  }

  /**
   * Sets up a lightbulb service with brightness control
   * @param {Object} accessory - Platform accessory
   * @returns {Promise<void>}
   */
  async setupLightbulbService(accessory) {
    this.log.debug(`Setting up device as Lightbulb: ${accessory.displayName}`)

    const device = accessory.context.device
    const token = accessory.context.token

    let status
    try {
      status = await this.getStatus(device, token)
    } catch (err) {
      this.log.error(`Failed to get status for ${device.name}: ${err.message}`)
      status = { power: POWER_OFF, brightness: 0, minLevel: 1, maxLevel: 100 }
    }

    const service =
      accessory.getService(Service.Lightbulb, device.name) || accessory.addService(Service.Lightbulb, device.name)

    // Setup power characteristic
    service
      .getCharacteristic(Characteristic.On)
      .on('get', this.onGetPower(service, device, token).bind(this))
      .on('set', this.onSetPower(service, device, token).bind(this))
      .updateValue(status.power === POWER_ON)

    // Setup brightness characteristic
    service
      .getCharacteristic(Characteristic.Brightness)
      .on('get', this.onGetBrightness(service, device, token).bind(this))
      .on('set', this.onSetBrightness(service, device, token).bind(this))
      .setProps({
        minValue: status.minLevel || 1,
        maxValue: status.maxLevel || 100,
        minStep: 1,
      })
      .updateValue(status.brightness || 0)
  }

  /**
   * Sets up a fan service with rotation speed control
   * @param {Object} accessory - Platform accessory
   * @returns {Promise<void>}
   */
  async setupFanService(accessory) {
    this.log.debug(`Setting up device as Fan: ${accessory.displayName}`)

    const device = accessory.context.device
    const token = accessory.context.token

    let status
    try {
      status = await this.getStatus(device, token)
    } catch (err) {
      this.log.error(`Failed to get status for ${device.name}: ${err.message}`)
      status = { power: POWER_OFF, brightness: 0, minLevel: 0, maxLevel: 100 }
    }

    const service = accessory.getService(Service.Fan, device.name) || accessory.addService(Service.Fan, device.name)

    // Setup power characteristic
    service
      .getCharacteristic(Characteristic.On)
      .on('get', this.onGetPower(service, device, token).bind(this))
      .on('set', this.onSetPower(service, device, token).bind(this))
      .updateValue(status.power === POWER_ON)

    // Setup rotation speed characteristic
    service
      .getCharacteristic(Characteristic.RotationSpeed)
      .on('get', this.onGetRotationSpeed(service, device, token).bind(this))
      .on('set', this.onSetRotationSpeed(service, device, token).bind(this))
      .setProps({
        minValue: 0,
        maxValue: status.maxLevel || 100,
        minStep: status.minLevel || 1,
      })
      .updateValue(status.brightness || 0)
  }

  /**
   * Helper method to setup basic service (Switch or Outlet)
   * @private
   * @param {Object} accessory - Platform accessory
   * @param {Object} ServiceType - HomeKit service type (Service.Switch or Service.Outlet)
   * @returns {Promise<void>}
   */
  async _setupBasicService(accessory, ServiceType) {
    const device = accessory.context.device
    const token = accessory.context.token

    let status
    try {
      status = await this.getStatus(device, token)
    } catch (err) {
      this.log.error(`Failed to get status for ${device.name}: ${err.message}`)
      status = { power: POWER_OFF }
    }

    const service = accessory.getService(ServiceType, device.name) || accessory.addService(ServiceType, device.name)

    service
      .getCharacteristic(Characteristic.On)
      .on('get', this.onGetPower(service, device, token).bind(this))
      .on('set', this.onSetPower(service, device, token).bind(this))
      .updateValue(status.power === POWER_ON)
  }

  /**
   * Removes all accessories and unregisters them
   */
  removeAccessories() {
    this.log.info('Removing all accessories')
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, this.accessories)
    this.accessories.splice(0, this.accessories.length)
  }
}

/**
 * Homebridge plugin registration
 * @param {Object} homebridge - Homebridge API
 */
module.exports = function (homebridge) {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  Accessory = homebridge.hap.Accessory
  UUID = homebridge.hap.uuid
  homebridge.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, LevitonDecoraSmartPlatform, true)
}
