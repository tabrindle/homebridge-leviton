let Service, Characteristic, Accessory, UUID
const Leviton = require('./api.js')
const PLUGIN_NAME = 'homebridge-leviton'
const PLATFORM_NAME = 'LevitonDecoraSmart'

class LevitonDecoraSmartPlatform {
  constructor(log, config, api) {
    this.log = log
    this.config = config
    this.api = api
    this.accessories = []

    if (config === null) {
      this.log.error('No config defined.')
      return
    }

    if (!config.email || !config.password) {
      this.log.error('email and password are required in config.json')
      return
    }

    // on launch, init api, iterate over new devices
    api.on('didFinishLaunching', async () => {
      this.log('didFinishLaunching')
      const { devices = [], token } = await this.initialize(config)
      devices.forEach((device) => {
        if (!this.accessories.find((acc) => acc.context.device.serial === device.serial)) {
          this.addAccessory(device, token)
        }
      })
    })
  }

  subscriptionCallback(payload) {
    const accessory = this.accessories.find((acc) => acc.context.device.id === payload.id)
    const { id, power, brightness } = payload

    this.log(`Socket: ${accessory.displayName} (${id}): ${power} ${brightness ? `${brightness}%` : ''}`)

    if (!accessory) return

    const service =
      accessory.getService(Service.Fan) ||
      accessory.getService(Service.Switch) ||
      accessory.getService(Service.Outlet) ||
      accessory.getService(Service.Lightbulb)
    const isFan = !!accessory.getService(Service.Fan)

    if (payload.brightness)
      service
        .getCharacteristic(isFan ? Characteristic.RotationSpeed : Characteristic.Brightness)
        .updateValue(payload.brightness)
    service.getCharacteristic(Characteristic.On).updateValue(payload.power === 'ON')
  }

  // init function that sets up personID, accountID and residenceID to return token+devices
  async initialize() {
    this.log('initialize')

    const login = await Leviton.postPersonLogin({
      email: this.config['email'],
      password: this.config['password'],
    })
    const { id: token, userId: personID } = login
    const permissions = await Leviton.getPersonResidentialPermissions({
      personID,
      token,
    })
    const accountID = permissions[0].residentialAccountId
    const { primaryResidenceId: residenceID } = await Leviton.getResidentialAccounts({
      accountID,
      token,
    })
    const devices = await Leviton.getResidenceIotSwitches({
      residenceID,
      token,
    })

    Leviton.subscribe(login, devices, this.subscriptionCallback.bind(this), this)

    return { devices, token }
  }

  // switch power state getter, closure with service, device and token
  onGetPower(service, device, token) {
    return function (callback) {
      return Leviton.getIotSwitch({
        switchID: device.id,
        token,
      })
        .then((res) => {
          this.log('onGetPower', device.name, res.power)
          service.getCharacteristic(Characteristic.On).updateValue(res.power === 'ON')
          callback(null, res.power === 'ON')
        })
        .catch((err) => {
          this.log('error', err)
        })
    }
  }

  // switch power state setter, closure with service, device and token
  onSetPower(service, device, token) {
    return function (value, callback) {
      return Leviton.putIotSwitch({
        switchID: device.id,
        power: value ? 'ON' : 'OFF',
        token,
      })
        .then((res) => {
          this.log('onSetPower', device.name, res.power)
          service.getCharacteristic(Characteristic.On).updateValue(res.power === 'ON')
          callback()
        })
        .catch((err) => {
          this.log('error', err)
        })
    }
  }

  // switch brightness getter closure with service, device and token
  onGetBrightness(service, device, token) {
    return function (callback) {
      return Leviton.getIotSwitch({
        switchID: device.id,
        token,
      })
        .then((res) => {
          this.log('onGetBrightness', device.name, `${res.brightness}%`)
          service.getCharacteristic(Characteristic.Brightness).updateValue(res.brightness)
          callback(null, res.brightness)
        })
        .catch((err) => {
          this.log('error', err)
        })
    }
  }

