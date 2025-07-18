import Weather from '../models/weather.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

class WeatherDao {
    static async saveWeatherData(weatherData) {
        try {
            if (!weatherData || typeof weatherData !== 'object') {
                logger.error('WeatherDao.saveWeatherData: 유효하지 않은 날씨 데이터입니다.');
                throw new Error('유효하지 않은 날씨 데이터입니다.');
            }

            const { cityName = '알 수 없는 도시', error, ...dbFields } = weatherData;
            
            if (error) {
                logger.warn(`WeatherDao.saveWeatherData: 날씨 데이터 저장 생략 - 에러: ${error}, 도시: ${cityName}`);
                return { success: false, error, cityName };
            }

            const cleanData = {
                observationTime: dbFields.observationTime,
                windDirection: this.toString(dbFields.windDirection),
                windSpeed: this.toNumber(dbFields.windSpeed),
                outsideTemp: this.toNumber(dbFields.outsideTemp),
                insolation: this.toNumber(dbFields.insolation, 0.0),
                isDay: Boolean(dbFields.isDay),
                isRain: Boolean(dbFields.isRain),
                farmId: dbFields.farmId || null
            };

            if (!cleanData.observationTime) {
                logger.error('WeatherDao.saveWeatherData: 관측시간이 필요합니다.');
                throw new Error('관측시간이 필요합니다.');
            }

            const inserted = await Weather.create(cleanData);
            logger.info(`WeatherDao.saveWeatherData: 날씨 데이터 저장 완료 - ID: ${inserted.id}, 관측시간: ${cleanData.observationTime}, 도시: ${cityName}`);
            return { 
                success: true, 
                insertedId: inserted.id, 
                cityName,
                data: {
                    observationTime: cleanData.observationTime,
                    isDay: cleanData.isDay,
                    isRain: cleanData.isRain,
                    outsideTemp: cleanData.outsideTemp
                }
            };
        } catch (err) {
            if (err.message.includes('유효하지 않은 날씨 데이터') || 
                err.message.includes('관측시간이 필요합니다')) {
                throw err;
            }
            logger.error(`WeatherDao.saveWeatherData: 날씨 데이터 저장 실패 - 에러: ${err.message}`);
            throw new Error(`날씨 데이터 저장에 실패했습니다: ${err.message}`);
        }
    }

    static async getWeatherData(params = {}) {
        try {
            if (!params || typeof params !== 'object') {
                logger.error('WeatherDao.getWeatherData: 검색 파라미터가 제공되지 않았습니다.');
                throw new Error('검색 파라미터가 필요합니다.');
            }

            // limit, offset 유효성 검사
            if (params.limit !== undefined && (typeof params.limit !== 'number' || params.limit < 0)) {
                logger.error(`WeatherDao.getWeatherData: 유효하지 않은 limit 값: ${params.limit}`);
                throw new Error('limit은 0 이상의 숫자여야 합니다.');
            }

            if (params.offset !== undefined && (typeof params.offset !== 'number' || params.offset < 0)) {
                logger.error(`WeatherDao.getWeatherData: 유효하지 않은 offset 값: ${params.offset}`);
                throw new Error('offset은 0 이상의 숫자여야 합니다.');
            }

            const whereClause = {};
            
            if (params.observationTime) {
                whereClause.observationTime = params.observationTime;
            }
            
            if (params.isDay !== undefined) {
                whereClause.isDay = Boolean(params.isDay);
            }
            
            if (params.isRain !== undefined) {
                whereClause.isRain = Boolean(params.isRain);
            }

            if (params.minTemp !== undefined) {
                whereClause.outsideTemp = { ...whereClause.outsideTemp, [Op.gte]: params.minTemp };
            }
            
            if (params.maxTemp !== undefined) {
                whereClause.outsideTemp = { ...whereClause.outsideTemp, [Op.lte]: params.maxTemp };
            }

            if (params.startDate && params.endDate) {
                whereClause.observationTime = {
                    [Op.between]: [params.startDate, params.endDate]
                };
            }

            const result = await Weather.findAll({
                where: whereClause,
                order: [['observationTime', 'DESC']],
                limit: params.limit || 100,
                offset: params.offset || 0,
                include: params.includeFarm ? [{
                    model: Weather.sequelize.models.Farm,
                    as: 'farm',
                    attributes: ['id', 'name', 'location']
                }] : []
            });

            logger.info(`WeatherDao.getWeatherData: 날씨 데이터 조회 완료 - 조회된 레코드 수: ${result.length}`);
            return result;
            
        } catch (err) {
            if (err.message.includes('검색 파라미터가 필요합니다') || 
                err.message.includes('limit은 0 이상의 숫자여야 합니다') || 
                err.message.includes('offset은 0 이상의 숫자여야 합니다')) {
                throw err;
            }
            logger.error(`WeatherDao.getWeatherData: 날씨 데이터 조회 실패 - 에러: ${err.message}`);
            throw new Error(`날씨 데이터 조회에 실패했습니다: ${err.message}`);
        }
    }

