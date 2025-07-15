import {Model, DataTypes} from "sequelize";

class Nutrient extends Model {
    static init(sequelize) {
        return super.init(
            {
                phLevel: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    comment: '양액 공급 산도'
                },
                elcDT:{
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    comment: '양액 공급 전기전도도'
                }
            },
            {
                sequelize,
                tableName: 'Nutrient',
                timestamps: true,
            }
        );
    }
    static associate(db) {
        db.Nutrient.belongsTo(db.Farm, { 
            foreignKey: 'farmId',   
            targetKey: 'id',
            as: 'farm' 
        });
    }
};
export default Nutrient;