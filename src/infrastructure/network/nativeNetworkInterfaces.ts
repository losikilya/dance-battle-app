import { NativeModules, Platform } from 'react-native';

export type NativeNetworkInterfaceAddress = {
  interfaceName: string;
  address: string;
  isLoopback: boolean;
  isUp: boolean;
};

type HostNetworkInterfacesModule = {
  getNetworkInterfaces: () => Promise<NativeNetworkInterfaceAddress[]>;
};

const nativeModule = NativeModules.HostNetworkInterfaces as
  | HostNetworkInterfacesModule
  | undefined;

export async function getAndroidNetworkInterfaces(): Promise<
  NativeNetworkInterfaceAddress[]
> {
  if (Platform.OS !== 'android' || !nativeModule) {
    return [];
  }

  try {
    const interfaces = await nativeModule.getNetworkInterfaces();

    return interfaces.filter(item =>
      Boolean(item.interfaceName) &&
      Boolean(item.address) &&
      typeof item.isLoopback === 'boolean' &&
      typeof item.isUp === 'boolean',
    );
  } catch (error) {
    console.log(
      '[host-network-interfaces] failed',
      error instanceof Error ? error.message : String(error),
    );
    return [];
  }
}
