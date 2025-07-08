import { sequelize } from './connection.js';
import User from './user.js';
import CarbonDioxide from './carbonDioxide.js';
import Farm from './farm.js';
import Humidity from './humidity.js';
import Nutrient from './nutrient.js';
import Optimalization from './optimalization.js';
import Temperature from './temperature.js';
import Weather from './weather.js';

const db = {};

db.sequelize = sequelize;

// model 생성
db.User = User;
db.CarbonDioxide = CarbonDioxide;
db.Farm = Farm;
db.Humidity = Humidity;
db.Nutrient = Nutrient;
db.Optimalization = Optimalization;
db.Temperature = Temperature;
db.Weather = Weather;

// model init
User.init(sequelize);
CarbonDioxide.init(sequelize);
Farm.init(sequelize);
Humidity.init(sequelize);
Nutrient.init(sequelize);
Optimalization.init(sequelize);
Temperature.init(sequelize);
Weather.init(sequelize);

// 관계 설정
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

export default db;