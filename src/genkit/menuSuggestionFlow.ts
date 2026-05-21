import { googleAI } from '@genkit-ai/google-genai';
import { genkit, z } from 'genkit';

const ai = genkit({
  plugins: [googleAI()],
});

export const menuSuggestionFlow = ai.defineFlow(
  {
    name: 'menuSuggestionFlow',
    inputSchema: z.object({
      theme: z.string(),
    }),
    outputSchema: z.object({ menuItem: z.string() }),
    streamSchema: z.string(),
  },
  async ({ theme }, { sendChunk }) => {
    const { stream, response } = ai.generateStream({
      model: googleAI.model('gemini-3.1-flash-lite'),
      prompt: `Invent a menu item for a "${theme}" themed restaurant.

Respond in EXACTLY this plain-text format. No markdown bold, no extra commentary, no blank lines, no headings other than the labels below. Keep every value on a single line except INGREDIENTS.

NAME: <dish name, max 6 words>
TAGLINE: <evocative tagline, max 12 words>
DESCRIPTION: <2-3 sentence sensory description on one line>
INGREDIENTS:
- <list 3 to 8 key ingredients, one per line, prefixed with "- ">
PAIRING: <one suggested drink pairing with a brief reason>`,
    });

    for await (const chunk of stream) {
      sendChunk(chunk.text);
    }

    const { text } = await response;
    return { menuItem: text };
  },
);
