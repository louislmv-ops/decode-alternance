import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod/v4';
import { DECODE_MODEL } from '@/lib/decode/claude';
import { DOMAINS } from '@/lib/domains';
import { departmentFromPostalCode } from '@/lib/offers/normalize';
import type { CvGuess } from './extract';

const CvSchema = z.object({
  metier: z.string().nullable().describe('Le métier ou domaine visé en alternance, en 1 à 3 mots simples pour une recherche (ex. « marketing », « développeur web »)'),
  codePostal: z.string().nullable().describe('Code postal de l’adresse du candidat, 5 chiffres'),
  ville: z.string().nullable(),
  niveauVise: z.number().nullable().describe('Niveau du diplôme préparé en alternance : 3 = CAP, 4 = bac, 5 = bac+2, 6 = bac+3, 7 = bac+5'),
  age: z.number().nullable().describe('Âge en années, seulement s’il est écrit ou calculable'),
});

let client: Anthropic | null = null;

/** Lit le CV avec l'IA. Rien n'est gardé : le texte sert à remplir le questionnaire, puis disparaît. */
export async function readCvWithClaude(input: string | { mediaType: 'image/jpeg' | 'image/png' | 'image/webp'; data: Uint8Array }): Promise<CvGuess> {
  client ??= new Anthropic();
  const response = await client.beta.messages.parse({
    model: DECODE_MODEL,
    max_tokens: 1_000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: betaZodOutputFormat(CvSchema) },
    system: `Tu lis le CV d'un ou d'une jeune qui cherche une alternance en France. Tu en tires seulement ce qui est écrit ou se déduit sans doute possible. Si une information manque, mets null. Domaines courants : ${DOMAINS.map((d) => d.label).join(', ')}.`,
    messages: [
      {
        role: 'user',
        content:
          typeof input === 'string'
            ? input.slice(0, 15_000)
            : [
                { type: 'image', source: { type: 'base64', media_type: input.mediaType, data: Buffer.from(input.data).toString('base64') } },
                { type: 'text', text: 'Voici la photo du CV.' },
              ],
      },
    ],
  });
  const cv = response.parsed_output;
  if (!cv) throw new Error('CV illisible');
  const cp = cv.codePostal?.replace(/\s/g, '') ?? '';
  const level = cv.niveauVise !== null && cv.niveauVise >= 3 && cv.niveauVise <= 7 ? (cv.niveauVise as CvGuess['level']) : null;
  return {
    job: cv.metier?.slice(0, 60) || null,
    department: departmentFromPostalCode(cp),
    city: cv.ville?.slice(0, 60) || null,
    level,
    age: cv.age !== null && cv.age >= 15 && cv.age <= 35 ? Math.round(cv.age) : null,
  };
}
