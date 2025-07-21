// Sequelize 유틸리티 함수들
class SequelizeUtil {
    // 정렬 조건 생성
    static getOrderBy(orderby) {
      if (!orderby) return [['createdAt', 'DESC']];
      
      const orderParts = orderby.split(',');
      return orderParts.map(part => {
        const [field, direction = 'ASC'] = part.trim().split(' ');
        return [field, direction.toUpperCase()];
      });
    }
}

export default SequelizeUtil;