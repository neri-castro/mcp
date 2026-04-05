import pino from 'pino';
import { config } from '../config/config.js';

export const logger = pino({
  level: config.logLevel,
  transport:
    config.logFormat === 'pretty'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});
