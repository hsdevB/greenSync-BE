import {Model, DataTypes} from "sequelize";

class Illuminance extends Model {
    static init(sequelize) {
        return super.init(
            {
                illuminance: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    comment: '광량'
                },
            },
            {
                sequelize,
                tableName: 'Illuminance',
                timestamps: true,
            }
        );
    }
    static associate(db) {
        db.Illuminance.belongsTo(db.Farm, { 
            foreignKey: 'farmId',  
            targetKey: 'id',
            as: 'farm' 
        });
    }
}
export default Illuminance;
