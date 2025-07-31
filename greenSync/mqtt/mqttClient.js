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

  // 아두이노 장치 상태 구독
  client.subscribe('device/status/+', (err) => {
    if (err) {
      Logger.error('[MQTT Client] Arduino device status topic subscribe error:', err);
    } else {
      Logger.info('[MQTT Client] Subscribed to arduino device status topics');
    }
  });
});

client.on('message', async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());

    // 비동기 처리로 블로킹 방지
    setImmediate(async () => {
      try {
        // 센서 데이터 저장
        if (topic.startsWith('sensor/data/')) {
          const farmCode = topic.split('/')[2];
          await sensorDataService.saveSensorData(payload, farmCode);
          Logger.info('[MQTT Client] Sensor data saved');
        }

        // 아두이노 장치 상태 저장
        else if (topic.startsWith('device/status/')) {
          const farmCode = topic.split('/')[2];
          const { fan, leds } = payload;
          await sensorDataService.saveArduinoDeviceStatus(farmCode, fan, leds);
          Logger.info('[MQTT Client] Arduino device status saved');
        }
      } catch (err) {
        Logger.error('[MQTT Client] Error processing message:', err);
      }
    });

  } catch (err) {
    Logger.error('[MQTT Client] Error parsing message:', err);
  }
});

export default client;
