import {Model, DataTypes} from "sequelize";

class Weather extends Model {
    static init(sequelize) {
        return super.init(
            {
                isDay: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    comment: '밤낮여부'
                },
                fanIsRain: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    comment: '강수여부'
                },
                windSpeed: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    comment: '풍속'
                },
                windDirection: {
                    type: DataTypes.STRING(20),
                    allowNull: false,
                    comment: '풍향'
                },
                outsideTemp: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    comment: '외부온도'
                },
                insolation: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    comment: '일사량'
                },
            },
            {
                sequelize,
                tableName: 'Weather',
                timestamps: true,
            }
        );
    }
    static associate(db) {
        db.Weather.belongsTo(db.Farm, { 
            foreignKey: 'farmId',  
            targetKey: 'id',
            as: 'farm' 
        });
    }
};
export default Weather;