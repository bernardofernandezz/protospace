// Referências e conclusão (PT/EN). Grupos aparecem na ordem do array.
import type { L } from '../i18n'

export interface Reference {
  id: string
  /** Categoria usada para agrupar. */
  group: L
  authors: string
  year: string
  title: string
  /** Revista, órgão ou veículo. */
  source: string
  /** DOI ou URL. */
  link?: string
}

export const CONCLUSION: L<{ eyebrow: string; title: [string, string, string]; lead: string; takeaways: string[] }> = {
  pt: {
    eyebrow: 'Conclusão',
    title: ['Uma ferramenta poderosa pede ', 'perguntas à altura', '.'],
    lead: 'CRISPR tornou a edição de genomas barata, rápida e acessível. Isso amplia o alcance da pesquisa e da medicina — e, na mesma medida, a responsabilidade de quem a usa.',
    takeaways: [
      'A Cas9 corta; a célula decide. Entender o reparo é entender o resultado — e os riscos.',
      'Rigor faz parte da técnica: guias bem desenhados, controles, validação por sequenciamento e relato transparente.',
      'A pergunta ética não é só “podemos?”, mas “para quem, com que segurança e decidido por quem?”.',
    ],
  },
  en: {
    eyebrow: 'Conclusion',
    title: ['A powerful tool calls for ', 'questions to match', '.'],
    lead: 'CRISPR made genome editing cheap, fast and accessible. That widens the reach of research and medicine — and, in equal measure, the responsibility of those who use it.',
    takeaways: [
      'Cas9 cuts; the cell decides. Understanding repair means understanding the outcome — and the risks.',
      'Rigour is part of the technique: well-designed guides, controls, sequencing-based validation and transparent reporting.',
      'The ethical question is not just “can we?”, but “for whom, how safely and decided by whom?”.',
    ],
  },
}

const SEMINAL: L = { pt: 'Artigos seminais', en: 'Seminal papers' }
const TOOLS: L = { pt: 'Ferramentas, estrutura e segurança', en: 'Tools, structure and safety' }
const CLINIC: L = { pt: 'Clínica', en: 'Clinical' }
const MILESTONES: L = { pt: 'Marcos e aprovações', en: 'Milestones and approvals' }
const GUIDE: L = { pt: 'Diretrizes e relatórios', en: 'Guidelines and reports' }
const LAW: L = { pt: 'Legislação (Brasil)', en: 'Legislation (Brazil)' }

