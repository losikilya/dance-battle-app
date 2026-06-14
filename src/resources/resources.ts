export const resources = {
  content_not_found: "Content not found",
  go_home: "Go to home screen!",
  initial_setup: "Initial Setup",
  judging_connected_devices: "Connected Devices",
  judging_ip_address: "IP ADDRESS",
  judging_live_stream: "LIVE STREAM FEED",
  judging_port: "PORT",
  judging_refresh: "Refresh Connections",
  judging_scan_to_join: "SCAN TO JOIN",
  judging_subtitle: "Host Admin Control Connection",
  judging_total: "TOTAL:",
  judging_wifi_warning:
    "All devices must be connected to the same Wi-Fi network to establish a stable connection.",
  offline: "OFFLINE",
  online: "ONLINE",
  role_adjudicator: "ADJUDICATOR",
  role_mc: "MASTER OF CEREMONY",
  role_spectator: "SPECTATOR",
  role_spectators: "Spectators",
  screen_not_exist: "This screen doesn't exist.",
};

export type Resources = keyof typeof resources;