  // switch brightness setter closure with service, device and token
  onSetBrightness(service, device, token) {
    return function (brightness, callback) {
      return Leviton.putIotSwitch({
        switchID: device.id,
        brightness,
        token,
      })
        .then((res) => {
          this.log('onSetBrightness', device.name, `${res.brightness}%`)
          service.getCharacteristic(Characteristic.Brightness).updateValue(res.brightness)
          callback()
        })
        .catch((err) => {
          this.log('error', err)
        })
    }
  }

  // switch RotationSpeed getter closure with service, device and token
  onGetRotationSpeed(service, device, token) {
    return function (callback) {
      return Leviton.getIotSwitch({
        switchID: device.id,
        token,
      })
        .then((res) => {
          this.log('onGetRotationSpeed', device.name, `${res.brightness}%`)
          service.getCharacteristic(Characteristic.RotationSpeed).updateValue(res.brightness)
          callback(null, res.brightness)
        })
        .catch((err) => {
          this.log('error', err)
        })
    }
  }

  // switch RotationSpeed setter closure with service, device and token
  onSetRotationSpeed(service, device, token) {
    return function (brightness, callback) {
      return Leviton.putIotSwitch({
        switchID: device.id,
        brightness,
        token,
      })
        .then((res) => {
          this.log('onSetRotationSpeed', device.name, `${res.brightness}%`)
          service.getCharacteristic(Characteristic.RotationSpeed).updateValue(res.brightness)
          callback()
        })
        .catch((err) => {
          this.log('error', err)
        })
    }
  }

  async addAccessory(device, token) {
    this.log(`addAccessory ${device.name}`)

    // generate uuid based on device serial and create accessory
    const uuid = UUID.generate(device.serial)
    const accessory = new this.api.platformAccessory(device.name, uuid)

    // save device and token information to context for later use
    accessory.context.device = device
    accessory.context.token = token

    // save device info to AccessoryInformation service (which always exists?)
    accessory
      .getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, device.name)
      .setCharacteristic(Characteristic.SerialNumber, device.serial)
      .setCharacteristic(Characteristic.Manufacturer, device.manufacturer)
      .setCharacteristic(Characteristic.Model, device.model)
      .setCharacteristic(Characteristic.FirmwareRevision, device.version)

