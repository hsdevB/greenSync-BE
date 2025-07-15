import {Model, DataTypes} from "sequelize";
import bcrypt from 'bcrypt';

class User extends Model {
    static init(sequelize) {
        return super.init(
            {
                userId: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    comment: '사용자 아이디'
                },
                name :{
                    type: DataTypes.STRING(50),
                    allowNull: true,
                    comment: '사용자 이름'
                },
                password: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                    comment: '패스워드'
                },
                email: {
                    type: DataTypes.STRING(100),
                    allowNull: true,
                    validate: {
                        isEmail: true
                    },
                    comment: '이메일'
                },
                phoneNumber: {
                    type: DataTypes.STRING(100),
                    allowNull: true,
                    comment: '휴대전화번호'
                },
                imgPath :{
                    type: DataTypes.STRING(255),
                    allowNull: true,
                    comment: '프로필 이미지파일 경로'
                }
            },
            {
                sequelize,
                tableName: 'User',
                timestamps: true,
            }
        );
    }
    static associate(db) {
        // 유저와 농장의 관계
        db.User.belongsTo(db.Farm, { 
            foreignKey: 'farmId', 
            targetKey: 'id',
            as: 'farm' 
        });
    }
}
export default User;    