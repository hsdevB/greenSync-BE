import mqtt from 'mqtt';
import mqttConfig from '../config/mqttConfig.js';
import sensorDataService from '../services/sensorDataService.js';
import logger from '../utils/logger.js';

const client = mqtt.connect(`${mqttConfig.host}:${mqttConfig.port}`);

client.on('connect', () => {
  logger.info('[MQTT Client] Connected to broker');

  client.subscribe(mqttConfig.sensorTopic, (err) => {
    if (err) {
      logger.error('[MQTT Client] Subscribe error:', err);
    } else {
      logger.info(`[MQTT Client] Subscribed to topic: ${mqttConfig.sensorTopic}`);
    }
  });
});

client.on('message', async (topic, message) => {
  try {
    if (topic.startsWith('sensor/data/')) {
      const payload = JSON.parse(message.toString());

      const farmCode = topic.split('/')[2];

      await sensorDataService.saveSensorData(payload, farmCode);

      logger.info('[MQTT Client] Sensor data saved');
    }
  } catch (err) {
    logger.error('[MQTT Client] Error processing message:', err);
  }
});

export default client;
