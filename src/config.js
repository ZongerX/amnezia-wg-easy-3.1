'use strict';

const { release: { version } } = require('./package.json');

module.exports.RELEASE = version;
module.exports.PORT = process.env.PORT || '51821';
module.exports.WEBUI_HOST = process.env.WEBUI_HOST || '0.0.0.0';
module.exports.PASSWORD_HASH = process.env.PASSWORD_HASH;
module.exports.MAX_AGE = parseInt(process.env.MAX_AGE, 10) * 1000 * 60 || 0;
module.exports.WG_PATH = process.env.WG_PATH || '/etc/wireguard/';
module.exports.WG_DEVICE = process.env.WG_DEVICE || 'eth0';
module.exports.WG_HOST = process.env.WG_HOST;
module.exports.WG_PORT = process.env.WG_PORT || '51820';
module.exports.WG_CONFIG_PORT = process.env.WG_CONFIG_PORT || process.env.WG_PORT || '51820';
module.exports.WG_MTU = process.env.WG_MTU || null;
module.exports.WG_PERSISTENT_KEEPALIVE = process.env.WG_PERSISTENT_KEEPALIVE || '0';
module.exports.WG_DEFAULT_ADDRESS = process.env.WG_DEFAULT_ADDRESS || '10.8.0.x';
module.exports.WG_DEFAULT_DNS = typeof process.env.WG_DEFAULT_DNS === 'string'
  ? process.env.WG_DEFAULT_DNS
  : '1.1.1.1';
module.exports.WG_ALLOWED_IPS = process.env.WG_ALLOWED_IPS || '0.0.0.0/0, ::/0';

module.exports.WG_PRE_UP = process.env.WG_PRE_UP || '';
module.exports.WG_POST_UP = process.env.WG_POST_UP || `
iptables -t nat -A POSTROUTING -s ${module.exports.WG_DEFAULT_ADDRESS.replace('x', '0')}/24 -o ${module.exports.WG_DEVICE} -j MASQUERADE;
iptables -A INPUT -p udp -m udp --dport ${module.exports.WG_PORT} -j ACCEPT;
iptables -A FORWARD -i wg0 -j ACCEPT;
iptables -A FORWARD -o wg0 -j ACCEPT;
`.split('\n').join(' ');

module.exports.WG_PRE_DOWN = process.env.WG_PRE_DOWN || '';
module.exports.WG_POST_DOWN = process.env.WG_POST_DOWN || `
iptables -t nat -D POSTROUTING -s ${module.exports.WG_DEFAULT_ADDRESS.replace('x', '0')}/24 -o ${module.exports.WG_DEVICE} -j MASQUERADE;
iptables -D INPUT -p udp -m udp --dport ${module.exports.WG_PORT} -j ACCEPT;
iptables -D FORWARD -i wg0 -j ACCEPT;
iptables -D FORWARD -o wg0 -j ACCEPT;
`.split('\n').join(' ');
module.exports.LANG = process.env.LANG || 'en';
module.exports.UI_TRAFFIC_STATS = process.env.UI_TRAFFIC_STATS || 'false';
module.exports.UI_CHART_TYPE = process.env.UI_CHART_TYPE || 0;
module.exports.WG_ENABLE_ONE_TIME_LINKS = process.env.WG_ENABLE_ONE_TIME_LINKS || 'false';
module.exports.UI_ENABLE_SORT_CLIENTS = process.env.UI_ENABLE_SORT_CLIENTS || 'false';
module.exports.WG_ENABLE_EXPIRES_TIME = process.env.WG_ENABLE_EXPIRES_TIME || 'false';
module.exports.ENABLE_PROMETHEUS_METRICS = process.env.ENABLE_PROMETHEUS_METRICS || 'false';
module.exports.PROMETHEUS_METRICS_PASSWORD = process.env.PROMETHEUS_METRICS_PASSWORD;

module.exports.DICEBEAR_TYPE = process.env.DICEBEAR_TYPE || false;
module.exports.USE_GRAVATAR = process.env.USE_GRAVATAR || false;

// AmneziaWG parameters are generated once, on first start (no wg0.json yet),
// from AWG_PROFILE (3.1, 2.0 or 1.0). Any parameter set below overrides the
// generated value. Afterwards they live in wg0.json and are edited in the UI.
module.exports.AWG_PROFILE = process.env.AWG_PROFILE || '3.1';
module.exports.AWG_ENV = {
  jc: process.env.JC,
  jmin: process.env.JMIN,
  jmax: process.env.JMAX,
  s1: process.env.S1,
  s2: process.env.S2,
  s3: process.env.S3,
  s4: process.env.S4,
  h1: process.env.H1,
  h2: process.env.H2,
  h3: process.env.H3,
  h4: process.env.H4,
  i1: process.env.I1,
  i2: process.env.I2,
  i3: process.env.I3,
  i4: process.env.I4,
  i5: process.env.I5,
  headerProtectionKey: process.env.HEADER_PROTECTION_KEY,
  randomTrailers: process.env.RANDOM_TRAILERS,
  contentPaddingAddition: process.env.CONTENT_PADDING_ADDITION,
  rekeyAfterTime: process.env.REKEY_AFTER_TIME,
  rekeyTimeout: process.env.REKEY_TIMEOUT,
  rejectAfterTime: process.env.REJECT_AFTER_TIME,
  keepaliveTimeout: process.env.KEEPALIVE_TIMEOUT,
  maxHandshakeAttempts: process.env.MAX_HANDSHAKE_ATTEMPTS,
  disableCookies: process.env.DISABLE_COOKIES,
  persistentKeepalive: process.env.WG_PERSISTENT_KEEPALIVE,
};

module.exports.AWGGO_VERSION = process.env.AWGGO_VERSION || null;
module.exports.AWGTOOLS_VERSION = process.env.AWGTOOLS_VERSION || null;
