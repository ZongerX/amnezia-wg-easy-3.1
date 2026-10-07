/* eslint-disable no-console */
/* eslint-disable no-alert */
/* eslint-disable no-undef */
/* eslint-disable no-new */

'use strict';

function bytes(bytes, decimals, kib, maxunit) {
  kib = kib || false;
  if (bytes === 0) return '0 B';
  if (Number.isNaN(parseFloat(bytes)) && !Number.isFinite(bytes)) return 'NaN';
  const k = kib ? 1024 : 1000;
  const dm = decimals != null && !Number.isNaN(decimals) && decimals >= 0 ? decimals : 2;
  const sizes = kib
    ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB', 'BiB']
    : ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB', 'BB'];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  if (maxunit !== undefined) {
    const index = sizes.indexOf(maxunit);
    if (index !== -1) i = index;
  }
  // eslint-disable-next-line no-restricted-properties
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Sorts an array of objects by a specified property in ascending or descending order.
 *
 * @param {Array} array - The array of objects to be sorted.
 * @param {string} property - The property to sort the array by.
 * @param {boolean} [sort=true] - Whether to sort the array in ascending (default) or descending order.
 * @return {Array} - The sorted array of objects.
 */
function sortByProperty(array, property, sort = true) {
  if (sort) {
    return array.sort((a, b) => (typeof a[property] === 'string' ? a[property].localeCompare(b[property]) : a[property] - b[property]));
  }

  return array.sort((a, b) => (typeof a[property] === 'string' ? b[property].localeCompare(a[property]) : b[property] - a[property]));
}

const i18n = new VueI18n({
  locale: localStorage.getItem('lang') || 'en',
  fallbackLocale: 'en',
  messages,
});

const UI_CHART_TYPES = [
  { type: false, strokeWidth: 0 },
  { type: 'line', strokeWidth: 3 },
  { type: 'area', strokeWidth: 0 },
  { type: 'bar', strokeWidth: 0 },
];

const CHART_COLORS = {
  rx: { light: 'rgba(128,128,128,0.3)', dark: 'rgba(255,255,255,0.3)' },
  tx: { light: 'rgba(128,128,128,0.4)', dark: 'rgba(255,255,255,0.3)' },
  gradient: { light: ['rgba(0,0,0,1.0)', 'rgba(0,0,0,1.0)'], dark: ['rgba(128,128,128,0)', 'rgba(128,128,128,0)'] },
};

// AmneziaWG settings window. Placeholders show what an empty field means.
const AWG_FIELDS = {
  shared: [
    { key: 's1', label: 'S1', placeholder: '0' },
    { key: 's2', label: 'S2', placeholder: '0' },
    { key: 's3', label: 'S3', placeholder: '0' },
    { key: 's4', label: 'S4', placeholder: '0' },
    { key: 'h1', label: 'H1', placeholder: '1' },
    { key: 'h2', label: 'H2', placeholder: '2' },
    { key: 'h3', label: 'H3', placeholder: '3' },
    { key: 'h4', label: 'H4', placeholder: '4' },
    {
      key: 'headerProtectionKey', label: 'HeaderProtectionKey', type: 'key', wide: true, placeholder: 'off',
    },
    { key: 'randomTrailers', label: 'RandomTrailers', type: 'bool' },
  ],
  client: [
    { key: 'jc', label: 'Jc', placeholder: '0' },
    { key: 'jmin', label: 'Jmin', placeholder: '0' },
    { key: 'jmax', label: 'Jmax', placeholder: '0' },
    { key: 'persistentKeepalive', label: 'PersistentKeepalive', placeholder: '0' },
    { key: 'rekeyAfterTime', label: 'RekeyAfterTime', placeholder: '120' },
    { key: 'rekeyTimeout', label: 'RekeyTimeout', placeholder: '5' },
    { key: 'rejectAfterTime', label: 'RejectAfterTime', placeholder: '180' },
    { key: 'keepaliveTimeout', label: 'KeepaliveTimeout', placeholder: '10' },
    { key: 'maxHandshakeAttempts', label: 'MaxHandshakeAttempts', placeholder: '18' },
    { key: 'contentPaddingAddition', label: 'ContentPaddingAddition', placeholder: 'off' },
    { key: 'disableCookies', label: 'DisableCookies', type: 'bool' },
  ],
  cps: ['i1', 'i2', 'i3', 'i4', 'i5'].map((key) => ({
    key, label: key.toUpperCase(), type: 'cps', wide: true, placeholder: '<r 2><b 0x...>',
  })),
};

