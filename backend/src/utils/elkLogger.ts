// Save as ./backend/src/utils/elkLogger.ts

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  service: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

class ELKLogger {
  private logstashUrl: string;
  private serviceName: string;
  private isInitialized: boolean = false;
  private logstashUser?: string;
  private logstashPassword?: string;

  constructor(logstashUrl: string = 'https://logstash:5001', serviceName: string = 'ft_transcendence') {
    this.logstashUrl = logstashUrl;
    this.serviceName = serviceName;
    this.logstashUser = process.env.LOGSTASH_USER;
    this.logstashPassword = process.env.LOGSTASH_PASSWORD;

    setTimeout(() => {
      this.isInitialized = true;
      if (!this.logstashUser || !this.logstashPassword) {
        console.warn('[ELK Logger] Warning: LOGSTASH_USER or LOGSTASH_PASSWORD not set. Logs will not be sent to ELK.');
      }
    }, 10000); // 10 second delay
  }

  private async sendLog(entry: LogEntry, retries = 3, delay = 1000): Promise<void> {
    if (!this.isInitialized || !this.logstashUser || !this.logstashPassword) {
      if (!this.isInitialized) {
        console.log(`[ELK Logger] Skipping log during initialization: ${entry.message}`);
      }
      return;
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      const credentials = Buffer.from(`${this.logstashUser}:${this.logstashPassword}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;

      const response = await fetch(this.logstashUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        console.error(`Failed to send log to ELK: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (retries > 0) {
        await new Promise(res => setTimeout(res, delay));
        return this.sendLog(entry, retries - 1, delay * 2);
      }
      console.error('ELK Logger error:', error);
    }
  }

  private createLogEntry(level: LogEntry['level'], message: string, metadata?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      metadata,
    };
  }

  async info(message: string, metadata?: Record<string, any>): Promise<void> {
    console.log(`[INFO] ${message}`, metadata);
    this.sendLog(this.createLogEntry('info', message, metadata)).catch(error => {
      console.error('ELK Logger error:', error);
    });
  }

  async warn(message: string, metadata?: Record<string, any>): Promise<void> {
    console.warn(`[WARN] ${message}`, metadata);
    this.sendLog(this.createLogEntry('warn', message, metadata)).catch(error => {
      console.error('ELK Logger error:', error);
    });
  }

  async error(message: string, metadata?: Record<string, any>): Promise<void> {
    console.error(`[ERROR] ${message}`, metadata);
    this.sendLog(this.createLogEntry('error', message, metadata)).catch(error => {
      console.error('ELK Logger error:', error);
    });
  }

  async debug(message: string, metadata?: Record<string, any>): Promise<void> {
    console.debug(`[DEBUG] ${message}`, metadata);
    this.sendLog(this.createLogEntry('debug', message, metadata)).catch(error => {
      console.error('ELK Logger error:', error);
    });
  }
}

export const elkLogger = new ELKLogger();