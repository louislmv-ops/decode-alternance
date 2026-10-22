import { z } from 'zod/v4';

export const InterviewSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().describe('Une question qu’on lui posera probablement, telle qu’un recruteur la dirait'),
        pourquoi: z.string().describe('Ce que le recruteur cherche à savoir, en une phrase'),
        commentRepondre: z.string().describe('Comment construire sa réponse, concrètement, en deux phrases maximum'),
      }),
    )
    .describe('Six questions : trois sur le poste et ses missions, deux sur la motivation et l’alternance, une piège'),
  aDemander: z.array(z.string()).describe('Trois questions malines à poser au recruteur en fin d’entretien'),
  aPreparer: z.array(z.string()).describe('Trois choses à préparer avant : un exemple, un chiffre, un document'),
});
export type Interview = z.infer<typeof InterviewSchema>;
