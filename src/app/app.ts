import { Component, model, resource, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { runFlow } from 'genkit/beta/client';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('genkit-ssr-example');

  menuInput = '';
  theme = signal<string | undefined>(undefined);

  menuResource = resource({
    params: () => this.theme(),
    loader: ({ params }) =>
      runFlow({
        url: '/api/menuSuggestion', // IMPORTANT: use relative path instead of absolute path
        input: { theme: params },
      }),
  });
}
