// Sequelize 유틸리티 함수들
export const getOrderBy = (orderby) => {
    if (!orderby) return [['createdAt', 'DESC']];
    
    const orderParts = orderby.split(',');
    return orderParts.map(part => {
    const [field, direction = 'ASC'] = part.trim().split(' ');
    return [field, direction.toUpperCase()];
    });
};