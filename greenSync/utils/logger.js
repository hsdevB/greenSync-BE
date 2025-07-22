import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

class Logger {
  static loggerLevel = process.env.LOGGER_LEVEL || 'info';
  static logDir = 'log';
  static logger = null;

  static init() {
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
  static info(message) {
    if (!this.logger) {
      this.init();
    }
    this.logger.info(message);
  }

  static error(message) {
    if (!this.logger) {
      this.init();
    }
    this.logger.error(message);
  }

  static warn(message) {
    if (!this.logger) {
      this.init();
    }
    this.logger.warn(message);
  }

  static debug(message) {
    if (!this.logger) {
      this.init();
    }
    this.logger.debug(message);
  }

  static verbose(message) {
    if (!this.logger) {
      this.init();
    }
    this.logger.verbose(message);
  }

  static silly(message) {
    if (!this.logger) {
      this.init();
    }
    this.logger.silly(message);
  }

  // 로그 레벨 동적 변경
  static setLevel(level) {
    this.loggerLevel = level;
    if (this.logger) {
      this.logger.level = level;
      this.logger.transports.forEach(transport => {
        transport.level = level;
      });
    }
  }

  // 현재 로그 레벨 반환
  static getLevel() {
    return this.loggerLevel;
  }

  // 로거 인스턴스 반환 (winston 직접 사용이 필요한 경우)
  static getLogger() {
    if (!this.logger) {
      this.init();
    }
    return this.logger;
  }
}

export default Logger;