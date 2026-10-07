'use strict';

const crypto = require('node:crypto');

const U16 = 65535;
const U32 = 4294967295;

// AmneziaWG parameters, stored flat in wg0.json under `server`.
//
// scope:
//   shared - must be identical on the server and every client
//   local  - per-side setting; written to the server and to every client
//   client - written to client configs only
//   peer   - client [Peer] section
const PARAMS = [
  { key: 'jc', conf: 'Jc', type: 'int', min: 0, max: 128, scope: 'local' },
  { key: 'jmin', conf: 'Jmin', type: 'int', min: 0, max: 1280, scope: 'local' },
  { key: 'jmax', conf: 'Jmax', type: 'int', min: 0, max: 1280, scope: 'local' },
  { key: 's1', conf: 'S1', type: 'int', min: 0, max: 1132, scope: 'shared' },
  { key: 's2', conf: 'S2', type: 'int', min: 0, max: 1188, scope: 'shared' },
  { key: 's3', conf: 'S3', type: 'int', min: 0, max: 1216, scope: 'shared' },
  { key: 's4', conf: 'S4', type: 'int', min: 0, max: 1248, scope: 'shared' },
  { key: 'h1', conf: 'H1', type: 'range', min: 1, max: U32, scope: 'shared' },
  { key: 'h2', conf: 'H2', type: 'range', min: 1, max: U32, scope: 'shared' },
  { key: 'h3', conf: 'H3', type: 'range', min: 1, max: U32, scope: 'shared' },
  { key: 'h4', conf: 'H4', type: 'range', min: 1, max: U32, scope: 'shared' },
  { key: 'headerProtectionKey', conf: 'HeaderProtectionKey', type: 'key', scope: 'shared' },
  { key: 'randomTrailers', conf: 'RandomTrailers', type: 'bool', scope: 'shared' },
  { key: 'i1', conf: 'I1', type: 'cps', scope: 'client' },
  { key: 'i2', conf: 'I2', type: 'cps', scope: 'client' },
  { key: 'i3', conf: 'I3', type: 'cps', scope: 'client' },
  { key: 'i4', conf: 'I4', type: 'cps', scope: 'client' },
  { key: 'i5', conf: 'I5', type: 'cps', scope: 'client' },
  { key: 'contentPaddingAddition', conf: 'ContentPaddingAddition', type: 'range', min: 0, max: U16, scope: 'local' },
  { key: 'rekeyAfterTime', conf: 'RekeyAfterTime', type: 'range', min: 0, max: U16, scope: 'local' },
  { key: 'rekeyTimeout', conf: 'RekeyTimeout', type: 'range', min: 0, max: U16, scope: 'local' },
  { key: 'rejectAfterTime', conf: 'RejectAfterTime', type: 'range', min: 0, max: U16, scope: 'local' },
  { key: 'keepaliveTimeout', conf: 'KeepaliveTimeout', type: 'range', min: 0, max: U16, scope: 'local' },
  { key: 'maxHandshakeAttempts', conf: 'MaxHandshakeAttempts', type: 'range', min: 0, max: U16, scope: 'local' },
  { key: 'disableCookies', conf: 'DisableCookies', type: 'bool', scope: 'local' },
  { key: 'persistentKeepalive', conf: 'PersistentKeepalive', type: 'range', min: 0, max: U16, scope: 'peer' },
];

const PROFILES = ['3.1', '2.0', '1.0'];

// Minimum S1-S4 when HeaderProtectionKey is set (ChaCha20 nonce size).
const HEADER_PROTECTION_MIN_PADDING = 12;

// Tags accepted by amneziawg-go in I1-I5 (device/obf.go).
const CPS_TAGS = ['b', 't', 'r', 'rc', 'rd', 'd', 'ds', 'dz'];

const randomInt = (min, max) => crypto.randomInt(min, max + 1);

const isUnset = (value) => value === undefined || value === null || value === '';

const parseRange = (value) => {
  const match = /^(\d+)(?:-(\d+))?$/.exec(String(value));
  if (!match) return null;
  const lo = Number(match[1]);
  const hi = match[2] === undefined ? lo : Number(match[2]);
  return { lo, hi };
};

