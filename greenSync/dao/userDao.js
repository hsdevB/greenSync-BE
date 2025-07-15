import { Op } from 'sequelize';
// import modelsIndex from '../models/index.js';
import { getOrderBy } from '../utils/sequelizeUtil.js';
import logger from '../utils/logger.js';
// const {db} = modelsIndex;
// const { User, Farm } = db;
import User from '../models/user.js';
import Farm from '../models/farm.js';

class UserDao {
  static async insert(params) {
    try {
      const inserted = await User.create(params);
      return { insertedId: inserted.id };
    } catch (err) {
      logger.error(`userDao.insert error: ${err.message}`);
      throw err;
    }
  }

  static async selectList(params) {
    try {
      const setQuery = {};
      
      // 검색 조건 설정
      if (params.userId) {
        setQuery.where = {
          ...setQuery.where,
          userId: { [Op.eq]: params.userId }
        };
      }
      
      if (params.name) {
        setQuery.where = {
          ...setQuery.where,
          name: { [Op.like]: `%${params.name}%` }
        };
      }
      
      if (params.email) {
        setQuery.where = {
          ...setQuery.where,
          email: { [Op.like]: `%${params.email}%` }
        };
      }
      
      if (params.phoneNumber) {
        setQuery.where = {
          ...setQuery.where,
          phoneNumber: { [Op.like]: `%${params.phoneNumber}%` }
        };
      }

      // 날짜 범위 검색
      if (params.createdAtFrom || params.createdAtTo) {
        if (params.createdAtFrom && params.createdAtTo) {
          setQuery.where = {
            ...setQuery.where,
            createdAt: { [Op.between]: [params.createdAtFrom, params.createdAtTo] }
          };
        } else if (params.createdAtFrom) {
          setQuery.where = {
            ...setQuery.where,
            createdAt: { [Op.gte]: params.createdAtFrom }
          };
        } else if (params.createdAtTo) {
          setQuery.where = {
            ...setQuery.where,
            createdAt: { [Op.lte]: params.createdAtTo }
          };
        }
      }

      // 페이징
      if (params.limit && params.limit > 0) {
        setQuery.limit = parseInt(params.limit);
      }
      
      if (params.offset && params.offset > 0) {
        setQuery.offset = parseInt(params.offset);
      }

      // 정렬
      setQuery.order = getOrderBy(params.orderby);

      const result = await User.findAndCountAll({
        ...setQuery,
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Farm,
            as: 'farm',
            attributes: ['id', 'farmCode',]
          }
        ]
      });
      
      return result;
    } catch (err) {
      logger.error(`userDao.selectList error: ${err.message}`);
      throw err;
    }
  }

  static async selectInfo(params) {
    try {
      const result = await User.findByPk(params.id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Farm,
            as: 'farm',
            attributes: ['id', 'farmCode']
          }
        ]
      });
      return result;
    } catch (err) {
      logger.error(`userDao.selectInfo error: ${err.message}`);
      throw err;
    }
  }

  static async selectUser(params) {
    try {
      const result = await User.findOne({
        attributes: ['id', 'farmId', 'userId', 'password', 'name'],
        where: {
          userId: params.userId
        },
        include: [
          {
            model: Farm,
            as: 'farm',
            attributes: ['id', 'farmCode']
          }
        ]
      });
      return result;
    } catch (err) {
      logger.error(`userDao.selectUser error: ${err.message}`);
      throw err;
    }
  }

  static async update(params) {
    try {
      const [result] = await User.update(params, {
        where: { id: params.id }
      });
      return { updatedCount: result };
    } catch (err) {
      logger.error(`userDao.update error: ${err.message}`);
      throw err;
    }
  }

  static async delete(params) {
    try {
      const result = await User.destroy({
        where: { id: params.id }
      });
      return { deletedCount: result };
    } catch (err) {
      logger.error(`userDao.delete error: ${err.message}`);
      throw err;
    }
  }

  static async checkUserExists(userId) {
    try {
      const count = await User.count({
        where: { userId }
      });
      return count > 0;
    } catch (err) {
      logger.error(`userDao.checkUserExists error: ${err.message}`);
      throw err;
    }
  }
}

export default UserDao;