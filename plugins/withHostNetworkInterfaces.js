const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

const MODULE_SOURCE = `package com.selosik.dancebattleapp

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.net.Inet4Address
import java.net.NetworkInterface

class HostNetworkInterfacesModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "HostNetworkInterfaces"

  private fun isIgnoredInterfaceName(interfaceName: String): Boolean {
    val normalizedName = interfaceName.lowercase()
    val ignoredPrefixes = listOf(
      "tun",
      "tap",
      "ppp",
      "ipsec",
      "utun",
      "wg",
      "rmnet",
      "pdp",
      "ccmni",
      "wwan"
    )

    return ignoredPrefixes.any { normalizedName.startsWith(it) }
  }

  private fun isIgnoredAddress(address: Inet4Address): Boolean {
    val hostAddress = address.hostAddress ?: return true

    return hostAddress == "0.0.0.0" ||
      hostAddress.startsWith("127.") ||
      address.isLoopbackAddress
  }

  @ReactMethod
  fun getNetworkInterfaces(promise: Promise) {
    try {
      val result = Arguments.createArray()
      val interfaces = NetworkInterface.getNetworkInterfaces()

      while (interfaces.hasMoreElements()) {
        val networkInterface = interfaces.nextElement()

        if (
          !networkInterface.isUp ||
          networkInterface.isLoopback ||
          isIgnoredInterfaceName(networkInterface.name)
        ) {
          continue
        }

        val addresses = networkInterface.inetAddresses

        while (addresses.hasMoreElements()) {
          val address = addresses.nextElement()

          if (address is Inet4Address && !isIgnoredAddress(address)) {
            val item = Arguments.createMap()
            item.putString("interfaceName", networkInterface.name)
            item.putString("address", address.hostAddress)
            item.putBoolean("isLoopback", false)
            item.putBoolean("isUp", networkInterface.isUp)
            result.pushMap(item)
          }
        }
      }

      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("host_network_interfaces_failed", error)
    }
  }
}
`;

const PACKAGE_SOURCE = `package com.selosik.dancebattleapp

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class HostNetworkInterfacesPackage : ReactPackage {
  override fun createNativeModules(
    reactContext: ReactApplicationContext
  ): List<NativeModule> = listOf(HostNetworkInterfacesModule(reactContext))

  override fun createViewManagers(
    reactContext: ReactApplicationContext
  ): List<ViewManager<*, *>> = emptyList()
}
`;

function writeNativeModule(projectRoot) {
  const packageDir = path.join(
    projectRoot,
    'android',
    'app',
    'src',
    'main',
    'java',
    'com',
    'anonymous',
    'dancebattleapp',
  );

  fs.mkdirSync(packageDir, { recursive: true });
  fs.writeFileSync(
    path.join(packageDir, 'HostNetworkInterfacesModule.kt'),
    MODULE_SOURCE,
  );
  fs.writeFileSync(
    path.join(packageDir, 'HostNetworkInterfacesPackage.kt'),
    PACKAGE_SOURCE,
  );
}

function patchMainApplication(projectRoot) {
  const mainApplicationPath = path.join(
    projectRoot,
    'android',
    'app',
    'src',
    'main',
    'java',
    'com',
    'anonymous',
    'dancebattleapp',
    'MainApplication.kt',
  );

  if (!fs.existsSync(mainApplicationPath)) {
    return;
  }

  const source = fs.readFileSync(mainApplicationPath, 'utf8');

  if (source.includes('add(HostNetworkInterfacesPackage())')) {
    return;
  }

  const patchedSource = source.replace(
    '// add(MyReactNativePackage())',
    '// add(MyReactNativePackage())\n              add(HostNetworkInterfacesPackage())',
  );

  fs.writeFileSync(mainApplicationPath, patchedSource);
}

module.exports = function withHostNetworkInterfaces(config) {
  return withDangerousMod(config, [
    'android',
    config => {
      writeNativeModule(config.modRequest.projectRoot);
      patchMainApplication(config.modRequest.projectRoot);
      return config;
    },
  ]);
};
