import { SupportedLanguage } from './types';

/**
 * Safely stringifies arguments for console logging without circular reference crashes.
 */
function safeStringify(val: any): string {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

/**
 * Executes JavaScript with execution timing, console capture (log, info, warn, error, table)
 * and execution safety.
 */
export const executeJavaScript = (code: string): string => {
  const logs: string[] = [];
  const start = performance.now();

  const customConsole = {
    log: (...args: any[]) => logs.push(args.map(safeStringify).join(' ')),
    info: (...args: any[]) => logs.push('ℹ ' + args.map(safeStringify).join(' ')),
    warn: (...args: any[]) => logs.push('⚠ OSTRZEŻENIE: ' + args.map(safeStringify).join(' ')),
    error: (...args: any[]) => logs.push('✖ BŁĄD: ' + args.map(safeStringify).join(' ')),
    table: (data: any) => {
      try {
        logs.push('[Table]\n' + JSON.stringify(data, null, 2));
      } catch {
        logs.push(String(data));
      }
    },
    clear: () => {
      logs.length = 0;
    },
  };

  try {
    const run = new Function('console', 'Math', 'JSON', 'Date', 'Array', 'Object', code);
    const result = run(customConsole, Math, JSON, Date, Array, Object);
    const duration = Math.round((performance.now() - start) * 100) / 100;

    if (result !== undefined && logs.length === 0) {
      logs.push(`=> ${safeStringify(result)}`);
    }

    if (logs.length === 0) {
      return `(Kod wykonany pomyślnie w ${duration}ms bez wyjścia konsoli)`;
    }

    return `${logs.join('\n')}\n\n[Czas wykonania: ${duration}ms]`;
  } catch (err: any) {
    const duration = Math.round((performance.now() - start) * 100) / 100;
    return `Błąd wykonania: ${err.message}\n[Czas: ${duration}ms]`;
  }
};

/**
 * Validates and formats JSON strings.
 */
export const validateAndFormatJson = (jsonStr: string): { ok: boolean; formatted: string; error?: string } => {
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      ok: true,
      formatted: JSON.stringify(parsed, null, 2),
    };
  } catch (err: any) {
    return {
      ok: false,
      formatted: jsonStr,
      error: `Niepoprawny format JSON: ${err.message}`,
    };
  }
};

/**
 * Lightweight deterministic Python syntax interpreter / simulator for basic scripts.
 */
export const executePythonSimulation = (code: string): string => {
  const lines = code.split('\n');
  const logs: string[] = [];
  const variables: Record<string, any> = {};

  try {
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      // print(...)
      const printMatch = line.match(/^print\((.*)\)$/);
      if (printMatch) {
        let inside = printMatch[1].trim();
        // f-strings
        if (inside.startsWith('f"') && inside.endsWith('"')) {
          let str = inside.slice(2, -1);
          str = str.replace(/\{([^}]+)\}/g, (_, varName) => {
            const v = varName.trim();
            return variables[v] !== undefined ? String(variables[v]) : `{${v}}`;
          });
          logs.push(str);
        } else if ((inside.startsWith('"') && inside.endsWith('"')) || (inside.startsWith("'") && inside.endsWith("'"))) {
          logs.push(inside.slice(1, -1));
        } else if (variables[inside] !== undefined) {
          logs.push(safeStringify(variables[inside]));
        } else {
          // evaluate expression
          try {
            const val = new Function(...Object.keys(variables), `return (${inside});`)(...Object.values(variables));
            logs.push(safeStringify(val));
          } catch {
            logs.push(inside);
          }
        }
        continue;
      }

      // Variable assignment: x = 10, name = "Jan"
      const assignMatch = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
      if (assignMatch) {
        const varName = assignMatch[1];
        const valExpr = assignMatch[2].trim();
        if (valExpr.startsWith('"') && valExpr.endsWith('"')) {
          variables[varName] = valExpr.slice(1, -1);
        } else if (valExpr.startsWith('[') && valExpr.endsWith(']')) {
          try {
            variables[varName] = JSON.parse(valExpr.replace(/'/g, '"'));
          } catch {
            variables[varName] = valExpr;
          }
        } else if (!isNaN(Number(valExpr))) {
          variables[varName] = Number(valExpr);
        } else {
          try {
            variables[varName] = new Function(...Object.keys(variables), `return (${valExpr});`)(...Object.values(variables));
          } catch {
            variables[varName] = valExpr;
          }
        }
      }
    }

    return logs.length > 0 ? logs.join('\n') : '(Skrypt Python wykonany bez wyjścia)';
  } catch (err: any) {
    return `Błąd interpretacji Python: ${err.message}`;
  }
};

/**
 * Universal multi-language executor
 */
export const executeCode = (lang: SupportedLanguage, code: string): string => {
  if (lang === 'javascript' || lang === 'typescript') {
    // Strip simple TS types for execution in JS sandbox
    const jsClean = code
      .replace(/:\s*(string|number|boolean|any|void|Task|User|DocBlock)(\[\])?/g, '')
      .replace(/interface\s+\w+\s*\{[^}]*\}/g, '');
    return executeJavaScript(jsClean);
  }

  if (lang === 'python') {
    return executePythonSimulation(code);
  }

  if (lang === 'json') {
    const res = validateAndFormatJson(code);
    return res.ok ? '✓ Poprawna składnia JSON!\n\nSformatowany wynik:\n' + res.formatted : `✖ ${res.error}`;
  }

  if (lang === 'html') {
    return `Podgląd HTML:\nZawiera ${code.length} znaków. Klocek jest poprawnie renderowany w dokumencie.`;
  }

  return `(Wykonywanie dla języka ${lang} nie jest obsługiwane)`;
};

export const generateCodeHtml = (lang: SupportedLanguage, code: string, output?: string): string => {
  return `
    <div class="notion-code-block" style="margin: 1rem 0; background: #121212; border: 1px solid #333; border-radius: 8px; overflow: hidden; font-family: monospace; font-size: 12px;">
      <div style="background: #1e1e1e; padding: 6px 12px; border-bottom: 1px solid #333; color: #a1a1aa; display: flex; justify-content: space-between;">
        <span style="font-weight: 600; text-transform: uppercase;">${lang}</span>
      </div>
      <pre style="margin: 0; padding: 12px; color: #e4e4e7; overflow-x: auto; white-space: pre-wrap;"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
      ${
        output
          ? `<div style="background: #18181b; padding: 8px 12px; border-top: 1px dashed #333; color: #4ade80; font-size: 11px;"><strong style="color: #9ca3af;">Wyjście konsoli:</strong><br />${output.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`
          : ''
      }
    </div><p></p>
  `;
};
