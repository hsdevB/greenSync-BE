import { Model, DataTypes } from "sequelize";

class Weather extends Model {
    static init(sequelize) {
        return super.init(
            {
                observationTime: {
                    type: DataTypes.STRING(12),
                    allowNull: false,
                    comment: '관측시간 (YYYYMMDDHHMM)'
                },
                windDirection: {
                    type: DataTypes.STRING(20),
                    allowNull: true,
                    comment: '풍향'
                },
                windSpeed: {
                    type: DataTypes.FLOAT,
                    allowNull: true,
                    comment: '풍속'
                },
                outsideTemp: {
                    type: DataTypes.FLOAT,
                    allowNull: true,
                    comment: '외부온도'
                },
                insolation: {
                    type: DataTypes.FLOAT,
                    allowNull: true,
                    defaultValue: 0.0,
                    comment: '일사량'
                },
                isDay: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    comment: '밤낮여부 (1=낮, 0=밤)',
                },
                isRain: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    comment: '강수여부 (1=비옴, 0=안옴)',
                },
                farmId: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    comment: '농장 ID (FK)',
                    references: {
                        model: 'Farm',
                        key: 'id'
                    }
                }
            },
            {
                sequelize,
                tableName: 'Weather',
                timestamps: true
            }
        );
    }

    static associate(db) {
        if (db.Farm) {
            db.Weather.belongsTo(db.Farm, { 
                foreignKey: 'farmId',  
                targetKey: 'id',
                as: 'farm' 
            });
        }
    }
}

export default Weather;
