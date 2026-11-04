package expo.modules.cybershielddevicesecurity

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.net.wifi.WifiManager
import android.os.Build
import androidx.core.content.ContextCompat
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Deliberately narrow, user-invoked Android diagnostics. This module never asks for
 * QUERY_ALL_PACKAGES, location, Bluetooth discovery, or network-capture access.
 */
class CyberShieldDeviceSecurityModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("CyberShieldDeviceSecurity")

    AsyncFunction("getApplicationAuditAsync") {
      auditLaunchableApplications()
    }

    AsyncFunction("getWifiSnapshotAsync") {
      wifiSnapshot()
    }

    AsyncFunction("getBluetoothSnapshotAsync") {
      bluetoothSnapshot()
    }

    AsyncFunction("requestBluetoothAccessAsync") { promise: Promise ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        promise.resolve(mapOf("granted" to true, "canAskAgain" to false, "status" to "granted"))
      } else {
        Permissions.askForPermissionsWithPermissionsManager(
          appContext.permissions,
          promise,
          Manifest.permission.BLUETOOTH_CONNECT
        )
      }
    }

    AsyncFunction("getBluetoothAccessAsync") { promise: Promise ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        promise.resolve(mapOf("granted" to true, "canAskAgain" to false, "status" to "granted"))
      } else {
        Permissions.getPermissionsWithPermissionsManager(
          appContext.permissions,
          promise,
          Manifest.permission.BLUETOOTH_CONNECT
        )
      }
    }
  }

  @Suppress("DEPRECATION")
  private fun auditLaunchableApplications(): Map<String, Any?> {
    val packageManager = context.packageManager
    val launcherIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    val activities = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      packageManager.queryIntentActivities(launcherIntent, PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_ALL.toLong()))
    } else {
      packageManager.queryIntentActivities(launcherIntent, PackageManager.MATCH_ALL)
    }

    val apps = activities
      .mapNotNull { it.activityInfo?.applicationInfo }
      .distinctBy { it.packageName }
      .filter { it.packageName != context.packageName }
      .map { appInfo -> applicationRecord(packageManager, appInfo) }
      .sortedBy { (it["label"] as? String)?.lowercase() ?: "" }
      .take(100)

    return mapOf(
      "apps" to apps,
      "visibleAppCount" to apps.size,
      "visibility" to "launcher-activities-only",
      "privacyNote" to "This audit uses Android launcher visibility only. It does not request QUERY_ALL_PACKAGES or upload the app inventory."
    )
  }

  @Suppress("DEPRECATION")
  private fun applicationRecord(packageManager: PackageManager, appInfo: ApplicationInfo): Map<String, Any?> {
    val packageInfo = try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        packageManager.getPackageInfo(appInfo.packageName, PackageManager.PackageInfoFlags.of(PackageManager.GET_PERMISSIONS.toLong()))
      } else {
        packageManager.getPackageInfo(appInfo.packageName, PackageManager.GET_PERMISSIONS)
      }
    } catch (_: PackageManager.NameNotFoundException) {
      null
    }
    val sensitive = packageInfo?.requestedPermissions.orEmpty()
      .mapNotNull { sensitivePermissionLabel(it) }
      .distinct()
      .take(8)
    val debuggable = appInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0
    val system = appInfo.flags and ApplicationInfo.FLAG_SYSTEM != 0
    val reviewSignals = buildList {
      if (debuggable) add("Debuggable build")
      if (sensitive.contains("Install packages")) add("Can request package installs")
      if (sensitive.contains("Overlay windows")) add("Can draw over other apps")
      if (sensitive.contains("SMS")) add("Requests SMS access")
      if (sensitive.contains("Accessibility service")) add("Declares accessibility-service capability")
    }
    return mapOf(
      "label" to appInfo.loadLabel(packageManager).toString().take(90),
      "packageName" to appInfo.packageName,
      "versionName" to (packageInfo?.versionName ?: "Version unavailable"),
      "targetSdk" to appInfo.targetSdkVersion,
      "systemApp" to system,
      "debuggable" to debuggable,
      "sensitivePermissions" to sensitive,
      "reviewSignals" to reviewSignals
    )
  }

  private fun sensitivePermissionLabel(permission: String): String? = when (permission) {
    Manifest.permission.CAMERA -> "Camera"
    Manifest.permission.RECORD_AUDIO -> "Microphone"
    Manifest.permission.READ_CONTACTS, Manifest.permission.WRITE_CONTACTS -> "Contacts"
    Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION -> "Location"
    Manifest.permission.READ_SMS, Manifest.permission.RECEIVE_SMS, Manifest.permission.SEND_SMS -> "SMS"
    Manifest.permission.READ_CALL_LOG, Manifest.permission.WRITE_CALL_LOG -> "Call log"
    Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR -> "Calendar"
    Manifest.permission.SYSTEM_ALERT_WINDOW -> "Overlay windows"
    Manifest.permission.REQUEST_INSTALL_PACKAGES -> "Install packages"
    "android.permission.BIND_ACCESSIBILITY_SERVICE" -> "Accessibility service"
    else -> null
  }

  @Suppress("DEPRECATION")
  private fun wifiSnapshot(): Map<String, Any?> {
    val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
      ?: return mapOf("supported" to false, "reason" to "Android did not provide a Wi-Fi manager.")
    val info = try {
      wifiManager.connectionInfo
    } catch (_: SecurityException) {
      null
    }
    val rawSsid = info?.ssid?.trim('"')
    val ssid = rawSsid?.takeUnless { it.isBlank() || it == "<unknown ssid>" }
    val securityType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && info != null) info.currentSecurityType else -1
    return mapOf(
      "supported" to true,
      "wifiEnabled" to wifiManager.isWifiEnabled,
      "connected" to (info != null && info.networkId != -1),
      "ssid" to ssid,
      "identityVisible" to (ssid != null),
      "rssi" to (info?.rssi ?: Int.MIN_VALUE),
      "frequencyMhz" to (info?.frequency ?: 0),
      "securityType" to securityType,
      "securityLabel" to wifiSecurityLabel(securityType),
      "privacyNote" to "SSID is shown only when Android exposes it. CyberShield does not capture traffic, DNS content, BSSID, or gateway addresses."
    )
  }

  private fun wifiSecurityLabel(value: Int): String = when (value) {
    0 -> "Open"
    1 -> "WEP"
    2 -> "WPA/WPA2 Personal"
    3 -> "WPA/WPA2 Enterprise"
    4 -> "WPA3 Personal"
    5 -> "Enhanced Open (OWE)"
    9 -> "WPA3 Enterprise"
    10 -> "WPA3 Enterprise 192-bit"
    14 -> "WPA2/WPA3 transition"
    else -> "Not exposed by Android"
  }

  @SuppressLint("MissingPermission")
  private fun bluetoothSnapshot(): Map<String, Any?> {
    val manager = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
    val adapter = manager?.adapter
    if (adapter == null) return mapOf("supported" to false, "reason" to "Bluetooth is not available on this device.")
    val accessGranted = hasBluetoothAccess()
    if (!accessGranted) {
      return mapOf(
        "supported" to true,
        "enabled" to false,
        "permissionGranted" to false,
        "pairedDevices" to emptyList<Map<String, String>>(),
        "reason" to "Nearby devices permission is required to audit paired Bluetooth devices."
      )
    }
    val paired = try {
      adapter.bondedDevices.orEmpty().map { device ->
        mapOf(
          "name" to (device.name?.take(90) ?: "Unnamed paired device"),
          "type" to bluetoothTypeLabel(device.type),
          "bondState" to bluetoothBondLabel(device.bondState)
        )
      }.sortedBy { it["name"] }.take(50)
    } catch (_: SecurityException) {
      emptyList()
    }
    return mapOf(
      "supported" to true,
      "enabled" to adapter.isEnabled,
      "permissionGranted" to true,
      "pairedDevices" to paired,
      "pairedDeviceCount" to paired.size,
      "privacyNote" to "Only paired-device names and connection types are read after your permission. Device addresses and nearby discovery results are not collected."
    )
  }

  private fun hasBluetoothAccess(): Boolean = Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
    ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED

  private fun bluetoothTypeLabel(type: Int): String = when (type) {
    BluetoothDeviceType.CLASSIC -> "Classic"
    BluetoothDeviceType.LE -> "Low Energy"
    BluetoothDeviceType.DUAL -> "Dual mode"
    else -> "Unknown type"
  }

  private fun bluetoothBondLabel(state: Int): String = when (state) {
    BluetoothDevice.BOND_BONDED -> "Paired"
    BluetoothDevice.BOND_BONDING -> "Pairing"
    else -> "Not paired"
  }
}

private object BluetoothDeviceType {
  const val CLASSIC = 1
  const val LE = 2
  const val DUAL = 3
}