export const REFERENCES: Reference[] = [
  { id: 'ishino1987', group: SEMINAL, authors: 'Ishino Y, Shinagawa H, Makino K, Amemura M, Nakata A', year: '1987', title: 'Nucleotide sequence of the iap gene, responsible for alkaline phosphatase isozyme conversion in Escherichia coli, and identification of the gene product', source: 'Journal of Bacteriology 169:5429–5433', link: 'https://doi.org/10.1128/jb.169.12.5429-5433.1987' },
  { id: 'jansen2002', group: SEMINAL, authors: 'Jansen R, van Embden JDA, Gaastra W, Schouls LM', year: '2002', title: 'Identification of genes that are associated with DNA repeats in prokaryotes', source: 'Molecular Microbiology 43:1565–1575', link: 'https://doi.org/10.1046/j.1365-2958.2002.02839.x' },
  { id: 'mojica2005', group: SEMINAL, authors: 'Mojica FJM, Díez-Villaseñor C, García-Martínez J, Soria E', year: '2005', title: 'Intervening sequences of regularly spaced prokaryotic repeats derive from foreign genetic elements', source: 'Journal of Molecular Evolution 60:174–182', link: 'https://doi.org/10.1007/s00239-004-0046-3' },
  { id: 'barrangou2007', group: SEMINAL, authors: 'Barrangou R, Fremaux C, Deveau H, et al.', year: '2007', title: 'CRISPR provides acquired resistance against viruses in prokaryotes', source: 'Science 315:1709–1712', link: 'https://doi.org/10.1126/science.1138140' },
  { id: 'deltcheva2011', group: SEMINAL, authors: 'Deltcheva E, Chylinski K, Sharma CM, et al.', year: '2011', title: 'CRISPR RNA maturation by trans-encoded small RNA and host factor RNase III', source: 'Nature 471:602–607', link: 'https://doi.org/10.1038/nature09886' },
  { id: 'jinek2012', group: SEMINAL, authors: 'Jinek M, Chylinski K, Fonfara I, Hauer M, Doudna JA, Charpentier E', year: '2012', title: 'A programmable dual-RNA–guided DNA endonuclease in adaptive bacterial immunity', source: 'Science 337:816–821', link: 'https://doi.org/10.1126/science.1225829' },
  { id: 'gasiunas2012', group: SEMINAL, authors: 'Gasiunas G, Barrangou R, Horvath P, Siksnys V', year: '2012', title: 'Cas9–crRNA ribonucleoprotein complex mediates specific DNA cleavage for adaptive immunity in bacteria', source: 'PNAS 109:E2579–E2586', link: 'https://doi.org/10.1073/pnas.1208507109' },
  { id: 'cong2013', group: SEMINAL, authors: 'Cong L, Ran FA, Cox D, et al.', year: '2013', title: 'Multiplex genome engineering using CRISPR/Cas systems', source: 'Science 339:819–823', link: 'https://doi.org/10.1126/science.1231143' },
  { id: 'mali2013', group: SEMINAL, authors: 'Mali P, Yang L, Esvelt KM, et al.', year: '2013', title: 'RNA-guided human genome engineering via Cas9', source: 'Science 339:823–826', link: 'https://doi.org/10.1126/science.1232033' },
  { id: 'nishimasu2014', group: TOOLS, authors: 'Nishimasu H, Ran FA, Hsu PD, et al.', year: '2014', title: 'Crystal structure of Cas9 in complex with guide RNA and target DNA', source: 'Cell 156:935–949', link: 'https://doi.org/10.1016/j.cell.2014.02.001' },
  { id: 'sternberg2014', group: TOOLS, authors: 'Sternberg SH, Redding S, Jinek M, Greene EC, Doudna JA', year: '2014', title: 'DNA interrogation by the CRISPR RNA-guided endonuclease Cas9', source: 'Nature 507:62–67', link: 'https://doi.org/10.1038/nature13011' },
  { id: 'komor2016', group: TOOLS, authors: 'Komor AC, Kim YB, Packer MS, Zuris JA, Liu DR', year: '2016', title: 'Programmable editing of a target base in genomic DNA without double-stranded DNA cleavage', source: 'Nature 533:420–424', link: 'https://doi.org/10.1038/nature17946' },
  { id: 'kosicki2018', group: TOOLS, authors: 'Kosicki M, Tomberg K, Bradley A', year: '2018', title: 'Repair of double-strand breaks induced by CRISPR–Cas9 leads to large deletions and complex rearrangements', source: 'Nature Biotechnology 36:765–771', link: 'https://doi.org/10.1038/nbt.4192' },
  { id: 'anzalone2019', group: TOOLS, authors: 'Anzalone AV, Randolph PB, Davis JR, et al.', year: '2019', title: 'Search-and-replace genome editing without double-strand breaks or donor DNA', source: 'Nature 576:149–157', link: 'https://doi.org/10.1038/s41586-019-1711-4' },
  { id: 'frangoul2021', group: CLINIC, authors: 'Frangoul H, Altshuler D, Cappellini MD, et al.', year: '2021', title: 'CRISPR-Cas9 gene editing for sickle cell disease and β-thalassemia', source: 'New England Journal of Medicine 384:252–260', link: 'https://doi.org/10.1056/NEJMoa2031054' },
  { id: 'musunuru2025', group: CLINIC, authors: 'Musunuru K, Grandinette SA, Wang X, et al.', year: '2025', title: 'Patient-specific in vivo gene editing to treat a rare genetic disease', source: 'New England Journal of Medicine 392:2235–2243', link: 'https://doi.org/10.1056/NEJMoa2504747' },
  { id: 'nobel2020', group: MILESTONES, authors: 'The Royal Swedish Academy of Sciences', year: '2020', title: 'The Nobel Prize in Chemistry 2020 — press release', source: 'nobelprize.org', link: 'https://www.nobelprize.org/prizes/chemistry/2020/press-release/' },
  { id: 'mhra2023', group: MILESTONES, authors: 'Medicines and Healthcare products Regulatory Agency (MHRA)', year: '2023', title: 'MHRA authorises world-first gene therapy that aims to cure sickle-cell disease and transfusion-dependent β-thalassemia', source: 'GOV.UK', link: 'https://www.gov.uk/government/news/mhra-authorises-world-first-gene-therapy-that-aims-to-cure-sickle-cell-disease-and-transfusion-dependent-thalassemia' },
  { id: 'fda2023', group: MILESTONES, authors: 'U.S. Food and Drug Administration', year: '2023', title: 'FDA approves first gene therapies to treat patients with sickle cell disease', source: 'FDA News Release', link: 'https://www.fda.gov/news-events/press-announcements/fda-approves-first-gene-therapies-treat-patients-sickle-cell-disease' },
  { id: 'nasem2017', group: GUIDE, authors: 'National Academies of Sciences, Engineering, and Medicine', year: '2017', title: 'Human Genome Editing: Science, Ethics, and Governance', source: 'The National Academies Press', link: 'https://doi.org/10.17226/24623' },
  { id: 'who2021', group: GUIDE, authors: 'World Health Organization', year: '2021', title: 'Human genome editing: a framework for governance', source: 'WHO, Geneva', link: 'https://www.who.int/publications/i/item/9789240030060' },
  { id: 'lei11105', group: LAW, authors: 'Brasil', year: '2005', title: 'Lei nº 11.105, de 24 de março de 2005 (Lei de Biossegurança)', source: 'Diário Oficial da União', link: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11105.htm' },
  { id: 'rn16', group: LAW, authors: 'CTNBio — Comissão Técnica Nacional de Biossegurança', year: '2018', title: 'Resolução Normativa nº 16, de 15 de janeiro de 2018 (Técnicas Inovadoras de Melhoramento de Precisão)', source: 'Diário Oficial da União' },
]
