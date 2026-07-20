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

export type HostAddressSource =
  | 'expo-network'
  | 'android-interface'
  | 'manual-override'
  | 'self-localhost';

export type HostAddressCandidate = {
  host: string;
  interfaceName: string | null;
  source: HostAddressSource;
  isPrivate: boolean;
  isPreferredInterface: boolean;
};

export type AdvertisedHostSelection = {
  selectedHost: string | null;
  selectedInterfaceName: string | null;
  selectedSource: HostAddressSource | null;
  candidates: HostAddressCandidate[];
};

export type AddressParseResult =
  | { ok: true; value: ParsedHostAddress }
  | { ok: false; error: string };

const IPV4_PATTERN =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const HOSTNAME_PATTERN =
  /^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
const PREFERRED_INTERFACE_PARTS = ['wlan', 'wifi', 'ap', 'softap', 'swlan'];

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

function isPrivateIpv4AddressValue(host: string): boolean {
  if (!isIpv4Address(host)) {
    return false;
  }

  const [first, second] = host.split('.').map(Number);

  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 100 && second >= 64 && second <= 127)
  );
}

export function isUsableLanIpv4Address(host: string): boolean {
  const trimmedHost = host.trim();

  return (
    isIpv4Address(trimmedHost) &&
    !isLocalhostAddress(trimmedHost) &&
    isPrivateIpv4AddressValue(trimmedHost)
  );
}

export function isPrivateIpv4Address(host: string): boolean {
  return isPrivateIpv4AddressValue(host.trim());
}

export function isPreferredNetworkInterfaceName(
  interfaceName: string | null,
): boolean {
  const normalizedInterfaceName = interfaceName?.toLowerCase() ?? '';

  return PREFERRED_INTERFACE_PARTS.some(part =>
    normalizedInterfaceName.includes(part),
  );
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

export function validateAdvertisedHost(host: string): AddressParseResult {
  const trimmedHost = host.trim();

  if (!isUsableLanIpv4Address(trimmedHost)) {
    return {
      ok: false,
      error: 'Advertised Host IP must be an IPv4 LAN address, not localhost',
    };
  }

  return {
    ok: true,
    value: {
      host: trimmedHost,
      port: 1,
      address: `${trimmedHost}:1`,
    },
  };
}

function createCandidateKey(candidate: HostAddressCandidate): string {
  return `${candidate.source}:${candidate.interfaceName ?? ''}:${candidate.host}`;
}

function scoreCandidate(candidate: HostAddressCandidate): number {
  const sourceScore = candidate.source === 'expo-network' ? 300 : 0;
  const preferredInterfaceScore = candidate.isPreferredInterface ? 200 : 0;
  const privateScore = candidate.isPrivate ? 100 : 0;

  return sourceScore + preferredInterfaceScore + privateScore;
}

export function selectAdvertisedHost(
  candidates: HostAddressCandidate[],
): AdvertisedHostSelection {
  const uniqueCandidates: HostAddressCandidate[] = [];
  const seenCandidates = new Set<string>();

  candidates.forEach(candidate => {
    if (!isUsableLanIpv4Address(candidate.host)) {
      return;
    }

    const key = createCandidateKey(candidate);
    if (seenCandidates.has(key)) {
      return;
    }

    seenCandidates.add(key);
    uniqueCandidates.push(candidate);
  });

  const selectedCandidate =
    [...uniqueCandidates].sort(
      (left, right) => scoreCandidate(right) - scoreCandidate(left),
    )[0] ?? null;

  return {
    selectedHost: selectedCandidate?.host ?? null,
    selectedInterfaceName: selectedCandidate?.interfaceName ?? null,
    selectedSource: selectedCandidate?.source ?? null,
    candidates: uniqueCandidates,
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
