import {Model, DataTypes} from "sequelize";

class Temperature extends Model {
    static init(sequelize) {
        return super.init(
            {
                temperature: {
                    type: DataTypes.FLOAT,
                    allowNull: false, 
                    comment: '온도'
                },
            },
            {
                sequelize,
                tableName: 'Temperature',
                timestamps: true,
            }
        );
    }
    static associate(db) {
        db.Temperature.belongsTo(db.Farm, { 
            foreignKey: 'farmId',  
            targetKey: 'id',
            as: 'farm' 
        });
    }
}
export default Temperature;
