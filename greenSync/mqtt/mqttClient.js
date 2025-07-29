import mqtt from 'mqtt';
import mqttConfig from '../config/mqttConfig.js';
import sensorDataService from '../services/sensorDataService.js';
import Logger from '../utils/logger.js';

const client = mqtt.connect(`${mqttConfig.host}:${mqttConfig.port}`);

client.on('connect', () => {
  Logger.info('[MQTT Client] Connected to broker');

  // 센서 데이터 구독
  client.subscribe(mqttConfig.sensorTopic, (err) => {
    if (err) {
      Logger.error('[MQTT Client] Subscribe error:', err);
    } else {
      Logger.info(`[MQTT Client] Subscribed to topic: ${mqttConfig.sensorTopic}`);
    }
  });

  // 상태 데이터 구독 추가
  client.subscribe('device/status/+', (err) => {
    if (err) {
      Logger.error('[MQTT Client] Status topic subscribe error:', err);
    } else {
      Logger.info('[MQTT Client] Subscribed to device status topics');
    }
  });
});

client.on('message', async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());

    // 센서 데이터 저장
    if (topic.startsWith('sensor/data/')) {
      const farmCode = topic.split('/')[2];
      await sensorDataService.saveSensorData(payload, farmCode);
      Logger.info('[MQTT Client] Sensor data saved');
    }

    // 장치 상태 저장
    else if (topic.startsWith('device/status/')) {
      const farmCode = topic.split('/')[2];
      await sensorDataService.saveDeviceStatus(payload, farmCode);
      Logger.info('[MQTT Client] Device status updated');
    }

  } catch (err) {
    Logger.error('[MQTT Client] Error processing message:', err);
  }
});

export default client;
