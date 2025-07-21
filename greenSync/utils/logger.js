import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

class Logger {
  constructor() {
    this.loggerLevel = process.env.LOGGER_LEVEL || 'info';
    this.logDir = 'log';
    this.logger = null;
    this.init();
  }

  init() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir);
    }

    // log file transport 설정
    const dailyRotateFileTransport = new transports.DailyRotateFile({
      filename: `${this.logDir}/%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      format: format.combine(format.printf(info => `${info.timestamp}[${info.level}] ${info.message}`)),
    });

    // 로거 생성
    this.logger = createLogger({
      level: this.loggerLevel,
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        format.json(),
      ),
      transports: [
        new transports.Console({
          level: this.loggerLevel,
          format: format.combine(
            format.colorize(),
            format.printf(info => `${info.timestamp}[${info.level}] ${info.message}`),
          ),
        }),
        dailyRotateFileTransport,
      ],
    });
  }

  // 로그 레벨별 메서드들
  info(message) {
    this.logger.info(message);
  }

  error(message) {
    this.logger.error(message);
  }

  warn(message) {
    this.logger.warn(message);
  }

  debug(message) {
    this.logger.debug(message);
  }

  verbose(message) {
    this.logger.verbose(message);
  }

  silly(message) {
    this.logger.silly(message);
  }

  // 로그 레벨 동적 변경
  setLevel(level) {
    this.loggerLevel = level;
    this.logger.level = level;
    this.logger.transports.forEach(transport => {
      transport.level = level;
    });
  }

  // 현재 로그 레벨 반환
  getLevel() {
    return this.loggerLevel;
  }

  // 로거 인스턴스 반환 (winston 직접 사용이 필요한 경우)
  getLogger() {
    return this.logger;
  }
}

// 싱글톤 인스턴스 생성 및 export
const loggerInstance = new Logger();
export default loggerInstance;