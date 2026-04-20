type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEvent {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

type LogSink = (event: LogEvent) => void;

const sinks: LogSink[] = [];

const consoleSink: LogSink = (event) => {
  const label = `[${event.level.toUpperCase()}] ${event.message}`;
  const fn =
    event.level === 'error'
      ? console.error
      : event.level === 'warn'
        ? console.warn
        : console.info;
  if (event.context) fn(label, event.context);
  else fn(label);
};

sinks.push(consoleSink);

export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    emit('debug', message, context);
  },
  info(message: string, context?: Record<string, unknown>): void {
    emit('info', message, context);
  },
  warn(message: string, context?: Record<string, unknown>): void {
    emit('warn', message, context);
  },
  error(message: string, context?: Record<string, unknown>): void {
    emit('error', message, context);
  },
  registerSink(sink: LogSink): () => void {
    sinks.push(sink);
    return () => {
      const i = sinks.indexOf(sink);
      if (i >= 0) sinks.splice(i, 1);
    };
  },
};

function emit(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): void {
  const event: LogEvent = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };
  for (const sink of sinks) {
    try {
      sink(event);
    } catch {
      // never let a sink crash the app
    }
  }
}
