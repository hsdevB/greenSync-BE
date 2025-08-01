import Weather from '../models/weather.js';
import { Op } from 'sequelize';
import Logger from '../utils/logger.js';

class WeatherDao {
    static async saveWeatherData(weatherData) {
        try {
            if (!weatherData || typeof weatherData !== 'object') {
                Logger.error('WeatherDao.saveWeatherData: 유효하지 않은 날씨 데이터입니다. (데이터가 null 또는 객체가 아님)');
                throw new Error('유효하지 않은 날씨 데이터입니다.');
            }

            const { cityName = '알 수 없는 도시', error, ...dbFields } = weatherData;
            
            if (error) {
                Logger.warn('WeatherDao.saveWeatherData: 날씨 데이터 저장 생략 - 서비스 계층 에러: ' + error + ', 도시: ' + cityName);
                return { success: false, error, cityName };
            }

            const cleanData = {
                observationTime: dbFields.observationTime,
                windDirection: this.toNumber(dbFields.windDirection), 
                windSpeed: this.toNumber(dbFields.windSpeed),
                outsideTemp: this.toNumber(dbFields.outsideTemp),
                insolation: this.toNumber(dbFields.insolation, 0.0),
                dewPoint: this.toNumber(dbFields.dewPoint),
                isDay: Boolean(dbFields.isDay),
                isRain: Boolean(dbFields.isRain),
            };

            // 각 필드별 유효성 검사 (함수 호출 대신 인라인으로)
            const errors = [];

            if (typeof cleanData.observationTime !== 'string' || cleanData.observationTime.length !== 12 || !/^\d{12}$/.test(cleanData.observationTime)) {
                errors.push('observationTime은 YYYYMMDDHHMM 형식의 12자리 숫자 문자열이어야 합니다.');
            }

            if (cleanData.windDirection !== null && cleanData.windDirection !== undefined) {
                if (typeof cleanData.windDirection !== 'number' || isNaN(cleanData.windDirection) || cleanData.windDirection < 0 || cleanData.windDirection > 360) {
                    errors.push('풍향(windDirection)은 0~360 사이의 숫자여야 합니다.');
                }
            }

            if (cleanData.windSpeed !== null && cleanData.windSpeed !== undefined) {
                if (typeof cleanData.windSpeed !== 'number' || isNaN(cleanData.windSpeed) || cleanData.windSpeed < 0) {
                    errors.push('풍속(windSpeed)은 0 이상의 숫자여야 합니다.');
                }
            }

            if (cleanData.outsideTemp !== null && cleanData.outsideTemp !== undefined) {
                if (typeof cleanData.outsideTemp !== 'number' || isNaN(cleanData.outsideTemp) || cleanData.outsideTemp < -50 || cleanData.outsideTemp > 60) {
                    errors.push('외부온도(outsideTemp)는 -50°C ~ 60°C 사이의 숫자여야 합니다.');
                }
            }

            if (cleanData.insolation !== null && cleanData.insolation !== undefined) {
                if (typeof cleanData.insolation !== 'number' || isNaN(cleanData.insolation) || cleanData.insolation < 0) {
                    errors.push('일사량(insolation)은 0 이상의 숫자여야 합니다.');
                }
            }

            if (cleanData.dewPoint !== null && cleanData.dewPoint !== undefined) {
                if (typeof cleanData.dewPoint !== 'number' || isNaN(cleanData.dewPoint)) {
                    errors.push('이슬점 온도(dewPoint)는 숫자여야 합니다.');
                }
            }

            if (typeof cleanData.isDay !== 'boolean') {
                errors.push('밤낮 여부(isDay)는 true 또는 false 값이어야 합니다.');
            }

            if (typeof cleanData.isRain !== 'boolean') {
                errors.push('강수 여부(isRain)는 true 또는 false 값이어야 합니다.');
            }

            if (errors.length > 0) {
                Logger.error('WeatherDao.saveWeatherData: 저장 전 데이터 유효성 검사 실패 - ' + errors.join(', '));
                throw new Error('날씨 데이터 유효성 검사 실패: ' + errors.join(', '));
            }

            const weather = await Weather.create(cleanData);
            return { success: true, weatherId: weather.id };

        } catch (err) {
            Logger.error('WeatherDao.saveWeatherData: 날씨 데이터 저장 중 오류 발생 - ' + err.message);
            return { success: false, error: err.message };
        }
    }

    static toNumber(value, defaultValue = NaN) {
        if (value === null || value === undefined || value === '') {
            return defaultValue;
        }
        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : num;
    }

