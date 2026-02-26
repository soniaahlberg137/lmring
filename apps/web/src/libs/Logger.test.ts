import * as EnvModule from '@lmring/env';
import * as LogtapeModule from '@logtape/logtape';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lmring/env', () => ({
  env: {
    NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN: 'test-token-123',
    NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST: 'logs.betterstack.com',
  },
}));

vi.mock('@logtape/logtape');

type LoggerInstance = ReturnType<typeof LogtapeModule.getLogger>;
type ConfigureOptions = Parameters<typeof LogtapeModule.configure>[0];
type ConsoleSink = ReturnType<typeof LogtapeModule.getConsoleSink>;
type JsonFormatter = ReturnType<typeof LogtapeModule.getJsonLinesFormatter>;
type BetterStackSink = ReturnType<typeof LogtapeModule.fromAsyncSink>;

const createMockLogger = (): LoggerInstance =>
  ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }) as unknown as LoggerInstance;

const createMockConsoleSink = (): ConsoleSink => vi.fn() as unknown as ConsoleSink;
const createMockJsonFormatter = (): JsonFormatter => vi.fn(() => '') as unknown as JsonFormatter;
const createMockBetterStackSink = (): BetterStackSink => vi.fn() as unknown as BetterStackSink;

const setupDefaultLogtapeMocks = (
  logger: LoggerInstance = createMockLogger(),
  options?: {
    consoleSink?: ConsoleSink;
    jsonFormatter?: JsonFormatter;
    betterStackSink?: BetterStackSink;
  },
): void => {
  vi.mocked(LogtapeModule.getLogger).mockReturnValue(logger);
  vi.mocked(LogtapeModule.getConsoleSink).mockReturnValue(
    options?.consoleSink ?? createMockConsoleSink(),
  );
  vi.mocked(LogtapeModule.getJsonLinesFormatter).mockReturnValue(
    options?.jsonFormatter ?? createMockJsonFormatter(),
  );
  vi.mocked(LogtapeModule.fromAsyncSink).mockReturnValue(
    options?.betterStackSink ?? createMockBetterStackSink(),
  );
  vi.mocked(LogtapeModule.configure).mockResolvedValue(undefined);
};

const getConfigureCall = (): ConfigureOptions | undefined =>
  vi.mocked(LogtapeModule.configure).mock.calls[0]?.[0];

describe('Logger', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should export logger', async () => {
    const mockLogger = createMockLogger();
    setupDefaultLogtapeMocks(mockLogger);

    const { logger } = await import('./Logger');

    expect(logger).toBeDefined();
    expect(logger).toBe(mockLogger);
  });

  it('should configure logtape with correct sinks', async () => {
    setupDefaultLogtapeMocks(createMockLogger(), {
      consoleSink: createMockConsoleSink(),
      jsonFormatter: createMockJsonFormatter(),
      betterStackSink: createMockBetterStackSink(),
    });

    await import('./Logger');

    expect(LogtapeModule.configure).toHaveBeenCalled();
    const configCall = getConfigureCall();
    expect(configCall?.sinks).toBeDefined();
    expect(configCall?.sinks?.console).toBeDefined();
    expect(configCall?.sinks?.betterStack).toBeDefined();
  });

  it('should pass formatter to console sink', async () => {
    const mockFormatter = createMockJsonFormatter();

    setupDefaultLogtapeMocks(createMockLogger(), {
      jsonFormatter: mockFormatter,
      consoleSink: createMockConsoleSink(),
      betterStackSink: createMockBetterStackSink(),
    });

    await import('./Logger');

    expect(LogtapeModule.getConsoleSink).toHaveBeenCalledWith(
      expect.objectContaining({
        formatter: mockFormatter,
      }),
    );
  });

  it('should set app logger to debug level', async () => {
    setupDefaultLogtapeMocks(createMockLogger());

    await import('./Logger');

    const configCall = getConfigureCall();
    const appLogger = configCall?.loggers?.find(
      (loggerConfig) => loggerConfig.category?.[0] === 'app',
    );
    expect(appLogger?.lowestLevel).toBe('debug');
  });

  it('should include betterStack sink in app logger sinks when tokens are configured', async () => {
    setupDefaultLogtapeMocks(createMockLogger());

    vi.mocked(EnvModule.env).NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN = 'test-token';
    vi.mocked(EnvModule.env).NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST = 'logs.betterstack.com';

    await import('./Logger');

    const configCall = getConfigureCall();
    const appLogger = configCall?.loggers?.find(
      (loggerConfig) => loggerConfig.category?.[0] === 'app',
    );
    expect(appLogger?.sinks).toContain('console');
    expect(appLogger?.sinks).toContain('betterStack');
  });

  it('should only include console sink when betterStack token is missing', async () => {
    setupDefaultLogtapeMocks(createMockLogger());

    vi.mocked(EnvModule.env).NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN = '';
    vi.mocked(EnvModule.env).NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST = 'logs.betterstack.com';

    await import('./Logger');

    const configCall = getConfigureCall();
    const appLogger = configCall?.loggers?.find(
      (loggerConfig) => loggerConfig.category?.[0] === 'app',
    );
    expect(appLogger?.sinks).toEqual(['console']);
  });

  it('should only include console sink when betterStack host is missing', async () => {
    setupDefaultLogtapeMocks(createMockLogger());

    vi.mocked(EnvModule.env).NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN = 'test-token';
    vi.mocked(EnvModule.env).NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST = '';

    await import('./Logger');

    const configCall = getConfigureCall();
    const appLogger = configCall?.loggers?.find(
      (loggerConfig) => loggerConfig.category?.[0] === 'app',
    );
    expect(appLogger?.sinks).toEqual(['console']);
  });

  it('should set logtape meta logger to warning level', async () => {
    setupDefaultLogtapeMocks(createMockLogger());

    await import('./Logger');

    const configCall = getConfigureCall();
    const metaLogger = configCall?.loggers?.find(
      (loggerConfig) => loggerConfig.category?.[0] === 'logtape',
    );
    expect(metaLogger?.lowestLevel).toBe('warning');
  });

  it('should use getLogger with app category', async () => {
    setupDefaultLogtapeMocks(createMockLogger());

    await import('./Logger');

    expect(LogtapeModule.getLogger).toHaveBeenCalledWith(['app']);
  });

  it('should have info, debug, warn, and error methods on logger', async () => {
    setupDefaultLogtapeMocks(createMockLogger());

    const { logger } = await import('./Logger');

    expect(logger.info).toBeDefined();
    expect(logger.debug).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });
});
