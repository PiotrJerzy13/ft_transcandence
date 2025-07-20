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
  private logQueue: LogEntry[] = []; // Queue for logs during initialization

  constructor(serviceName: string = 'ft_transcendence') {
    // Read from environment variables, with sensible defaults for Docker networking.
    const host = process.env.LOGSTASH_HOST || 'logstash';
    const port = process.env.LOGSTASH_PORT || 5001;
    this.logstashUrl = `http://${host}:${port}`;
    this.serviceName = serviceName;
    
    setTimeout(() => {
      this.isInitialized = true;
      console.log(`[ELK Logger] Initialized. Now sending logs to ${this.logstashUrl}. Processing queued logs...`);
      this.processQueue();
    }, 5000);
  }

  // New method to process the queue
  private processQueue(): void {
    while (this.logQueue.length > 0) {
      const entry = this.logQueue.shift();
      if (entry) {
        this.sendLog(entry).catch(error => {
          console.error('[ELK Logger] Failed to send queued log:', error);
        });
      }
    }
  }

  private async sendLog(entry: LogEntry, retries = 3, delay = 1000): Promise<void> {
    // If not initialized, queue the log and return.
    if (!this.isInitialized) {
      this.logQueue.push(entry);
      // Optional: console.log for debugging the queue
      // console.log(`[ELK Logger] Queued log: ${entry.message}`);
      return;
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(this.logstashUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(entry),
        signal: AbortSignal.timeout(5000) // Add a timeout to prevent hanging
      });

      if (!response.ok) {
        // Log the response text for more detailed errors
        const errorText = await response.text();
        throw new Error(`[ELK Logger] Failed to send log: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      if (retries > 0) {
        console.warn(`[ELK Logger] Retrying log send... (${retries} retries left)`);
        setTimeout(() => this.sendLog(entry, retries - 1, delay * 2), delay);
      } else {
        console.error('[ELK Logger] Final failure to send log after retries:', error);
      }
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

  // The log methods now just call sendLog which handles queueing
  public info(message: string, metadata?: Record<string, any>): Promise<void> {
    console.log(`[INFO] ${message}`, metadata || '');
    return this.sendLog(this.createLogEntry('info', message, metadata));
  }

  public warn(message: string, metadata?: Record<string, any>): Promise<void> {
    console.warn(`[WARN] ${message}`, metadata || '');
    return this.sendLog(this.createLogEntry('warn', message, metadata));
  }

  public error(message: string, metadata?: Record<string, any>): Promise<void> {
    console.error(`[ERROR] ${message}`, metadata || '');
    return this.sendLog(this.createLogEntry('error', message, metadata));
  }

  public debug(message: string, metadata?: Record<string, any>): Promise<void> {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(`[DEBUG] ${message}`, metadata || '');
      return this.sendLog(this.createLogEntry('debug', message, metadata));
    }
    return Promise.resolve();
  }
}

// Pass the service name from the logger's creation point for clarity.
export const elkLogger = new ELKLogger('ft_transcendence_backend');