    static async getWeatherData(weatherId) {
        try {
            if (isNaN(weatherId) || parseInt(weatherId) <= 0) {
                Logger.error('WeatherDao.getWeatherData: 유효하지 않은 weatherId - ' + weatherId);
                throw new Error('유효한 날씨 ID가 필요합니다.');
            }
            const weather = await Weather.findByPk(weatherId);
            if (!weather) {
                Logger.warn('WeatherDao.getWeatherData: 날씨 데이터를 찾을 수 없습니다 - ID: ' + weatherId);
            } else {
                Logger.info('WeatherDao.getWeatherData: 날씨 데이터 조회 성공 - ID: ' + weatherId);
            }
            return weather ? weather.toJSON() : null;
        } catch (err) {
            Logger.error('WeatherDao.getWeatherData: 날씨 데이터 조회 중 오류 발생 - ID: ' + weatherId + ', 에러: ' + err.message);
            throw err;
        }
    }

    static async getLatestWeatherData() {
        try {
            const queryOptions = {
                order: [['observationTime', 'DESC']],
                limit: 1
            };
            
            const weather = await Weather.findOne(queryOptions);
            if (!weather) {
                Logger.warn('WeatherDao.getLatestWeatherData: 최신 날씨 데이터를 찾을 수 없습니다.');
            } else {
                Logger.info('WeatherDao.getLatestWeatherData: 최신 날씨 데이터 조회 성공 - 시간: ' + weather.observationTime);
            }
            return weather ? weather.toJSON() : null;
        } catch (err) {
            Logger.error('WeatherDao.getLatestWeatherData: 최신 날씨 데이터 조회 중 오류 발생 - 에러: ' + err.message);
            throw err;
        }
    }

    static async getWeatherStats(period = '24h') {
        try {
            const now = new Date();
            let startDate;

            switch (period) {
                case '24h':
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    Logger.warn('WeatherDao.getWeatherStats: 지원하지 않는 기간 - ' + period + '. 기본값 \'24h\' 사용.');
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            }

            const startObservationTime = startDate.getFullYear() +
                String(startDate.getMonth() + 1).padStart(2, '0') +
                String(startDate.getDate()).padStart(2, '0') +
                String(startDate.getHours()).padStart(2, '0') +
                String(startDate.getMinutes()).padStart(2, '0');

            const whereClause = {
                observationTime: {
                    [Op.gte]: startObservationTime
                }
            };

            Logger.info('WeatherDao.getWeatherStats: 전체 농장의 ' + period + ' 날씨 통계 조회');

            const stats = await Weather.findAll({
                where: whereClause,
                attributes: [
                    [Weather.sequelize.fn('AVG', Weather.sequelize.col('outsideTemp')), 'avgTemp'],
                    [Weather.sequelize.fn('MIN', Weather.sequelize.col('outsideTemp')), 'minTemp'],
                    [Weather.sequelize.fn('MAX', Weather.sequelize.col('outsideTemp')), 'maxTemp'],
                    [Weather.sequelize.fn('AVG', Weather.sequelize.col('windSpeed')), 'avgWindSpeed'],
                    [Weather.sequelize.fn('SUM', Weather.sequelize.col('insolation')), 'totalInsolation'],
                    [Weather.sequelize.fn('AVG', Weather.sequelize.col('dewPoint')), 'avgDewPoint'],
                    [Weather.sequelize.fn('SUM', Weather.sequelize.literal('CASE WHEN "isRain" = TRUE THEN 1 ELSE 0 END')), 'rainCount'],
                    [Weather.sequelize.fn('COUNT', Weather.sequelize.col('id')), 'recordCount']
                ],
                raw: true
            });

            if (!stats || stats.length === 0 || stats[0].recordCount === null) {
                Logger.warn(period + ' 동안의 날씨 통계를 찾을 수 없습니다.');
                return null;
            }

            return stats[0];
        } catch (err) {
            Logger.error('WeatherDao.getWeatherStats: 날씨 통계 조회 중 오류 발생 - 에러: ' + err.message);
            throw err;
        }
    }

    static async deleteWeatherData(weatherId) {
        try {
            if (isNaN(weatherId) || parseInt(weatherId) <= 0) {
                Logger.error('WeatherDao.deleteWeatherData: 유효하지 않은 weatherId - ' + weatherId);
                throw new Error('유효한 날씨 ID가 필요합니다.');
            }
            const deletedRows = await Weather.destroy({
                where: { id: weatherId }
            });
            if (deletedRows > 0) {
                return true;
            } else {
                Logger.warn('WeatherDao.deleteWeatherData: 삭제할 날씨 데이터를 찾을 수 없습니다 - ID: ' + weatherId);
                return false;
            }
        } catch (err) {
            Logger.error('WeatherDao.deleteWeatherData: 날씨 데이터 삭제 중 오류 발생 - ID: ' + weatherId + ', 에러: ' + err.message);
            throw err;
        }
    }
}

export default WeatherDao;