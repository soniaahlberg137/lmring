import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface ThemePackageJson {
  name: string;
  license?: string;
  private?: boolean;
  type?: string;
  main?: string;
  types?: string;
  files?: string[];
  exports?: Record<string, unknown>;
  publishConfig?: {
    access?: string;
    provenance?: boolean;
    registry?: string;
  };
  repository?: {
    type?: string;
    url?: string;
    directory?: string;
  };
}

const packageJsonPath = join(import.meta.dirname, "..", "package.json");
const packageJson = JSON.parse(
  readFileSync(packageJsonPath, "utf8"),
) as ThemePackageJson;

describe("@lmring/theme package metadata", () => {
  it("is publishable as a public ESM-only package", () => {
    expect(packageJson.name).toBe("@lmring/theme");
    expect(packageJson.license).toBe("Apache-2.0");
    expect(packageJson.private).not.toBe(true);
    expect(packageJson.type).toBe("module");
    expect(packageJson.main).toBe("./dist/index.js");
    expect(packageJson.types).toBe("./dist/index.d.ts");
    expect(packageJson.files).toContain("dist");
    expect(packageJson.files).toContain("src/theme.css");
    expect(packageJson.files).toContain("README.md");
    expect(packageJson.publishConfig?.access).toBe("public");
    expect(packageJson.publishConfig?.provenance).toBe(true);
    expect(packageJson.publishConfig?.registry).toBe("https://registry.npmjs.org/");
    expect(packageJson.repository?.type).toBe("git");
    expect(packageJson.repository?.url).toBe("git+https://github.com/llm-ring/lmring.git");
    expect(packageJson.repository?.directory).toBe("packages/theme");
    expect(packageJson.exports).toEqual({
      ".": {
        types: "./dist/index.d.ts",
        default: "./dist/index.js",
      },
      "./css": "./src/theme.css",
      "./package.json": "./package.json",
    });
  });
});
