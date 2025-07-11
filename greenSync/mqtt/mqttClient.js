import mqtt from 'mqtt';
import mqttConfig from '../config/mqttConfig.js';
import sensorDataService from '../services/sensorDataService.js';

const client = mqtt.connect(`${mqttConfig.host}:${mqttConfig.port}`);

client.on('connect', () => {
  console.log('[MQTT] Connected to broker');

  client.subscribe(mqttConfig.sensorTopic, (err) => {
    if (err) {
      console.error('[MQTT] Subscribe error:', err);
    } else {
      console.log(`[MQTT] Subscribed to topic: ${mqttConfig.sensorTopic}`);
    }
  });
});

client.on('message', async (topic, message) => {
  try {
    if (topic === mqttConfig.sensorTopic) {
      const payload = JSON.parse(message.toString());

      const farmCode = topic.split('/')[2];

      await sensorDataService.saveSensorData(payload, farmCode);

      console.log('[MQTT] Sensor data saved');
    }
  } catch (err) {
    console.error('[MQTT] Error processing message:', err);
  }
});

export default client;
