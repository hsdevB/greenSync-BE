import { Model, DataTypes } from 'sequelize';

class DeviceStatus extends Model {
  static init(sequelize) {
    return super.init(
      {
        farmId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '농장 ID',
        },
        fan: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          comment: '팬 상태 (ON/OFF)',
        },
        led1: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          comment: 'LED1 상태',
        },
        led2: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          comment: 'LED2 상태',
        },
        led3: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          comment: 'LED3 상태',
        },
        led4: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          comment: 'LED4 상태',
        },
        controlTemperature: {
          type: DataTypes.FLOAT,
          allowNull: true,
          defaultValue: 0,
          comment: '제어온도',
        },
        controlHumidity: {
          type: DataTypes.FLOAT,
          allowNull: true,
          defaultValue: 0,
          comment: '제어습도',
        },
        timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          comment: '상태 저장 시각',
        }
      },
      {
        sequelize,
        tableName: 'DeviceStatus',
        timestamps: false, // 수동으로 timestamp 저장
      }
    );
  }

  static associate(db) {
    db.DeviceStatus.belongsTo(db.Farm, {
      foreignKey: 'farmId',
      targetKey: 'id',
      as: 'farm',
    });
  }
}

export default DeviceStatus;
