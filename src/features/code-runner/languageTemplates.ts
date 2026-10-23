import { SupportedLanguage } from './types';

export const LANGUAGE_TEMPLATES: Record<SupportedLanguage, string> = {
  javascript: `// Skrypt JavaScript w notatce Studio
const users = ['Adam', 'Kasia', 'Piotr'];
console.log('Znalezieni użytkownicy:');
users.forEach((u, i) => console.log(\`\${i + 1}. \${u}\`));`,

  typescript: `interface Task {
  id: number;
  title: string;
}
const task: Task = { id: 101, title: 'Wdrożenie modułu' };
console.log(task);`,

  json: `{
  "projekt": "SearchPoint Studio",
  "wersja": "2.4.0",
  "status": "aktywny"
}`,

  html: `<div class="card">
  <h3>Witaj świecie</h3>
  <p>Element szablonu HTML</p>
</div>`,

  python: `# Przykładowy kod Python
def powitanie(imie):
    return f"Cześć, {imie}!"

print(powitanie("Studio"))`,
};