const AWG_PROFILES = ['3.1', '2.0', '1.0'];

// Values from the API -> form strings ('' = unset); booleans stay booleans.
function awgParamsToForm(params) {
  const form = {};
  for (const [key, value] of Object.entries(params)) {
    form[key] = typeof value === 'boolean' ? value : (value ?? '').toString();
  }
  return form;
}

function randomBase64Key() {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

// Placeholder names for new clients, e.g. "Happy Mike".
const NAME_ADJECTIVES = [
  'amber', 'brave', 'calm', 'clever', 'cloudy', 'cosmic', 'crispy', 'dreamy', 'frosty', 'fuzzy',
  'gentle', 'golden', 'happy', 'jolly', 'lucky', 'lunar', 'mellow', 'mighty', 'misty', 'nimble',
  'noble', 'polar', 'quiet', 'rapid', 'rusty', 'shiny', 'silent', 'silver', 'sleepy', 'snowy',
  'spicy', 'stormy', 'sunny', 'swift', 'tiny', 'velvet', 'wild', 'windy', 'witty', 'zesty',
];
const NAME_NOUNS = [
  'alex', 'anna', 'artem', 'boris', 'dasha', 'egor', 'eva', 'felix', 'gleb', 'hugo',
  'igor', 'ilya', 'ivan', 'kate', 'kira', 'leo', 'lev', 'lily', 'maria', 'mark',
  'max', 'mike', 'mila', 'nika', 'nina', 'oleg', 'olga', 'pavel', 'polina', 'roma',
  'sam', 'sasha', 'sofia', 'tanya', 'tom', 'vera', 'vlad', 'yana', 'yuri', 'zoe',
];

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function randomClientName() {
  return `${capitalize(randomItem(NAME_ADJECTIVES))} ${capitalize(randomItem(NAME_NOUNS))}`;
}

// Lifetimes for temporary clients, in milliseconds.
const EXPIRY_PRESETS = {
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

// navigator.clipboard only exists on HTTPS/localhost and may still be denied;
// the panel is usually opened over plain HTTP, so fall back to execCommand('copy').
async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (err) {
      console.warn('Clipboard API failed, falling back to execCommand:', err);
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    if (!document.execCommand('copy')) throw new Error('Copy command was rejected');
  } finally {
    document.body.removeChild(textarea);
  }
}

new Vue({
  el: '#app',
  components: {
    apexchart: VueApexCharts,
  },
  i18n,
  data: {
    authenticated: null,
    authenticating: false,
    password: null,
    requiresPassword: null,
    remember: false,
    rememberMeEnabled: false,

    clients: null,
    clientsPersist: {},
    clientDelete: null,
    clientCreate: null,
    clientCreateName: '',
    clientCreatePlaceholder: '',
    clientCreateExpiry: 'never',
    clientCreateExpiryCustom: '',
    clientCreateDeleteOnExpire: false,
    clientInfoId: null,
    clientInfoChartFrozen: null,
    vpnLink: null,
    vpnLinkCopied: null,
    versions: null,
    clientEditName: null,
    clientEditNameId: null,
    clientEditAddress: null,
    clientEditAddressId: null,
    clientEditExpireDate: null,
    clientEditExpireDateId: null,
    qrcode: null,

    awgFields: AWG_FIELDS,
    awgProfiles: AWG_PROFILES,
    awgSettingsOpen: false,
    awgForm: {},
    awgErrors: {},
    awgProfile: null,
    awgVersions: {},
    awgDefaultKeepalive: '0',
    awgSaving: false,

    currentRelease: null,
    latestRelease: null,

    uiTrafficStats: false,

    uiChartType: 0,
    avatarSettings: {
      'dicebear': null,
      'gravatar': false,
    },
    enableOneTimeLinks: false,
    enableSortClient: false,
    sortClient: true, // Sort clients by name, true = asc, false = desc
    enableExpireTime: false,

    uiShowCharts: localStorage.getItem('uiShowCharts') !== '0',
    uiTheme: localStorage.theme || 'auto',
    prefersDarkScheme: window.matchMedia('(prefers-color-scheme: dark)'),

    chartOptions: {
      chart: {
        background: 'transparent',
        stacked: false,
        toolbar: {
          show: false,
        },
        animations: {
          enabled: false,
        },
        parentHeightOffset: 0,
        sparkline: {
          enabled: true,
        },
      },
      colors: [],
      stroke: {
        curve: 'smooth',
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'vertical',
          shadeIntensity: 0,
          gradientToColors: CHART_COLORS.gradient[this.theme],
          inverseColors: false,
          opacityTo: 0,
          stops: [0, 100],
        },
      },
      dataLabels: {
        enabled: false,
      },
      plotOptions: {
        bar: {
          horizontal: false,
        },
      },
      xaxis: {
        labels: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          show: false,
        },
        min: 0,
      },
      tooltip: {
        enabled: false,
      },
      legend: {
        show: false,
      },
      grid: {
        show: false,
        padding: {
          left: -10,
          right: 0,
          bottom: -15,
          top: -15,
        },
        column: {
          opacity: 0,
        },
        xaxis: {
          lines: {
            show: false,
          },
        },
      },
    },

  },
  methods: {
    dateTime: (value) => {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }).format(value);
    },
    async refresh({
      updateCharts = false,
    } = {}) {
      if (!this.authenticated) return;

      const clients = await this.api.getClients();
      this.clients = clients.map((client) => {
        if (client.name.includes('@') && client.name.includes('.') && this.avatarSettings.gravatar) {
          client.avatar = `https://gravatar.com/avatar/${sha256(client.name.toLowerCase().trim())}.jpg`;
        } else if (this.avatarSettings.dicebear) {
          client.avatar = `https://api.dicebear.com/9.x/${this.avatarSettings.dicebear}/svg?seed=${sha256(client.name.toLowerCase().trim())}`
        }

        if (!this.clientsPersist[client.id]) {
          this.clientsPersist[client.id] = {};
          this.clientsPersist[client.id].transferRxHistory = Array(50).fill(0);
          this.clientsPersist[client.id].transferRxPrevious = client.transferRx;
          this.clientsPersist[client.id].transferTxHistory = Array(50).fill(0);
          this.clientsPersist[client.id].transferTxPrevious = client.transferTx;
        }

        // Debug
        // client.transferRx = this.clientsPersist[client.id].transferRxPrevious + Math.random() * 1000;
        // client.transferTx = this.clientsPersist[client.id].transferTxPrevious + Math.random() * 1000;
        // client.latestHandshakeAt = new Date();
        // this.requiresPassword = true;

        this.clientsPersist[client.id].transferRxCurrent = client.transferRx - this.clientsPersist[client.id].transferRxPrevious;
        this.clientsPersist[client.id].transferRxPrevious = client.transferRx;
        this.clientsPersist[client.id].transferTxCurrent = client.transferTx - this.clientsPersist[client.id].transferTxPrevious;
        this.clientsPersist[client.id].transferTxPrevious = client.transferTx;

        if (updateCharts) {
          this.clientsPersist[client.id].transferRxHistory.push(this.clientsPersist[client.id].transferRxCurrent);
          this.clientsPersist[client.id].transferRxHistory.shift();

          this.clientsPersist[client.id].transferTxHistory.push(this.clientsPersist[client.id].transferTxCurrent);
          this.clientsPersist[client.id].transferTxHistory.shift();

          this.clientsPersist[client.id].transferTxSeries = [{
            name: 'Tx',
            data: this.clientsPersist[client.id].transferTxHistory,
          }];

          this.clientsPersist[client.id].transferRxSeries = [{
            name: 'Rx',
            data: this.clientsPersist[client.id].transferRxHistory,
          }];
        }

        // Kept on every refresh: the client info window charts the history too.
        client.transferTxHistory = this.clientsPersist[client.id].transferTxHistory;
        client.transferRxHistory = this.clientsPersist[client.id].transferRxHistory;
        client.transferMax = Math.max(...client.transferTxHistory, ...client.transferRxHistory);

        client.transferTxSeries = this.clientsPersist[client.id].transferTxSeries;
        client.transferRxSeries = this.clientsPersist[client.id].transferRxSeries;

        client.transferTxCurrent = this.clientsPersist[client.id].transferTxCurrent;
        client.transferRxCurrent = this.clientsPersist[client.id].transferRxCurrent;

        client.hoverTx = this.clientsPersist[client.id].hoverTx;
        client.hoverRx = this.clientsPersist[client.id].hoverRx;

        return client;
      });

      if (this.enableSortClient) {
        this.clients = sortByProperty(this.clients, 'name', this.sortClient);
      }
    },
    login(e) {
      e.preventDefault();

      if (!this.password) return;
      if (this.authenticating) return;

      this.authenticating = true;
      this.api.createSession({
        password: this.password,
        remember: this.remember,
      })
        .then(async () => {
          const session = await this.api.getSession();
          this.authenticated = session.authenticated;
          this.requiresPassword = session.requiresPassword;
          return this.refresh();
        })
        .catch((err) => {
          alert(err.message || err.toString());
        })
        .finally(() => {
          this.authenticating = false;
          this.password = null;
        });
    },
    logout(e) {
      e.preventDefault();

      this.api.deleteSession()
        .then(() => {
          this.authenticated = false;
          this.clients = null;
        })
        .catch((err) => {
          alert(err.message || err.toString());
        });
    },
    openClientCreate() {
      this.clientCreateName = '';
      this.clientCreatePlaceholder = randomClientName();
      this.clientCreateExpiry = 'never';
      this.clientCreateExpiryCustom = '';
      this.clientCreateDeleteOnExpire = false;
      this.clientCreate = true;
      this.$nextTick(() => {
        if (this.$refs.clientCreateNameInput) this.$refs.clientCreateNameInput.focus();
      });
    },
    clientCreateExpiresAt() {
      if (this.clientCreateExpiry === 'custom') {
        return this.clientCreateExpiryCustom
          ? new Date(this.clientCreateExpiryCustom).toISOString()
          : null;
      }
      const lifetime = EXPIRY_PRESETS[this.clientCreateExpiry];
      return lifetime ? new Date(Date.now() + lifetime).toISOString() : null;
    },
    createClient() {
      // An empty field means "use the suggested name from the placeholder".
      const name = this.clientCreateName || this.clientCreatePlaceholder;
      if (!name) return;
      if (this.clientCreateExpiry === 'custom' && !this.clientCreateExpiryCustom) return;

      const expiresAt = this.clientCreateExpiresAt();
      const deleteOnExpire = expiresAt !== null && this.clientCreateDeleteOnExpire;
      this.clientCreate = null;

      this.api.createClient({ name, expiresAt, deleteOnExpire })
        .catch((err) => alert(err.message || err.toString()))
        .finally(() => this.refresh().catch(console.error));
    },
    openClientInfo(client, event) {
      // Clicks on buttons, toggles and inline editors keep their own meaning.
      if (event.target.closest('button, a, input, textarea, select, [data-no-info]')) return;
      if (window.getSelection().toString()) return;
      this.clientInfoChartFrozen = null;
      this.clientInfoId = client.id;
    },
    showVpnLink(client) {
      this.vpnLink = null;
      this.vpnLinkCopied = null;
      this.api.getClientVpnLink({ clientId: client.id })
        .then(({ link }) => {
          this.vpnLink = link;
          return this.copyVpnLink();
        })
        .catch((err) => alert(err.message || err.toString()));
    },
    copyVpnLink() {
      return copyToClipboard(this.vpnLink)
        .then(() => {
          this.vpnLinkCopied = true;
        })
        .catch((err) => {
          console.error(err);
          this.vpnLinkCopied = false;
          this.$nextTick(() => {
            if (this.$refs.vpnLinkText) this.$refs.vpnLinkText.select();
          });
        });
    },
    loadVersions() {
      this.api.getVersions()
        .then((versions) => {
          this.versions = versions;
        })
        .catch(console.error);
    },
    deleteClient(client) {
      this.api.deleteClient({ clientId: client.id })
        .catch((err) => alert(err.message || err.toString()))
        .finally(() => this.refresh().catch(console.error));
    },
    showOneTimeLink(client) {
      this.api.showOneTimeLink({ clientId: client.id })
        .catch((err) => alert(err.message || err.toString()))
        .finally(() => this.refresh().catch(console.error));
    },
    enableClient(client) {
      this.api.enableClient({ clientId: client.id })
        .catch((err) => alert(err.message || err.toString()))
        .finally(() => this.refresh().catch(console.error));
    },
    disableClient(client) {
      this.api.disableClient({ clientId: client.id })
        .catch((err) => alert(err.message || err.toString()))
        .finally(() => this.refresh().catch(console.error));
    },
    updateClientName(client, name) {
      this.api.updateClientName({ clientId: client.id, name })
        .catch((err) => alert(err.message || err.toString()))
        .finally(() => this.refresh().catch(console.error));
    },
    updateClientAddress(client, address) {
      this.api.updateClientAddress({ clientId: client.id, address })
        .catch((err) => alert(err.message || err.toString()))
        .finally(() => this.refresh().catch(console.error));
    },
    updateClientExpireDate(client, expireDate) {
      this.api.updateClientExpireDate({ clientId: client.id, expireDate })
        .catch((err) => alert(err.message || err.toString()))
        .finally(() => this.refresh().catch(console.error));
    },
    restoreConfig(e) {
      e.preventDefault();
      const file = e.currentTarget.files.item(0);
      if (file) {
        file.text()
          .then((content) => {
            this.api.restoreConfiguration(content)
              .then((_result) => alert('The configuration was updated.'))
              .catch((err) => alert(err.message || err.toString()))
              .finally(() => this.refresh().catch(console.error));
          })
          .catch((err) => alert(err.message || err.toString()));
      } else {
        alert('Failed to load your file!');
      }
    },
    openAwgSettings() {
      this.api.getAwgSettings()
        .then((settings) => {
          this.awgForm = awgParamsToForm(settings.params);
          this.awgProfile = settings.profile;
          this.awgVersions = settings.versions;
          this.awgDefaultKeepalive = settings.defaultPersistentKeepalive;
          this.awgErrors = {};
          this.awgSettingsOpen = true;
        })
        .catch((err) => alert(err.message || err.toString()));
    },
    generateAwgSettings(profile) {
      this.api.generateAwgSettings(profile)
        .then((params) => {
          this.awgForm = awgParamsToForm(params);
          this.awgErrors = {};
        })
        .catch((err) => alert(err.message || err.toString()));
    },
    generateAwgHeaderProtectionKey() {
      this.awgForm.headerProtectionKey = randomBase64Key();
    },
    saveAwgSettings() {
      this.awgSaving = true;
      this.api.updateAwgSettings(this.awgForm)
        .then(() => {
          this.awgSettingsOpen = false;
          alert(this.$t('awgSaved'));
        })
        .catch((err) => {
          if (err.data && err.data.errors) {
            this.awgErrors = err.data.errors;
          } else {
            alert(err.message || err.toString());
          }
        })
        .finally(() => {
          this.awgSaving = false;
          this.refresh().catch(console.error);
        });
    },
    toggleTheme() {
      const themes = ['light', 'dark', 'auto'];
      const currentIndex = themes.indexOf(this.uiTheme);
      const newIndex = (currentIndex + 1) % themes.length;
      this.uiTheme = themes[newIndex];
      localStorage.theme = this.uiTheme;
      this.setTheme(this.uiTheme);
    },
    setTheme(theme) {
      const { classList } = document.documentElement;
      const shouldAddDarkClass = theme === 'dark' || (theme === 'auto' && this.prefersDarkScheme.matches);
      classList.toggle('dark', shouldAddDarkClass);
    },
    handlePrefersChange(e) {
      if (localStorage.theme === 'auto') {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    },
    toggleCharts() {
      localStorage.setItem('uiShowCharts', this.uiShowCharts ? 1 : 0);
    },
  },
  filters: {
    bytes,
    timeago: (value) => {
      return timeago.format(value, i18n.locale);
    },
    expiredDateFormat: (value) => {
      if (value === null) return i18n.t('Permanent');
      const dateTime = new Date(value);
      const options = {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      };
      return dateTime.toLocaleString(i18n.locale, options);
    },
    expiredDateEditFormat: (value) => {
      if (value === null) return 'yyyy-MM-dd';
    },
  },
  watch: {
    authenticated(value) {
      if (value === true) this.loadVersions();
    },
  },
  mounted() {
    this.prefersDarkScheme.addListener(this.handlePrefersChange);
    this.setTheme(this.uiTheme);

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      this.clientInfoId = null;
      this.vpnLink = null;
      this.clientCreate = null;
    });

    this.api = new API();
    this.api.getSession()
      .then((session) => {
        this.authenticated = session.authenticated;
        this.requiresPassword = session.requiresPassword;
        this.refresh({
          updateCharts: true,
        }).catch((err) => {
          alert(err.message || err.toString());
        });
      })
      .catch((err) => {
        alert(err.message || err.toString());
      });

    this.api.getRememberMeEnabled()
      .then((rememberMeEnabled) => {
        this.rememberMeEnabled = rememberMeEnabled;
      });

    setInterval(() => {
      this.refresh({
        updateCharts: true,
      }).catch(console.error);
    }, 1000);

    this.api.getuiTrafficStats()
      .then((res) => {
        this.uiTrafficStats = res;
      })
      .catch(() => {
        this.uiTrafficStats = false;
      });

    this.api.getChartType()
      .then((res) => {
        this.uiChartType = parseInt(res, 10);
      })
      .catch(() => {
        this.uiChartType = 0;
      });

    this.api.getWGEnableOneTimeLinks()
      .then((res) => {
        this.enableOneTimeLinks = res;
      })
      .catch(() => {
        this.enableOneTimeLinks = false;
      });

    this.api.getUiSortClients()
      .then((res) => {
        this.enableSortClient = res;
      })
      .catch(() => {
        this.enableSortClient = false;
      });

    this.api.getWGEnableExpireTime()
      .then((res) => {
        this.enableExpireTime = res;
      })
      .catch(() => {
        this.enableExpireTime = false;
      });

    this.api.getAvatarSettings()
      .then((res) => {
        this.avatarSettings = res;
      })
      .catch(() => {
          this.avatarSettings = {
            'dicebear': null,
            'gravatar': false,
          };
      });

    Promise.resolve().then(async () => {
      const lang = await this.api.getLang();
      if (lang !== localStorage.getItem('lang') && i18n.availableLocales.includes(lang)) {
        localStorage.setItem('lang', lang);
        i18n.locale = lang;
      }

      const currentRelease = await this.api.getRelease();
      const latestRelease = await fetch('https://raw.githubusercontent.com/ZongerX/amnezia-wg-easy-3.1/master/docs/changelog.json')
        .then((res) => res.json())
        .then((releases) => {
          const releasesArray = Object.entries(releases).map(([version, changelog]) => ({
            version: parseInt(version, 10),
            changelog,
          }));
          releasesArray.sort((a, b) => {
            return b.version - a.version;
          });

          return releasesArray[0];
        });

      if (currentRelease >= latestRelease.version) return;

      this.currentRelease = currentRelease;
      this.latestRelease = latestRelease;
    }).catch((err) => console.error(err));
  },
  computed: {
    chartOptionsTX() {
      const opts = {
        ...this.chartOptions,
        colors: [CHART_COLORS.tx[this.theme]],
      };
      opts.chart.type = UI_CHART_TYPES[this.uiChartType].type || false;
      opts.stroke.width = UI_CHART_TYPES[this.uiChartType].strokeWidth;
      return opts;
    },
    chartOptionsRX() {
      const opts = {
        ...this.chartOptions,
        colors: [CHART_COLORS.rx[this.theme]],
      };
      opts.chart.type = UI_CHART_TYPES[this.uiChartType].type || false;
      opts.stroke.width = UI_CHART_TYPES[this.uiChartType].strokeWidth;
      return opts;
    },
    showRowCharts() {
      return this.uiChartType > 0 && this.uiShowCharts;
    },
    clientInfo() {
      if (!this.clientInfoId || !this.clients) return null;
      return this.clients.find((client) => client.id === this.clientInfoId) || null;
    },
    clientInfoSeries() {
      // While the pointer is over the chart it stays still, otherwise every
      // update redraws it and the tooltip disappears.
      if (this.clientInfoChartFrozen) return this.clientInfoChartFrozen;

      const client = this.clientInfo;
      if (!client || !client.transferTxHistory) return [];
      return [
        { name: this.$t('download'), data: client.transferTxHistory.slice() },
        { name: this.$t('upload'), data: client.transferRxHistory.slice() },
      ];
    },
    clientInfoChartOptions() {
      return {
        chart: {
          type: 'area',
          background: 'transparent',
          toolbar: { show: false },
          zoom: { enabled: false },
          animations: { enabled: false },
        },
        theme: { mode: this.theme },
        colors: ['#991b1b', '#9ca3af'],
        stroke: { curve: 'smooth', width: 2 },
        fill: {
          type: 'gradient',
          gradient: { opacityFrom: 0.4, opacityTo: 0, stops: [0, 100] },
        },
        dataLabels: { enabled: false },
        legend: { show: true, position: 'top', horizontalAlign: 'left' },
        grid: { borderColor: this.theme === 'dark' ? '#404040' : '#f3f4f6' },
        xaxis: {
          labels: { show: false },
          axisTicks: { show: false },
          axisBorder: { show: false },
          tooltip: { enabled: false },
        },
        yaxis: {
          min: 0,
          labels: { formatter: (value) => `${bytes(value, 0)}/s` },
        },
        tooltip: {
          x: { show: false },
          y: { formatter: (value) => `${bytes(value)}/s` },
        },
      };
    },
    versionsTitle() {
      if (!this.versions) return '';
      const { versions } = this;
      const build = [versions.imageRef, versions.gitSha && versions.gitSha.slice(0, 7)].filter(Boolean).join(' · ');
      return [
        `AmneziaWG Easy ${versions.release}${build ? ` (${build})` : ''}`,
        `amneziawg-go ${versions.amneziawgGo || '?'}`,
        `amneziawg-tools ${versions.amneziawgTools || '?'}`,
        `Node.js ${versions.node}`,
        `Vue ${Vue.version}`,
      ].join('\n');
    },
    theme() {
      if (this.uiTheme === 'auto') {
        return this.prefersDarkScheme.matches ? 'dark' : 'light';
      }
      return this.uiTheme;
    },
  },
});
