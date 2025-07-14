export default {
  host: `mqtt://${process.env.MQTT_HOST}`,
  port: 1883,
  sensorTopic: `sensor/data/#`,
};