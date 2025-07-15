import {Model, DataTypes} from "sequelize";

class Farm extends Model {
    static init(sequelize) {
        return super.init(
            {
                farmCode: {
                    type: DataTypes.STRING(10),
                    allowNull: false,
                    comment: '농장코드',
                    // unique: true
                },
                farmType: {
                    type: DataTypes.STRING(20),
                    allowNull: true,
                    comment: '재배방식'
                },
                houseType: {
                    type: DataTypes.STRING(20),
                    allowNull: true,
                    comment: '농장외관'
                },
            },
            {
                sequelize,
                tableName: 'Farm',
                timestamps: true,
                paranoid: true,
            }
        );
    }
    static associate(db) {
        // 농장과 유저와의 관계
        db.Farm.hasMany(db.User, { 
            foreignKey: 'farmId', 
            sourceKey: 'id',
            as: 'users'  
        });
        // 농장과 센서 데이터들과의 관계
        db.Farm.hasMany(db.Humidity, {
            foreignKey: 'farmId',
            sourceKey: 'id',
            as: 'humidities'
        });
        db.Farm.hasMany(db.Temperature, {
            foreignKey: 'farmId',
            sourceKey: 'id',
            as: 'temperatures'
        });
        db.Farm.hasMany(db.CarbonDioxide, {
            foreignKey: 'farmId',
            sourceKey: 'id',
            as: 'carbonDioxides'
        });
        db.Farm.hasMany(db.Nutrient, {
            foreignKey: 'farmId',
            sourceKey: 'id',
            as: 'nutrients'
        });
        db.Farm.hasMany(db.Weather, {
            foreignKey: 'farmId',
            sourceKey: 'id',
            as: 'weathers'
        });
        db.Farm.hasMany(db.Optimization, {
            foreignKey: 'farmId',
            sourceKey: 'id',
            as: 'optimizations'
        });
    }
}

export default Farm;