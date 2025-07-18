import Weather from '../models/weather.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

class WeatherDao {
    static async saveWeatherData(weatherData) {
        try {
            if (!weatherData || typeof weatherData !== 'object') {
                throw new Error('유효하지 않은 날씨 데이터입니다.');
            }

            const { cityName = '알 수 없는 도시', error, ...dbFields } = weatherData;
            
            if (error) {
                logger.warn(`날씨 데이터 저장 생략 - 에러: ${error}, 도시: ${cityName}`);
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
                throw new Error('관측시간이 필요합니다.');
            }

            const inserted = await Weather.create(cleanData);
            logger.info(`✅ 서울 날씨 데이터 저장 성공:(${cleanData.observationTime})`);
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
            logger.error(`❌ 날씨 데이터 저장 실패: ${err.message}`);
            throw err;
        }
    }

    static async getWeatherData(params = {}) {
        try {
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

            logger.info(`🔍 날씨 데이터 조회 완료: ${result.length}건`);
            return result;
            
        } catch (err) {
            logger.error(`❌ 날씨 데이터 조회 실패: ${err.message}`);
            throw err;
        }
    }

    static async getLatestWeatherData(farmId = null) {
        try {
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
                logger.info(`📊 최근 날씨 데이터 조회 성공: ${result.observationTime}`);
            }

            return result;
            
        } catch (err) {
            logger.error(`❌ 최근 날씨 데이터 조회 실패: ${err.message}`);
            throw err;
        }
    }

    static async getWeatherStats(farmId, startDate, endDate) {
        try {
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

            return {
                temperature: stats,
                dayNight: dayNightStats,
                rain: rainStats
            };
            
        } catch (err) {
            logger.error(`❌ 날씨 통계 조회 실패: ${err.message}`);
            throw err;
        }
    }

    static async deleteWeatherData(conditions) {
        try {
            const deletedCount = await Weather.destroy({
                where: conditions
            });

            logger.info(`🗑️ 날씨 데이터 삭제 완료: ${deletedCount}건`);
            return deletedCount;
            
        } catch (err) {
            logger.error(`❌ 날씨 데이터 삭제 실패: ${err.message}`);
            throw err;
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

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

export default WeatherDao;