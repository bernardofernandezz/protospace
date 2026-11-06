// Roteiro do apresentador (PT/EN): uma dica e uma pergunta para a plateia por etapa do playground,
// na mesma ordem de STEPS (src/playground/store.ts). Rascunho para editar com a sua voz.
// As dicas seguem o que o simulador realmente faz (src/lib/dna.ts): PAM obrigatório, região seed, NHEJ x HDR.
import type { L } from '../i18n'

export interface ScriptNote {
  tip: string
  ask: string
}

export const SCRIPT: L<ScriptNote[]> = {
  pt: [
    {
      tip: 'O guia de 20 letras é o endereço: a Cas9 só vai aonde o guia casa com o DNA.',
      ask: 'Por que o guia tem 20 letras e não 5?',
    },
    {
      tip: 'Compare as vias: RNP age rápido e some logo; plasmídeo e vírus ficam mais tempo na célula.',
      ask: 'Qual via você escolheria para reduzir cortes no lugar errado?',
    },
    {
      tip: 'Sem o PAM ao lado, a Cas9 desiste. Peça o palpite antes de rodar a etapa.',
      ask: 'Vai cortar ou não vai? Levante a mão por cada opção.',
    },
    {
      tip: 'Mismatches perto do PAM (região seed) impedem o corte; os do outro lado costumam ser tolerados.',
      ask: 'Onde um erro de pareamento atrapalha mais, perto ou longe do PAM?',
    },
    {
      tip: 'NHEJ cola de qualquer jeito e costuma inativar o gene; HDR usa o molde e pode corrigir.',
      ask: 'Para consertar uma mutação, qual das duas vias serve? E para desligar um gene?',
    },
    {
      tip: 'Leia a eficiência e os off-targets. Reforce que os números são ilustrativos, não um protocolo real.',
      ask: 'Só porque dá para editar, deveríamos? Passe para a seção de bioética.',
    },
  ],
  en: [
    {
      tip: 'The 20-letter guide is the address: Cas9 only goes where the guide matches the DNA.',
      ask: 'Why is the guide 20 letters long and not 5?',
    },
    {
      tip: 'Compare the routes: RNP acts fast and disappears; plasmid and virus stay in the cell longer.',
      ask: 'Which route would you pick to reduce cuts in the wrong place?',
    },
    {
      tip: 'Without the PAM next to it, Cas9 gives up. Ask for a guess before running the step.',
      ask: 'Will it cut or not? Raise your hand for each option.',
    },
    {
      tip: 'Mismatches near the PAM (seed region) block the cut; those on the far side are usually tolerated.',
      ask: 'Where does a mismatch hurt most, near or far from the PAM?',
    },
    {
      tip: 'NHEJ glues the ends any which way and usually knocks the gene out; HDR uses the template and can correct it.',
      ask: 'To fix a mutation, which of the two works? And to switch a gene off?',
    },
    {
      tip: 'Read the efficiency and the off-targets. Stress that the numbers are illustrative, not a real protocol.',
      ask: 'Just because we can edit, should we? Move on to the bioethics section.',
    },
  ],
}
