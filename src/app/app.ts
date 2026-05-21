import { Component, signal } from '@angular/core';
import { streamFlow } from 'genkit/beta/client';
import { FormsModule } from '@angular/forms';

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
