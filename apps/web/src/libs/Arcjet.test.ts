import { describe, expect, it, vi } from 'vitest';

const mockShield = vi.fn((config) => ({ type: 'shield', config }));
const mockArcjet = vi.fn((config) => ({ type: 'arcjet', config }));

vi.mock('@arcjet/next', () => ({
  default: mockArcjet,
  shield: mockShield,
}));

describe('Arcjet', () => {
  it('should export default arcjet instance', async () => {
    const originalEnv = process.env.ARCJET_KEY;
    process.env.ARCJET_KEY = 'test-arcjet-key';

    vi.resetModules();
    const arcjetModule = await import('./Arcjet');

    expect(arcjetModule.default).toBeDefined();
    expect(arcjetModule.default).toHaveProperty('type', 'arcjet');

    process.env.ARCJET_KEY = originalEnv;
  });

  it('should configure with ip.src characteristics', async () => {
    const originalEnv = process.env.ARCJET_KEY;
    process.env.ARCJET_KEY = 'test-arcjet-key';

    vi.resetModules();
    await import('./Arcjet');

    expect(mockArcjet).toHaveBeenCalledWith(
      expect.objectContaining({
        characteristics: ['ip.src'],
      }),
    );

    process.env.ARCJET_KEY = originalEnv;
  });

  it('should configure shield rule in DRY_RUN mode', async () => {
    const originalEnv = process.env.ARCJET_KEY;
    process.env.ARCJET_KEY = 'test-arcjet-key';

    vi.resetModules();
    await import('./Arcjet');

    expect(mockShield).toHaveBeenCalledWith({ mode: 'DRY_RUN' });

    process.env.ARCJET_KEY = originalEnv;
  });

  it('should use process.env.ARCJET_KEY for key', async () => {
    const originalEnv = process.env.ARCJET_KEY;
    process.env.ARCJET_KEY = 'my-arcjet-key';

    vi.resetModules();
    await import('./Arcjet');

    expect(mockArcjet).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'my-arcjet-key',
      }),
    );

    process.env.ARCJET_KEY = originalEnv;
  });

  it('should use empty string when ARCJET_KEY is not set', async () => {
    const originalEnv = process.env.ARCJET_KEY;
    delete process.env.ARCJET_KEY;

    vi.resetModules();
    await import('./Arcjet');

    expect(mockArcjet).toHaveBeenCalledWith(
      expect.objectContaining({
        key: '',
      }),
    );

    process.env.ARCJET_KEY = originalEnv;
  });

  it('should include shield rule in rules array', async () => {
    const originalEnv = process.env.ARCJET_KEY;
    process.env.ARCJET_KEY = 'test-key';

    vi.resetModules();
    await import('./Arcjet');

    const callArgs = mockArcjet.mock.calls[0]?.[0];
    expect(callArgs?.rules).toBeDefined();
    expect(callArgs?.rules).toHaveLength(1);
    expect(callArgs?.rules?.[0]).toEqual({ type: 'shield', config: { mode: 'DRY_RUN' } });

    process.env.ARCJET_KEY = originalEnv;
  });
});