const validateCps = (value) => {
  if (/[\r\n#]/.test(value)) {
    return 'Must be a single line without "#"';
  }
  if (!/^(\s*<[^<>]*>)+\s*$/.test(value)) {
    return 'Expected a sequence of tags like <b 0x...><r 16><t>';
  }
  for (const [, body] of value.matchAll(/<([^<>]*)>/g)) {
    const [tag, arg, extra] = body.trim().split(/\s+/);
    if (!CPS_TAGS.includes(tag)) {
      return `Unknown tag <${tag || ''}>`;
    }
    if (extra !== undefined) {
      return `Too many values in <${body.trim()}>`;
    }
    if (tag === 'b' && !/^(0x)?([0-9a-fA-F]{2})+$/.test(arg || '')) {
      return '<b> needs an even-length hex string, e.g. <b 0xdeadbeef>';
    }
    if (['r', 'rc', 'rd'].includes(tag) && !/^[1-9]\d*$/.test(arg || '')) {
      return `<${tag}> needs a positive length, e.g. <${tag} 16>`;
    }
    if (tag === 't' && arg !== undefined) {
      return '<t> takes no value';
    }
  }
  return null;
};

const randomJunkSize = () => randomInt(15, 150);

// S2 must not equal S1 + 56: an AWG 1.x peer could not tell init and response apart.
const randomS2 = (s1) => {
  let s2;
  do {
    s2 = randomJunkSize();
  } while (s2 === s1 + 56);
  return s2;
};

const shuffle = (list) => {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Four non-overlapping ranges: the space [5, 2^31-1] is split into four
// segments, each header gets a random sub-range inside a random segment.
const randomHeaderRanges = () => {
  const min = 5;
  const max = 2 ** 31 - 1;
  const segment = Math.floor((max - min + 1) / 4);
  return shuffle([0, 1, 2, 3]).map((index) => {
    const segmentStart = min + index * segment;
    const segmentEnd = segmentStart + segment - 1;
    const width = randomInt(2 ** 16, 2 ** 24);
    const start = randomInt(segmentStart, segmentEnd - width);
    return `${start}-${start + width}`;
  });
};

const randomHeaderValues = () => {
  const values = new Set();
  while (values.size < 4) {
    values.add(randomInt(5, 2 ** 31 - 1));
  }
  return [...values].map(String);
};

const emptyParams = () => Object.fromEntries(PARAMS.map(({ key }) => [key, null]));

module.exports = class Awg {

  static get PARAMS() {
    return PARAMS;
  }

  static get PROFILES() {
    return PROFILES;
  }

  static generateHeaderProtectionKey() {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Generates a full parameter set for a profile.
   * 3.1 mirrors what the AmneziaVPN client generates for AWG 3.1 servers.
   */
  static generate(profile = '3.1') {
    const params = emptyParams();

    if (profile === '3.1') {
      return Object.assign(params, {
        jc: randomInt(4, 6),
        jmin: 10,
        jmax: 50,
        s1: 12,
        s2: 12,
        s3: 12,
        s4: 12,
        h1: '1',
        h2: '2',
        h3: '3',
        h4: '4',
        headerProtectionKey: this.generateHeaderProtectionKey(),
        randomTrailers: true,
        rekeyAfterTime: '100-120',
        rekeyTimeout: '3-7',
        rejectAfterTime: '150-180',
        keepaliveTimeout: '5-15',
        maxHandshakeAttempts: '15-20',
        disableCookies: true,
        persistentKeepalive: '25-35',
      });
    }

    if (profile === '2.0') {
      const s1 = randomJunkSize();
      const [h1, h2, h3, h4] = randomHeaderRanges();
      return Object.assign(params, {
        jc: randomInt(4, 6),
        jmin: 10,
        jmax: 50,
        s1,
        s2: randomS2(s1),
        s3: randomJunkSize(),
        s4: randomInt(1, 32),
        h1,
        h2,
        h3,
        h4,
      });
    }

    if (profile === '1.0') {
      const s1 = randomJunkSize();
      const [h1, h2, h3, h4] = randomHeaderValues();
      return Object.assign(params, {
        jc: randomInt(3, 9),
        jmin: 50,
        jmax: 1000,
        s1,
        s2: randomS2(s1),
        h1,
        h2,
        h3,
        h4,
      });
    }

    throw new Error(`Unknown AmneziaWG profile: ${profile}`);
  }

  /**
   * Brings raw values (env strings, old wg0.json numbers, UI input) to the
   * stored form: int -> number, range/cps/key -> trimmed string,
   * bool -> boolean, empty -> null. Unknown keys are dropped.
   */
  static normalize(raw = {}) {
    const params = {};
    for (const { key, type } of PARAMS) {
      let value = raw[key];
      if (typeof value === 'string') value = value.trim();
      if (isUnset(value)) {
        params[key] = null;
      } else if (type === 'int') {
        params[key] = /^\d+$/.test(String(value)) ? Number(value) : value;
      } else if (type === 'bool') {
        params[key] = value === true || ['true', 'on', '1', 'yes'].includes(String(value).toLowerCase());
      } else if (type === 'range') {
        params[key] = String(value).replace(/\s+/g, '');
      } else {
        params[key] = String(value);
      }
    }
    return params;
  }

  /**
   * Returns { [key]: message } for every invalid parameter. Empty object if valid.
   */
  static validate(params) {
    const errors = {};

    for (const {
      key, type, min, max,
    } of PARAMS) {
      const value = params[key];
      if (isUnset(value)) continue;

      if (type === 'int') {
        if (!Number.isInteger(value) || value < min || value > max) {
          errors[key] = `Must be an integer from ${min} to ${max}`;
        }
      } else if (type === 'range') {
        const range = parseRange(value);
        if (!range) {
          errors[key] = 'Must be a number or a range "a-b"';
        } else if (range.lo > range.hi) {
          errors[key] = 'Range start must not exceed its end';
        } else if (range.lo < min || range.hi > max) {
          errors[key] = `Must be within ${min}-${max}`;
        }
      } else if (type === 'key') {
        if (!/^[A-Za-z0-9+/]{43}=$/.test(value)) {
          errors[key] = 'Must be a 32-byte base64 key';
        }
      } else if (type === 'cps') {
        const error = validateCps(value);
        if (error) errors[key] = error;
      } else if (type === 'bool' && typeof value !== 'boolean') {
        errors[key] = 'Must be on or off';
      }
    }

    if (!errors.jmin && !errors.jmax
      && !isUnset(params.jmin) && !isUnset(params.jmax)
      && params.jmin > params.jmax) {
      errors.jmax = 'Jmax must not be less than Jmin';
    }

    const headers = ['h1', 'h2', 'h3', 'h4']
      .filter((key) => !errors[key] && !isUnset(params[key]))
      .map((key) => ({ key, ...parseRange(params[key]) }));
    for (let i = 0; i < headers.length; i++) {
      for (let j = i + 1; j < headers.length; j++) {
        if (headers[i].lo <= headers[j].hi && headers[j].lo <= headers[i].hi) {
          errors[headers[j].key] = `Overlaps with ${headers[i].key.toUpperCase()}`;
        }
      }
    }

    if (!isUnset(params.headerProtectionKey) && !errors.headerProtectionKey) {
      for (const key of ['s1', 's2', 's3', 's4']) {
        if (!errors[key] && !(params[key] >= HEADER_PROTECTION_MIN_PADDING)) {
          errors[key] = `Must be at least ${HEADER_PROTECTION_MIN_PADDING} when HeaderProtectionKey is set`;
        }
      }
    }

    return errors;
  }

  /**
   * Config lines for the [Interface] section of the server ('server') or a
   * client ('client'). Unset values and disabled flags are omitted, so a
   * parameter set without 3.x values stays readable by AWG 1.x/2.x peers.
   */
  static interfaceLines(params, side) {
    const scopes = side === 'server'
      ? ['shared', 'local']
      : ['shared', 'local', 'client'];

    return PARAMS
      .filter(({ scope }) => scopes.includes(scope))
      .map(({ key, conf, type }) => {
        const value = params[key];
        if (isUnset(value)) return null;
        if (type === 'bool') return value ? `${conf} = on` : null;
        return `${conf} = ${value}`;
      })
      .filter((line) => line !== null)
      .join('\n');
  }

  /**
   * Guesses which profile a parameter set corresponds to.
   */
  static detectProfile(params) {
    const has = (keys) => keys.some((key) => !isUnset(params[key]) && params[key] !== false);
    if (has(['headerProtectionKey', 'randomTrailers', 'contentPaddingAddition', 'rekeyAfterTime',
      'rekeyTimeout', 'rejectAfterTime', 'keepaliveTimeout', 'maxHandshakeAttempts', 'disableCookies'])) {
      return '3.1';
    }
    if (has(['s3', 's4', 'i1', 'i2', 'i3', 'i4', 'i5'])
      || ['h1', 'h2', 'h3', 'h4'].some((key) => String(params[key] ?? '').includes('-'))) {
      return '2.0';
    }
    return '1.0';
  }

};
