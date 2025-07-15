import {Model, DataTypes} from "sequelize";

class CarbonDioxide extends Model {
    static init(sequelize) {
        return super.init(
            {
                co2: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    comment: '이산화탄소'
                },
            },
            {
                sequelize,
                tableName: 'CarbonDioxide',
                timestamps: true,
            }
        );
    }
    static associate(db) {
        db.CarbonDioxide.belongsTo(db.Farm, { 
            foreignKey: 'farmId',   
            targetKey: 'id',
            as: 'farm' 
        });
    }
};
export default CarbonDioxide;