    // setupService adds services, characteristics and getters/setters
    this.setupService(accessory)
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory])

    // add configured accessory
    this.accessories.push(accessory)
    this.log(`Finished adding accessory ${device.name}`)
  }

  // set up cached accessories
  async configureAccessory(accessory) {
    this.log('configureAccessory', accessory.displayName)
    this.setupService(accessory)
    this.accessories.push(accessory)
  }

  // fetch the status of a device to populate power state and brightness
  async getStatus(device, token) {
    this.log('getStatus', device.name)
    return Leviton.getIotSwitch({
      switchID: device.id,
      token,
    })
  }

  // setup service function
  async setupService(accessory) {
    this.log('setupService', accessory.displayName)

    // get device and token out of context to update status
    const device = accessory.context.device
    const token = accessory.context.token

    // Get the model number
    this.log('Device Model:', device.model)

    switch (device.model) {
      case 'DW4SF': // Fan Speed Control
        this.setupFanService(accessory)
        break
      case 'DWVAA': // Voice Dimmer with Amazon Alexa
      case 'DW1KD': // 1000W Dimmer
      case 'DW6HD': // 600W Dimmer
      case 'D26HD': // 600W Dimmer (2nd Gen)
      case 'DW3HL': // Plug-In Dimmer
        this.setupLightbulbService(accessory)
        break
      case 'DW15R': // Tamper Resistant Outlet
      case 'DW15A': // Plug-in Outlet (1/2 HP)
      case 'DW15P': // Pluig-in Outlet (3/4 HP)
        this.setupOutletService(accessory)
        break
      default:
        // Set up anything else as a simple switch (i.e. - DW15S, etc)
        this.setupSwitchService(accessory)
        break
    }
  }

  async setupSwitchService(accessory) {
    this.log('Setting up device as Switch:', accessory.displayName)

    // get device and token out of context to update status
    const device = accessory.context.device
    const token = accessory.context.token
    const status = await this.getStatus(device, token)

    // get the accessory service, if not add it
    const service =
      accessory.getService(Service.Switch, device.name) || accessory.addService(Service.Switch, device.name)

    // add handlers for on/off characteristic, set initial value
    service
      .getCharacteristic(Characteristic.On)
      .on('get', this.onGetPower(service, device, token).bind(this))
      .on('set', this.onSetPower(service, device, token).bind(this))
      .updateValue(status.power === 'ON' ? true : false)
  }

  async setupOutletService(accessory) {
    this.log('Setting up device as Outlet:', accessory.displayName)

    // get device and token out of context to update status
    const device = accessory.context.device
    const token = accessory.context.token
    const status = await this.getStatus(device, token)

    // get the accessory service, if not add it
    const service =
      accessory.getService(Service.Outlet, device.name) || accessory.addService(Service.Outlet, device.name)

    // add handlers for on/off characteristic, set initial value
    service
      .getCharacteristic(Characteristic.On)
      .on('get', this.onGetPower(service, device, token).bind(this))
      .on('set', this.onSetPower(service, device, token).bind(this))
      .updateValue(status.power === 'ON' ? true : false)
  }

  async setupLightbulbService(accessory) {
    this.log('Setting up device as Lightbulb:', accessory.displayName)

    // get device and token out of context to update status
    const device = accessory.context.device
    const token = accessory.context.token
    const status = await this.getStatus(device, token)

    // get the accessory service, if not add it
    const service =
      accessory.getService(Service.Lightbulb, device.name) || accessory.addService(Service.Lightbulb, device.name)

    // add handlers for on/off characteristic, set initial value
    service
      .getCharacteristic(Characteristic.On)
      .on('get', this.onGetPower(service, device, token).bind(this))
      .on('set', this.onSetPower(service, device, token).bind(this))
      .updateValue(status.power === 'ON' ? true : false)

    // set handlers for brightness, set initial value and min/max bounds
    service
      .getCharacteristic(Characteristic.Brightness)
      .on('get', this.onGetBrightness(service, device, token).bind(this))
      .on('set', this.onSetBrightness(service, device, token).bind(this))
      .setProps({
        minValue: status.minLevel,
        maxValue: status.maxLevel,
        minStep: 1,
      })
      .updateValue(status.brightness)
  }

  async setupFanService(accessory) {
    this.log('Setting up device as Fan:', accessory.displayName)

    // get device and token out of context to update status
    const device = accessory.context.device
    const token = accessory.context.token
    const status = await this.getStatus(device, token)

    // get the accessory service, if not add it
    const service = accessory.getService(Service.Fan, device.name) || accessory.addService(Service.Fan, device.name)

    // add handlers for on/off characteristic, set initial value
    service
      .getCharacteristic(Characteristic.On)
      .on('get', this.onGetPower(service, device, token).bind(this))
      .on('set', this.onSetPower(service, device, token).bind(this))
      .updateValue(status.power === 'ON' ? true : false)

    // set handlers for brightness, set initial value and min/max bounds
    service
      .getCharacteristic(Characteristic.RotationSpeed)
      .on('get', this.onGetRotationSpeed(service, device, token).bind(this))
      .on('set', this.onSetRotationSpeed(service, device, token).bind(this))
      .setProps({
        minValue: 0,
        maxValue: status.maxLevel,
        minStep: status.minLevel,
      })
      .updateValue(status.brightness)
  }

  // remove accessories and unregister
  removeAccessories() {
    this.log.info('Removing all accessories')
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, this.accessories)
    this.accessories.splice(0, this.accessories.length)
  }
}

module.exports = function (homebridge) {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  Accessory = homebridge.hap.Accessory
  UUID = homebridge.hap.uuid
  homebridge.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, LevitonDecoraSmartPlatform, true)
}
