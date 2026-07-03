import * as Network from 'expo-network';

import {
  isPreferredNetworkInterfaceName,
  isPrivateIpv4Address,
  isUsableLanIpv4Address,
  selectAdvertisedHost,
  type AdvertisedHostSelection,
  type HostAddressCandidate,
} from './connectionAddress';
import { getAndroidNetworkInterfaces } from './nativeNetworkInterfaces';

const VPN_INTERFACE_PREFIXES = ['tun', 'tap', 'ppp', 'ipsec', 'utun', 'wg'];
const CELLULAR_INTERFACE_PREFIXES = ['rmnet', 'pdp', 'ccmni', 'wwan'];

function isIgnoredInterfaceName(interfaceName: string): boolean {
  const normalizedInterfaceName = interfaceName.toLowerCase();

  return [...VPN_INTERFACE_PREFIXES, ...CELLULAR_INTERFACE_PREFIXES].some(
    prefix => normalizedInterfaceName.startsWith(prefix),
  );
}

export async function resolveAdvertisedHost(): Promise<AdvertisedHostSelection> {
  const candidates: HostAddressCandidate[] = [];

  try {
    const expoIp = (await Network.getIpAddressAsync()).trim();

    if (isUsableLanIpv4Address(expoIp)) {
      candidates.push({
        host: expoIp,
        interfaceName: null,
        source: 'expo-network',
        isPrivate: isPrivateIpv4Address(expoIp),
        isPreferredInterface: false,
      });
    }
  } catch (error) {
    console.log(
      '[host-address-resolver] expo-network failed',
      error instanceof Error ? error.message : String(error),
    );
  }

  const nativeInterfaces = await getAndroidNetworkInterfaces();

  nativeInterfaces.forEach(item => {
    if (
      !item.isUp ||
      item.isLoopback ||
      isIgnoredInterfaceName(item.interfaceName) ||
      !isUsableLanIpv4Address(item.address)
    ) {
      return;
    }

    candidates.push({
      host: item.address,
      interfaceName: item.interfaceName,
      source: 'android-interface',
      isPrivate: isPrivateIpv4Address(item.address),
      isPreferredInterface: isPreferredNetworkInterfaceName(
        item.interfaceName,
      ),
    });
  });

  return selectAdvertisedHost(candidates);
}
