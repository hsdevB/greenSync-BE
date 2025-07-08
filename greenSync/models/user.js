import {Model, DataTypes} from "sequelize";

class User extends Model {
    static init(sequelize) {
        return super.init(
            {
                userId: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    comment: '사용자 아이디'
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
                hooks: {
                    beforeCreate: async (user) => {
                        if (user.password) {
                            user.password = await bcrypt.hash(user.password, 10);
                        }
                    }, 
                    beforeUpdate: async (user) => {
                        if (user.changed('password')) {
                            user.password = await bcrypt.hash(user.password, 10);
                        }
                    }
                },
            }
        );
    }
    static associate(db) {
        // 유저와 농장의 관계
        db.User.belongsTo(db.Farm, { 
            foreignKey: 'farmId', 
            as: 'farm' 
        });
    }
}
export default User;    