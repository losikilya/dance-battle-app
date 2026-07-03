export type HostConnectionPayload = {
  version: 1;
  host: string;
  port: number;
};

export type ParsedHostAddress = {
  host: string;
  port: number;
  address: string;
};

export type AddressParseResult =
  | { ok: true; value: ParsedHostAddress }
  | { ok: false; error: string };

const IPV4_PATTERN =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const HOSTNAME_PATTERN =
  /^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

export function isIpv4Address(host: string): boolean {
  return IPV4_PATTERN.test(host.trim());
}

export function isLocalhostAddress(host: string): boolean {
  const normalizedHost = host.trim().toLowerCase();

  return (
    normalizedHost === 'localhost' ||
    normalizedHost === '0.0.0.0' ||
    normalizedHost.startsWith('127.')
  );
}

export function isUsableLanIpv4Address(host: string): boolean {
  const trimmedHost = host.trim();

  return isIpv4Address(trimmedHost) && !isLocalhostAddress(trimmedHost);
}

function isValidHost(host: string): boolean {
  const trimmedHost = host.trim();

  return (
    trimmedHost.length > 0 &&
    !isLocalhostAddress(trimmedHost) &&
    (isIpv4Address(trimmedHost) || HOSTNAME_PATTERN.test(trimmedHost))
  );
}

function parsePort(value: unknown): number | null {
  const port =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.trim())
        : NaN;

  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : null;
}

export function parseManualAddress(address: string): AddressParseResult {
  const trimmedAddress = address.trim();
  const separatorIndex = trimmedAddress.lastIndexOf(':');

  if (separatorIndex <= 0 || separatorIndex === trimmedAddress.length - 1) {
    return {
      ok: false,
      error: 'Server address must use the format host:port',
    };
  }

  const host = trimmedAddress.slice(0, separatorIndex).trim();
  const port = parsePort(trimmedAddress.slice(separatorIndex + 1));

  if (!isValidHost(host)) {
    return {
      ok: false,
      error: 'Use the Host LAN IP or hostname, not localhost',
    };
  }

  if (port === null) {
    return {
      ok: false,
      error: 'Port must be a number between 1 and 65535',
    };
  }

  return {
    ok: true,
    value: {
      host,
      port,
      address: `${host}:${port}`,
    },
  };
}

export function createQrPayload(host: string, port: number): string | null {
  if (!isUsableLanIpv4Address(host) || parsePort(port) === null) {
    return null;
  }

  const payload: HostConnectionPayload = {
    version: 1,
    host: host.trim(),
    port,
  };

  return JSON.stringify(payload);
}

export function parseQrPayload(data: string): AddressParseResult {
  const trimmedData = data.trim();

  if (trimmedData.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmedData) as Partial<HostConnectionPayload>;

      if (parsed.version !== 1) {
        return { ok: false, error: 'Unsupported QR payload version' };
      }

      if (typeof parsed.host !== 'string') {
        return { ok: false, error: 'QR payload is missing a Host address' };
      }

      const port = parsePort(parsed.port);
      if (!isUsableLanIpv4Address(parsed.host)) {
        return {
          ok: false,
          error: 'QR payload must contain the Host LAN IP',
        };
      }

      if (port === null) {
        return {
          ok: false,
          error: 'QR payload has an invalid port',
        };
      }

      return {
        ok: true,
        value: {
          host: parsed.host.trim(),
          port,
          address: `${parsed.host.trim()}:${port}`,
        },
      };
    } catch {
      return { ok: false, error: 'QR payload is not valid JSON' };
    }
  }

  return parseManualAddress(trimmedData);
}
