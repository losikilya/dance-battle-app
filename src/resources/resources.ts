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
  role_selection_app_name: "BATTLEFLOW",
  role_selection_title: "SELECT YOUR ROLE",
  role_selection_subtitle:
    "Choose your interface based on your event duties. You can switch roles at any time from the Control Center.",
  role_selection_pro_title: "⚡ PRO PERFORMANCE",
  role_selection_pro_body:
    "BattleFlow runs on a low-latency local network architecture, ensuring zero lag for judges and instant score distribution even without stable internet.",
  role_selection_pro_link: "How local connection works →",
  role_selection_confirm: "CONFIRM ROLE",
  role_selection_privacy: "PRIVACY POLICY",
  role_selection_docs: "TECHNICAL DOCS",
  role_selection_terms: "TERMS OF SERVICE",
  role_selection_tagline: "DESIGNED FOR THE UNDERGROUND ELITE",
  role_selection_status_online: "SYSTEMS ONLINE. LOCAL MODE",
  screen_not_exist: "This screen doesn't exist.",
};

export type Resources = keyof typeof resources;
