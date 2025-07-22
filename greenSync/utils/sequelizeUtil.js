class SequelizeUtil {
    static getOrderBy(orderby) {
      if (!orderby) return [['createdAt', 'DESC']];
      
      const orderParts = orderby.split(',');
      return orderParts.map(part => {
        const [field, direction = 'ASC'] = part.trim().split(' ');
        return [field, direction.toUpperCase()];
      });
    }
}
export const getOrderBy = SequelizeUtil.getOrderBy;

export default SequelizeUtil;