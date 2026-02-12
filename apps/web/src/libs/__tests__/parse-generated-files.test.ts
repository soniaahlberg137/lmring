import { describe, expect, it } from 'vitest';
import { filesToRecord, parseGeneratedFiles } from '../parse-generated-files';

describe('parseGeneratedFiles', () => {
  it('should parse a single file block', () => {
    const input = `---FILE: src/App.tsx---
export default function App() {
  return <div>Hello</div>;
}
---END FILE---`;

    const files = parseGeneratedFiles(input);

    expect(files).toHaveLength(1);
    expect(files[0]?.path).toBe('src/App.tsx');
    expect(files[0]?.content).toContain('export default function App()');
  });

  it('should parse multiple file blocks', () => {
    const input = `---FILE: src/App.tsx---
export default function App() {}
---END FILE---
---FILE: src/index.ts---
import App from './App';
---END FILE---
---FILE: package.json---
{"name": "test"}
---END FILE---`;

    const files = parseGeneratedFiles(input);

    expect(files).toHaveLength(3);
    expect(files[0]?.path).toBe('src/App.tsx');
    expect(files[1]?.path).toBe('src/index.ts');
    expect(files[2]?.path).toBe('package.json');
  });

  it('should return empty array when no markers are found', () => {
    const input = 'Just some text without any file markers.';
    const files = parseGeneratedFiles(input);
    expect(files).toEqual([]);
  });

  it('should return empty array for empty input', () => {
    const files = parseGeneratedFiles('');
    expect(files).toEqual([]);
  });

  it('should handle files with empty content', () => {
    const input = `---FILE: empty.ts---
---END FILE---`;

    const files = parseGeneratedFiles(input);

    expect(files).toHaveLength(1);
    expect(files[0]?.path).toBe('empty.ts');
    expect(files[0]?.content).toBe('');
  });

  it('should trim whitespace from file paths', () => {
    const input = `---FILE:   src/App.tsx   ---
content
---END FILE---`;

    const files = parseGeneratedFiles(input);

    expect(files).toHaveLength(1);
    expect(files[0]?.path).toBe('src/App.tsx');
  });

  it('should handle trailing whitespace on marker lines', () => {
    const input = `---FILE: src/App.tsx---
content here
---END FILE---`;

    const files = parseGeneratedFiles(input);

    expect(files).toHaveLength(1);
    expect(files[0]?.path).toBe('src/App.tsx');
  });

  it('should handle text before and after file blocks', () => {
    const input = `Here is the code:

---FILE: src/App.tsx---
hello
---END FILE---

That's the generated code.`;

    const files = parseGeneratedFiles(input);

    expect(files).toHaveLength(1);
    expect(files[0]?.path).toBe('src/App.tsx');
  });

  it('should handle files with special characters in content', () => {
    const input = `---FILE: src/styles.css---
.container {
  background: url("data:image/svg+xml;utf8,<svg></svg>");
  content: '---FILE: fake---';
}
---END FILE---`;

    const files = parseGeneratedFiles(input);

    expect(files).toHaveLength(1);
    expect(files[0]?.content).toContain('background: url(');
  });

  it('should handle deeply nested file paths', () => {
    const input = `---FILE: src/components/ui/buttons/primary/PrimaryButton.tsx---
export const PrimaryButton = () => null;
---END FILE---`;

    const files = parseGeneratedFiles(input);

    expect(files).toHaveLength(1);
    expect(files[0]?.path).toBe('src/components/ui/buttons/primary/PrimaryButton.tsx');
  });

  it('should be callable multiple times (regex state reset)', () => {
    const input = `---FILE: a.ts---
a
---END FILE---`;

    const files1 = parseGeneratedFiles(input);
    const files2 = parseGeneratedFiles(input);

    expect(files1).toHaveLength(1);
    expect(files2).toHaveLength(1);
    expect(files1[0]?.path).toBe('a.ts');
    expect(files2[0]?.path).toBe('a.ts');
  });
});

describe('filesToRecord', () => {
  it('should convert file array to record', () => {
    const files = [
      { path: 'src/App.tsx', content: 'app content' },
      { path: 'src/index.ts', content: 'index content' },
    ];

    const record = filesToRecord(files);

    expect(record).toEqual({
      'src/App.tsx': 'app content',
      'src/index.ts': 'index content',
    });
  });

  it('should return empty object for empty array', () => {
    const record = filesToRecord([]);
    expect(record).toEqual({});
  });

  it('should handle duplicate paths (last wins)', () => {
    const files = [
      { path: 'a.ts', content: 'first' },
      { path: 'a.ts', content: 'second' },
    ];

    const record = filesToRecord(files);

    expect(record['a.ts']).toBe('second');
  });
});
