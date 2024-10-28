let Service, Characteristic;
const Leviton = require('./api.js');
const PLUGIN_NAME = 'homebridge-leviton';
const PLATFORM_NAME = 'LevitonDecoraSmart';
const levels = ['debug', 'info', 'warn', 'error'];

class LevitonDecoraSmartPlatform {
  constructor(log, config, api) {
    this.config = config;
    this.api = api;
    this.accessories = [];

    const noop = function () {};
    const logger = (level) => (msg) =>
      levels.indexOf((config && levels.includes(config.loglevel) && config.loglevel) || 'info') <= levels.indexOf(level)
        ? log(msg)
        : noop();

    // create a level method for each on this.log
    this.log = levels.reduce((a, l) => {
      a[l] = logger(l);
      return a;
    }, {});

    if (config === null) {
      this.log.error(`No config for ${PLUGIN_NAME} defined.`);
      return;
    }

    if (!config.email || !config.password) {
      this.log.error(`Email and password for ${PLUGIN_NAME} are required in config.json.`);
      return;
    }

    // Initialize Service and Characteristic from API
    Service = this.api.hap.Service;
    Characteristic = this.api.hap.Characteristic;

    // on launch, init API, iterate over new devices
    api.on('didFinishLaunching', async () => {
      this.log.debug('didFinishLaunching');
      const { devices, token } = await this.initialize(config);
      if (Array.isArray(devices) && devices.length > 0) {
        devices.forEach((device) => {
          if (!this.accessories.find((acc) => acc.context.device.serial === device.serial)) {
            this.addAccessory(device, token);
          }
        });
      } else {
        this.log.error('Unable to initialize: no devices found');
      }
    });
  }

  // Other methods remain the same...

  async addAccessory(device, token) {
    this.log.info(`Adding accessory: ${device.name}`);

    // Generate UUID based on device serial and create accessory
    const uuid = this.api.hap.uuid.generate(device.serial);
    const accessory = new this.api.platformAccessory(device.name, uuid);

    // Save device and token information to context for later use
    accessory.context.device = device;
    accessory.context.token = token;

    accessory
      .getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, device.name)
      .setCharacteristic(Characteristic.SerialNumber, device.serial)
      .setCharacteristic(Characteristic.Manufacturer, device.manufacturer)
      .setCharacteristic(Characteristic.Model, device.model)
      .setCharacteristic(Characteristic.FirmwareRevision, device.version);

    this.setupService(accessory);
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

    // Add configured accessory
    this.accessories.push(accessory);
    this.log.debug(`Finished adding accessory ${device.name}`);
  }

  // Other methods remain the same...

  removeAccessories() {
    this.log.info('Removing all accessories');
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, this.accessories);
    this.accessories.splice(0, this.accessories.length);
  }
}

// Register platform with Homebridge 2.0
module.exports = (api) => {
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, LevitonDecoraSmartPlatform);
};
