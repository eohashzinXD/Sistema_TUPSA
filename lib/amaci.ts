export const orixaOptions = [
  "XANGO",
  "NANA",
  "IANSA",
  "OMULU",
  "OXOSSI",
  "IEMANJA",
  "OXUM",
  "OGUN",
  "OXALA"
] as const;

export type OrixaCode = (typeof orixaOptions)[number];

export const orixaLabels: Record<OrixaCode, string> = {
  XANGO: "Xangô",
  NANA: "Nãnã",
  IANSA: "Iansã",
  OMULU: "Omulu",
  OXOSSI: "Oxóssi",
  IEMANJA: "Iemanjá",
  OXUM: "Oxum",
  OGUN: "Ogum",
  OXALA: "Oxalá"
};
