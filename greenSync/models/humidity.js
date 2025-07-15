import {Model, DataTypes} from "sequelize";

class Humidity extends Model {
    static init(sequelize) {
        return super.init(
            {
                humidity: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    comment: '습도'
                },
            },
            {
                sequelize,
                tableName: 'Humidity',
                timestamps: true,
            }
        );
    }
    static associate(db) {
        db.Humidity.belongsTo(db.Farm, { 
            foreignKey: 'farmId',  
            targetKey: 'id',
            as: 'farm' 
        });
    }
}
export default Humidity;