    static async getLatestWeatherData(farmId = null) {
        try {
            if (farmId !== null && (typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0)) {
                logger.error(`WeatherDao.getLatestWeatherData: 유효하지 않은 농장ID: ${farmId}`);
                throw new Error('유효한 농장ID가 필요합니다.');
            }

            const whereClause = {};
            if (farmId) {
                whereClause.farmId = farmId;
            }

            const result = await Weather.findOne({
                where: whereClause,
                order: [['observationTime', 'DESC']],
                include: [{
                    model: Weather.sequelize.models.Farm,
                    as: 'farm',
                    attributes: ['id', 'name', 'location'],
                    required: false
                }]
            });

            if (result) {
                logger.info(`WeatherDao.getLatestWeatherData: 최근 날씨 데이터 조회 완료 - 관측시간: ${result.observationTime}, 농장ID: ${farmId || '전체'}`);
            } else {
                logger.info(`WeatherDao.getLatestWeatherData: 최근 날씨 데이터를 찾을 수 없음 - 농장ID: ${farmId || '전체'}`);
            }

            return result;
            
        } catch (err) {
            if (err.message.includes('유효한 농장ID가 필요합니다')) {
                throw err;
            }
            logger.error(`WeatherDao.getLatestWeatherData: 최근 날씨 데이터 조회 실패 - 농장ID: ${farmId}, 에러: ${err.message}`);
            throw new Error(`최근 날씨 데이터 조회에 실패했습니다: ${err.message}`);
        }
    }

