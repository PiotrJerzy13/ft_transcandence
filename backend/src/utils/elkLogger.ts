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

  constructor(logstashUrl: string = 'http://logstash:5001', serviceName: string = 'ft_transcendence') {
    this.logstashUrl = logstashUrl;
    this.serviceName = serviceName;
    // Initialize after a delay to allow logstash to start
    setTimeout(() => {
      this.isInitialized = true;
    }, 10000); // 10 second delay
  }

  private async sendLog(entry: LogEntry, retries = 3, delay = 1000): Promise<void> {
    // Don't try to send logs if not initialized yet
    if (!this.isInitialized) {
      console.log(`[ELK Logger] Skipping log during initialization: ${entry.message}`);
      return;
    }

    try {
      const response = await fetch(this.logstashUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        console.error('Failed to send log to ELK:', response.statusText);
      }
    } catch (error) {
      if (retries > 0) {
        await new Promise(res => setTimeout(res, delay));
        return this.sendLog(entry, retries - 1, delay * 2);
      }
      // Fallback to console if ELK is not available
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
    // Always log to console for debugging
    console.log(`[INFO] ${message}`, metadata);
    await this.sendLog(this.createLogEntry('info', message, metadata));
  }

  async warn(message: string, metadata?: Record<string, any>): Promise<void> {
    console.warn(`[WARN] ${message}`, metadata);
    await this.sendLog(this.createLogEntry('warn', message, metadata));
  }

  async error(message: string, metadata?: Record<string, any>): Promise<void> {
    console.error(`[ERROR] ${message}`, metadata);
    await this.sendLog(this.createLogEntry('error', message, metadata));
  }

  async debug(message: string, metadata?: Record<string, any>): Promise<void> {
    console.debug(`[DEBUG] ${message}`, metadata);
    await this.sendLog(this.createLogEntry('debug', message, metadata));
  }
}

export const elkLogger = new ELKLogger();