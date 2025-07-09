import {Model, DataTypes} from "sequelize";

class Optimization extends Model {
    static init(sequelize) {
        return super.init(
            {
                heating: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    comment: '난방'
                },
                fan: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    comment: '배기'
                },
                waterSupply: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    comment: '급수량'
                },
            },
            {
                sequelize,
                tableName: 'Optimization',
                timestamps: true,
            }
        );
    }
    static associate(db) {
        db.Optimization.belongsTo(db.Farm, { 
            foreignKey: 'farmId',  
            targetKey: 'farmCode',
            as: 'farm' 
        });
    }
};
export default Optimization;    