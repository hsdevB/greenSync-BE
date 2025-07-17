import Weather from '../models/weather.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

/**
 * 🗄️ 날씨 데이터 액세스 객체
 * - 간단하고 직관적인 데이터 처리
 * - BOOLEAN 타입 완전 지원
 * - 초보자 친화적 구조
 */
class WeatherDao {
    
    /**
     * 🎯 날씨 데이터 저장 (메인 메서드)
     * @param {Object} weatherData - 날씨 데이터 객체
     * @returns {Object} 저장 결과
     */
    static async saveWeatherData(weatherData) {
        try {
            // 입력값 검증
            if (!weatherData || typeof weatherData !== 'object') {
                throw new Error('유효하지 않은 날씨 데이터입니다.');
            }

            const { cityName = '알 수 없는 도시', error, ...dbFields } = weatherData;
            
            // 에러가 있는 데이터는 저장하지 않음
            if (error) {
                logger.warn(`날씨 데이터 저장 생략 - 에러: ${error}, 도시: ${cityName}`);
                return { success: false, error, cityName };
            }

            // 🎯 깔끔한 데이터 정리 (Boolean 값 그대로 유지)
            const cleanData = {
                observationTime: dbFields.observationTime,
                // stationNumber: dbFields.stationNumber, // 제거
                windDirection: this.toString(dbFields.windDirection),
                windSpeed: this.toNumber(dbFields.windSpeed),
                outsideTemp: this.toNumber(dbFields.outsideTemp),
                // humidity: this.toNumber(dbFields.humidity), // 제거
                insolation: this.toNumber(dbFields.insolation, 0.0),
                isDay: Boolean(dbFields.isDay),      // 🎯 Boolean 타입 그대로
                isRain: Boolean(dbFields.isRain),    // 🎯 Boolean 타입 그대로
                farmId: dbFields.farmId || null
            };

            // 필수 필드 검증
            if (!cleanData.observationTime) {
                throw new Error('관측시간이 필요합니다.');
            }

            // DB에 저장
            const inserted = await Weather.create(cleanData);
            
            logger.info(`✅ 날씨 데이터 저장 성공: ${cityName} (${cleanData.observationTime})`);
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

    /**
     * 🎯 날씨 데이터 조회 (조건부 검색)
     * @param {Object} params - 검색 조건
     * @returns {Array} 검색 결과
     */
    static async getWeatherData(params = {}) {
        try {
            const whereClause = {};
            
            // 🔍 검색 조건 설정
            // if (params.stationNumber) { // 제거
            //     whereClause.stationNumber = params.stationNumber;
            // }
            
            if (params.observationTime) {
                whereClause.observationTime = params.observationTime;
            }
            
            // 🎯 Boolean 값으로 직접 검색
            if (params.isDay !== undefined) {
                whereClause.isDay = Boolean(params.isDay);
            }
            
            if (params.isRain !== undefined) {
                whereClause.isRain = Boolean(params.isRain);
            }

            // 온도 범위 검색
            if (params.minTemp !== undefined) {
                whereClause.outsideTemp = { ...whereClause.outsideTemp, [Op.gte]: params.minTemp };
            }
            
            if (params.maxTemp !== undefined) {
                whereClause.outsideTemp = { ...whereClause.outsideTemp, [Op.lte]: params.maxTemp };
            }

            // 날짜 범위 검색
            if (params.startDate && params.endDate) {
                whereClause.observationTime = {
                    [Op.between]: [params.startDate, params.endDate]
                };
            }

            // 조회 실행
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

    /**
     * 🎯 최근 날씨 데이터 조회 (편의 메서드)
     * @param {number} farmId - 농장 ID
     * @returns {Object} 최근 날씨 데이터
     */
    static async getLatestWeatherData(farmId = null) {
        try {
            const whereClause = {};
            if (farmId) {
                whereClause.farmId = farmId;
            }

            const result = await Weather.findOne({
                where: whereClause,
                order: [['observationTime', 'DESC']],  // 최신 관측시간 우선
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

    /**
     * 🎯 날씨 통계 조회 (ERD 매칭)
     * @param {number} farmId - 농장 ID
     * @param {string} startDate - 시작 관측시간 (YYYYMMDDHHMM)
     * @param {string} endDate - 종료 관측시간 (YYYYMMDDHHMM)
     * @returns {Object} 통계 데이터
     */
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

            // 낮/밤 데이터 개수
            const dayNightStats = await Weather.findAll({
                where: whereClause,
                attributes: [
                    'isDay',
                    [fn('COUNT', col('id')), 'count']
                ],
                group: ['isDay'],
                raw: true
            });

            // 강수 데이터 개수
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

    /**
     * 🎯 날씨 데이터 삭제
     * @param {Object} conditions - 삭제 조건
     * @returns {number} 삭제된 레코드 수
     */
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

    /**
     * 🎯 데이터 타입 변환 헬퍼 함수들
     */
    static toNumber(value, defaultValue = 0) {
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
    }

    static toBoolean(value) {
        return Boolean(value);
    }
    
    static toString(value) {
      return value === null || value === undefined ? null : String(value);
    }

    /**
     * 🎯 날씨 데이터 유효성 검사 (ERD 매칭)
     */
    static validateWeatherData(data) {
        const errors = [];

        // 필수 필드 검증
        if (!data.observationTime) {
            errors.push('observationTime은 필수 필드입니다.');
        } else if (!/^\d{12}$/.test(data.observationTime)) {
            errors.push('observationTime은 YYYYMMDDHHMM 형식이어야 합니다.');
        }

        // Boolean 필드 검증
        if (typeof data.isDay !== 'boolean') {
            errors.push('isDay는 Boolean 값이어야 합니다.');
        }

        if (typeof data.isRain !== 'boolean') {
            errors.push('isRain는 Boolean 값이어야 합니다.');
        }

        // 온도 범위 검증
        if (data.outsideTemp !== undefined && (data.outsideTemp < -50 || data.outsideTemp > 60)) {
            errors.push('온도 값이 유효하지 않습니다. (-50°C ~ 60°C)');
        }

        // 풍속 검증
        if (data.windSpeed !== undefined && data.windSpeed < 0) {
            errors.push('풍속 값이 유효하지 않습니다. (0 이상)');
        }

        // 풍향 검증
        if (data.windDirection !== undefined && (data.windDirection < 0 || data.windDirection > 360)) {
            errors.push('풍향 값이 유효하지 않습니다. (0° ~ 360°)');
        }

        // 일사량 검증
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