    static async getWeatherStats(farmId, startDate, endDate) {
        try {
            if (farmId !== null && farmId !== undefined && (typeof farmId !== 'number' || isNaN(farmId) || farmId <= 0)) {
                logger.error(`WeatherDao.getWeatherStats: 유효하지 않은 농장ID: ${farmId}`);
                throw new Error('유효한 농장ID가 필요합니다.');
            }

            if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
                logger.error(`WeatherDao.getWeatherStats: 시작일이 종료일보다 늦습니다 - 시작일: ${startDate}, 종료일: ${endDate}`);
                throw new Error('시작일은 종료일보다 이전이어야 합니다.');
            }

            const { fn, col } = Weather.sequelize;
            
            const whereClause = {};
            if (farmId) whereClause.farmId = farmId;
            if (startDate && endDate) {
                whereClause.observationTime = {
                    [Op.between]: [startDate, endDate]
                };
            }

            const stats = await Weather.findOne({
                where: whereClause,
                attributes: [
                    [fn('AVG', col('outsideTemp')), 'avgTemp'],
                    [fn('MAX', col('outsideTemp')), 'maxTemp'],
                    [fn('MIN', col('outsideTemp')), 'minTemp'],
                    [fn('AVG', col('windSpeed')), 'avgWindSpeed'],
                    [fn('MAX', col('windSpeed')), 'maxWindSpeed'],
                    [fn('SUM', col('insolation')), 'totalInsolation'],
                    [fn('COUNT', col('id')), 'totalRecords']
                ],
                raw: true
            });

            const dayNightStats = await Weather.findAll({
                where: whereClause,
                attributes: [
                    'isDay',
                    [fn('COUNT', col('id')), 'count']
                ],
                group: ['isDay'],
                raw: true
            });

            const rainStats = await Weather.findAll({
                where: whereClause,
                attributes: [
                    'isRain',
                    [fn('COUNT', col('id')), 'count']
                ],
                group: ['isRain'],
                raw: true
            });

            logger.info(`WeatherDao.getWeatherStats: 날씨 통계 조회 완료 - 농장ID: ${farmId || '전체'}, 기간: ${startDate || '전체'} ~ ${endDate || '전체'}`);
            return {
                temperature: stats,
                dayNight: dayNightStats,
                rain: rainStats
            };
            
        } catch (err) {
            if (err.message.includes('유효한 농장ID가 필요합니다') || 
                err.message.includes('시작일은 종료일보다 이전이어야 합니다')) {
                throw err;
            }
            logger.error(`WeatherDao.getWeatherStats: 날씨 통계 조회 실패 - 농장ID: ${farmId}, 에러: ${err.message}`);
            throw new Error(`날씨 통계 조회에 실패했습니다: ${err.message}`);
        }
    }

    static async deleteWeatherData(conditions) {
        try {
            if (!conditions || typeof conditions !== 'object') {
                logger.error('WeatherDao.deleteWeatherData: 삭제 조건이 제공되지 않았습니다.');
                throw new Error('삭제 조건이 필요합니다.');
            }

            const deletedCount = await Weather.destroy({
                where: conditions
            });

            logger.info(`WeatherDao.deleteWeatherData: 날씨 데이터 삭제 완료 - 삭제된 레코드 수: ${deletedCount}`);
            return deletedCount;
            
        } catch (err) {
            if (err.message.includes('삭제 조건이 필요합니다')) {
                throw err;
            }
            logger.error(`WeatherDao.deleteWeatherData: 날씨 데이터 삭제 실패 - 에러: ${err.message}`);
            throw new Error(`날씨 데이터 삭제에 실패했습니다: ${err.message}`);
        }
    }

    static async toNumber(value, defaultValue = 0) {
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
    }

    static async toBoolean(value) {
        return Boolean(value);
    }
    
    static async toString(value) {
      return value === null || value === undefined ? null : String(value);
    }

    static async validateWeatherData(data) {
        try {
            if (!data || typeof data !== 'object') {
                logger.error('WeatherDao.validateWeatherData: 검증할 날씨 데이터가 제공되지 않았습니다.');
                throw new Error('검증할 날씨 데이터가 필요합니다.');
            }

            const errors = [];
            if (!data.observationTime) {
                errors.push('observationTime은 필수 필드입니다.');
            } else if (!/^\d{12}$/.test(data.observationTime)) {
                errors.push('observationTime은 YYYYMMDDHHMM 형식이어야 합니다.');
            }

            if (typeof data.isDay !== 'boolean') {
                errors.push('isDay는 Boolean 값이어야 합니다.');
            }

            if (typeof data.isRain !== 'boolean') {
                errors.push('isRain는 Boolean 값이어야 합니다.');
            }

            if (data.outsideTemp !== undefined && (data.outsideTemp < -50 || data.outsideTemp > 60)) {
                errors.push('온도 값이 유효하지 않습니다. (-50°C ~ 60°C)');
            }

            if (data.windSpeed !== undefined && data.windSpeed < 0) {
                errors.push('풍속 값이 유효하지 않습니다. (0 이상)');
            }

            if (data.windDirection !== undefined && (data.windDirection < 0 || data.windDirection > 360)) {
                errors.push('풍향 값이 유효하지 않습니다. (0° ~ 360°)');
            }

            if (data.insolation !== undefined && data.insolation < 0) {
                errors.push('일사량 값이 유효하지 않습니다. (0 이상)');
            }

            const isValid = errors.length === 0;
            if (!isValid) {
                logger.warn(`WeatherDao.validateWeatherData: 날씨 데이터 검증 실패 - 에러: ${errors.join(', ')}`);
            } else {
                logger.info('WeatherDao.validateWeatherData: 날씨 데이터 검증 완료');
            }

            return {
                isValid,
                errors
            };
        } catch (err) {
            if (err.message.includes('검증할 날씨 데이터가 필요합니다')) {
                throw err;
            }
            logger.error(`WeatherDao.validateWeatherData: 날씨 데이터 검증 중 오류 발생 - 에러: ${err.message}`);
            throw new Error(`날씨 데이터 검증 중 오류가 발생했습니다: ${err.message}`);
        }
    }
}

export default WeatherDao;