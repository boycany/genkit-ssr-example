import { Component, computed, signal } from '@angular/core';
import { streamFlow } from 'genkit/beta/client';
import { FormsModule } from '@angular/forms';

interface ParsedMenu {
  name: string;
  tagline: string;
  description: string;
  ingredients: string[];
  pairing: string;
}

const SECTION_RE =
  /^(NAME|TAGLINE|DESCRIPTION|INGREDIENTS|PAIRING):\s*([\s\S]*?)(?=^(?:NAME|TAGLINE|DESCRIPTION|INGREDIENTS|PAIRING):|$(?![\s\S]))/gm;

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('genkit-ssr-example');

  menuInput = '';
  streamedText = signal('');
  isStreaming = signal(false);

  parsedMenu = computed<ParsedMenu | null>(() => {
    const text = this.streamedText();
    if (!text) return null;

    const sections: Record<string, string> = {};
    SECTION_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = SECTION_RE.exec(text)) !== null) {
      sections[match[1]] = match[2].trim();
    }

    const ingredients = (sections['INGREDIENTS'] ?? '')
      .split('\n')
      .map((line) => line.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);

    const parsed: ParsedMenu = {
      name: sections['NAME'] ?? '',
      tagline: sections['TAGLINE'] ?? '',
      description: sections['DESCRIPTION'] ?? '',
      ingredients,
      pairing: sections['PAIRING'] ?? '',
    };

    const hasAnything =
      parsed.name ||
      parsed.tagline ||
      parsed.description ||
      parsed.ingredients.length > 0 ||
      parsed.pairing;
    return hasAnything ? parsed : null;
  });

  async streamMenuItem() {
    const theme = this.menuInput;
    if (!theme) return;

    this.isStreaming.set(true);
    this.streamedText.set('');

    try {
      const result = streamFlow({
        url: '/api/menuSuggestion',
        input: { theme },
      });

      for await (const chunk of result.stream) {
        this.streamedText.update((prev) => prev + chunk);
      }

      const finalOutput = await result.output;
      console.log('finalOutput', finalOutput);
    } catch (error) {
      console.error('Error streaming menu item:', error);
    } finally {
      this.isStreaming.set(false);
    }
  }

  /** For resource API */
  // theme = signal<string | undefined>(undefined);
  // menuResource = resource({
  //   params: () => this.theme(),
  //   loader: ({ params }) =>
  //     runFlow({
  //       url: '/api/menuSuggestion', // IMPORTANT: use relative path instead of absolute path
  //       input: { theme: params },
  //       /** Add authentication headers if needed */
  //       // headers: {
  //       //   Authorization: 'Bearer your-token-here',
  //       // },
  //     }),
  // });
}
