import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as comparison from './comparison';
import { ArenaController } from './controller';

vi.mock('./comparison', () => ({
  compareModels: vi.fn(),
}));

describe('ArenaController', () => {
  let controller: ArenaController;

  beforeEach(() => {
    controller = new ArenaController();
    vi.clearAllMocks();
  });

  describe('generateId', () => {
    it('generates sequential IDs', () => {
      const id1 = controller.generateId();
      const id2 = controller.generateId();
      const id3 = controller.generateId();

      expect(id1).toBe('arena-task-1');
      expect(id2).toBe('arena-task-2');
      expect(id3).toBe('arena-task-3');
    });
  });

  describe('start', () => {
    it('creates and starts a task', async () => {
      const mockResults = [{ provider: 'test', model: 'model', status: 'success' as const }];
      vi.mocked(comparison.compareModels).mockResolvedValue(mockResults);

      const results = await controller.start(
        'task-1',
        [{ provider: { providerId: 'test' } as never, model: 'model' }],
        [{ role: 'user', content: 'hello' }],
      );

      expect(results).toBe(mockResults);
      expect(controller.getStatus('task-1')).toBe('completed');
    });

    it('throws if task ID already exists', async () => {
      vi.mocked(comparison.compareModels).mockResolvedValue([]);
      await controller.start('task-1', [], []);

      await expect(controller.start('task-1', [], [])).rejects.toThrow('already exists');
    });

    it('sets status to failed on error', async () => {
      vi.mocked(comparison.compareModels).mockRejectedValue(new Error('Compare failed'));

      await expect(controller.start('task-1', [], [])).rejects.toThrow('Compare failed');

      expect(controller.getStatus('task-1')).toBe('failed');
    });

    it('passes options to compareModels', async () => {
      vi.mocked(comparison.compareModels).mockResolvedValue([]);

      const options = { streaming: true };
      await controller.start('task-1', [], [], options);

      expect(comparison.compareModels).toHaveBeenCalledWith(
        [],
        [],
        expect.objectContaining({ streaming: true }),
      );
    });

    it('creates AbortController for task', async () => {
      vi.mocked(comparison.compareModels).mockResolvedValue([]);
      await controller.start('task-1', [], []);

      expect(comparison.compareModels).toHaveBeenCalledWith(
        [],
        [],
        expect.objectContaining({
          controller: expect.any(AbortController),
        }),
      );
    });
  });

  describe('pause', () => {
    it('pauses a running task', async () => {
      let resolveCompare: ((value: never[]) => void) | undefined;
      vi.mocked(comparison.compareModels).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCompare = resolve;
          }),
      );

      const promise = controller.start('task-1', [], []);
      controller.pause('task-1');

      expect(controller.getStatus('task-1')).toBe('paused');
      resolveCompare?.([]);
      await promise.catch(() => {});
    });

    it('throws if task not found', () => {
      expect(() => controller.pause('unknown')).toThrow('not found');
    });

    it('throws if task is not running', async () => {
      vi.mocked(comparison.compareModels).mockResolvedValue([]);
      await controller.start('task-1', [], []);

      expect(() => controller.pause('task-1')).toThrow('not running');
    });
  });

  describe('resume', () => {
    it('resumes a paused task', async () => {
      vi.mocked(comparison.compareModels)
        .mockImplementationOnce(
          () =>
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error('aborted')), 10);
            }),
        )
        .mockResolvedValueOnce([{ provider: 'test', model: 'm', status: 'success' as const }]);

      const firstPromise = controller.start('task-1', [], []);
      controller.pause('task-1');
      await firstPromise.catch(() => {});

      expect(controller.getStatus('task-1')).toBe('paused');
      const resumePromise = controller.resume('task-1');
      expect(controller.getStatus('task-1')).toBe('running');

      await resumePromise;
      expect(controller.getStatus('task-1')).toBe('completed');
    });

    it('throws if task not found', () => {
      expect(() => controller.resume('unknown')).toThrow('not found');
    });

    it('throws if task is not paused', async () => {
      vi.mocked(comparison.compareModels).mockResolvedValue([]);
      await controller.start('task-1', [], []);

      expect(() => controller.resume('task-1')).toThrow('not paused');
    });
  });

  describe('cancel', () => {
    it('cancels a running task', async () => {
      let resolveCompare: ((value: never[]) => void) | undefined;
      vi.mocked(comparison.compareModels).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCompare = resolve;
          }),
      );

      const promise = controller.start('task-1', [], []);
      controller.cancel('task-1');

      expect(controller.getStatus('task-1')).toBe('cancelled');
      resolveCompare?.([]);
      await promise.catch(() => {});
    });

    it('throws if task not found', () => {
      expect(() => controller.cancel('unknown')).toThrow('not found');
    });

    it('does nothing if already completed', async () => {
      vi.mocked(comparison.compareModels).mockResolvedValue([]);
      await controller.start('task-1', [], []);

      controller.cancel('task-1');
      expect(controller.getStatus('task-1')).toBe('completed');
    });

    it('does nothing if already cancelled', async () => {
      let resolveCompare: ((value: never[]) => void) | undefined;
      vi.mocked(comparison.compareModels).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCompare = resolve;
          }),
      );

      const promise = controller.start('task-1', [], []);
      controller.cancel('task-1');
      controller.cancel('task-1');

      expect(controller.getStatus('task-1')).toBe('cancelled');
      resolveCompare?.([]);
      await promise.catch(() => {});
    });
  });

  describe('getStatus', () => {
    it('returns task status', async () => {
      vi.mocked(comparison.compareModels).mockResolvedValue([]);
      await controller.start('task-1', [], []);
      expect(controller.getStatus('task-1')).toBe('completed');
    });

    it('throws if task not found', () => {
      expect(() => controller.getStatus('unknown')).toThrow('not found');
    });
  });

  describe('getTask', () => {
    it('returns task object', async () => {
      vi.mocked(comparison.compareModels).mockResolvedValue([]);
      await controller.start('task-1', [], [{ role: 'user', content: 'test' }]);

      const task = controller.getTask('task-1');
      expect(task).toBeDefined();
      expect(task?.id).toBe('task-1');
      expect(task?.messages).toEqual([{ role: 'user', content: 'test' }]);
    });

    it('returns undefined for unknown task', () => {
      expect(controller.getTask('unknown')).toBeUndefined();
    });
  });

  describe('getAllTasks', () => {
    it('returns all tasks', async () => {
      vi.mocked(comparison.compareModels).mockResolvedValue([]);
      await controller.start('task-1', [], []);
      await controller.start('task-2', [], []);

      const tasks = controller.getAllTasks();
      expect(tasks).toHaveLength(2);
    });

    it('returns empty array when no tasks', () => {
      expect(controller.getAllTasks()).toEqual([]);
    });
  });

  describe('getResults', () => {
    it('returns results for completed task', async () => {
      const mockResults = [{ provider: 'test', model: 'm', status: 'success' as const }];
      vi.mocked(comparison.compareModels).mockResolvedValue(mockResults);
      await controller.start('task-1', [], []);

      expect(controller.getResults('task-1')).toBe(mockResults);
    });

    it('returns undefined for task without results', async () => {
      let resolveCompare: (() => void) | undefined;
      vi.mocked(comparison.compareModels).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCompare = () => resolve([]);
          }),
      );

      controller.start('task-1', [], []);
      expect(controller.getResults('task-1')).toBeUndefined();
      resolveCompare?.();
    });

    it('returns undefined for unknown task', () => {
      expect(controller.getResults('unknown')).toBeUndefined();
    });
  });

  describe('clearTask', () => {
    it('removes a completed task', async () => {
      vi.mocked(comparison.compareModels).mockResolvedValue([]);
      await controller.start('task-1', [], []);

      controller.clearTask('task-1');
      expect(controller.getTask('task-1')).toBeUndefined();
    });

    it('cancels and removes running task', async () => {
      let resolveCompare: ((value: never[]) => void) | undefined;
      vi.mocked(comparison.compareModels).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCompare = resolve;
          }),
      );

      const promise = controller.start('task-1', [], []);
      controller.clearTask('task-1');

      expect(controller.getTask('task-1')).toBeUndefined();
      resolveCompare?.([]);
      await promise.catch(() => {});
    });
  });

  describe('clearAllTasks', () => {
    it('removes all tasks', async () => {
      vi.mocked(comparison.compareModels).mockResolvedValue([]);
      await controller.start('task-1', [], []);
      await controller.start('task-2', [], []);

      controller.clearAllTasks();
      expect(controller.getAllTasks()).toHaveLength(0);
    });

    it('cancels running tasks before clearing', async () => {
      let resolveCompare: ((value: never[]) => void) | undefined;
      vi.mocked(comparison.compareModels).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCompare = resolve;
          }),
      );

      const promise = controller.start('task-1', [], []);
      controller.clearAllTasks();

      expect(controller.getAllTasks()).toHaveLength(0);
      resolveCompare?.([]);
      await promise.catch(() => {});
    });
  });
});
