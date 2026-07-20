import * as XLSX from 'xlsx';

export type ImportedParticipant = {
  name: string;
  number: number;
  crew?: string;
  city?: string;
};

type WorksheetRow = Record<string, unknown>;

const HEADER_ALIASES = {
  number: ['number', 'no', '#', 'num', 'participant number', 'номер'],
  name: ['name', 'participant', 'dancer', 'full name', 'имя', 'участник'],
  crew: ['crew', 'team', 'команда', 'crew/team'],
  city: ['city', 'from', 'город'],
} as const;

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

function findValue(
  row: WorksheetRow,
  aliases: readonly string[],
): unknown {
  const entry = Object.entries(row).find(([key]) =>
    aliases.includes(normalizeHeader(key)),
  );

  return entry?.[1];
}

function readOptionalText(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const text = String(value).trim();

  return text.length > 0 ? text : undefined;
}

function readRequiredText(value: unknown): string | null {
  const text = readOptionalText(value);

  return text ?? null;
}

function readParticipantNumber(value: unknown, fallback: number): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  const text = readOptionalText(value);

  if (!text) {
    return fallback;
  }

  const parsed = Number.parseInt(text, 10);

  return Number.isInteger(parsed) ? parsed : null;
}

export function parseParticipantsExcel(
  fileData: ArrayBuffer,
): ImportedParticipant[] {
  const workbook = XLSX.read(fileData, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet) {
    return [];
  }

  const rows = XLSX.utils.sheet_to_json<WorksheetRow>(worksheet, {
    defval: '',
  });

  return rows.reduce<ImportedParticipant[]>((participants, row, index) => {
    const name = readRequiredText(findValue(row, HEADER_ALIASES.name));

    if (!name) {
      return participants;
    }

    const number = readParticipantNumber(
      findValue(row, HEADER_ALIASES.number),
      index + 1,
    );

    if (number === null) {
      return participants;
    }

    participants.push({
      name,
      number,
      crew: readOptionalText(findValue(row, HEADER_ALIASES.crew)),
      city: readOptionalText(findValue(row, HEADER_ALIASES.city)),
    });

    return participants;
  }, []);
}
