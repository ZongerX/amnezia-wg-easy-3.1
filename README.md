# AmneziaWG Easy 3.1

**English** | [Русский](./README.ru.md)

You have found the easiest way to install & manage AmneziaWG on any Linux host!

The web UI of [w0rng/amnezia-wg-easy](https://github.com/w0rng/amnezia-wg-easy) on top of
[AmneziaWG 3.1](https://docs.amnezia.org/documentation/amnezia-wg/): `amneziawg-go` v3.1.20260828 and
`amneziawg-tools` v3.1.20260812, built from source, plus a window for all AmneziaWG 3.1 parameters.

<p align="center">
  <img src="./assets/screenshot.png" width="802" />
</p>

## Features

* All-in-one: AmneziaWG 3.1 (userspace `amneziawg-go`) + Web UI.
* Edit AmneziaWG parameters in the Web UI: S1–S4, H1–H4 ranges, I1–I5, HeaderProtectionKey,
  RandomTrailers, DisableCookies, ContentPaddingAddition, rekey/keepalive timings.
* One-click parameter sets for AmneziaWG 3.1, 2.0 and 1.0 clients.
* Share a client as a QR code, a `.conf` file or a `vpn://` link for the AmneziaVPN app (copied to the clipboard).
* Temporary clients: 1 hour, 1 day, 7 days, 30 days or any date; disabled or deleted when they expire.
* Click a client to see its latest handshake, endpoint, total traffic and a live traffic chart.
* Tx/Rx charts for each client, statistics for which clients are connected.
* List, create, edit, delete, enable & disable clients; random names for new clients.
* Gravatar support or random avatars.
* Automatic Light / Dark Mode, multilanguage support.
* One Time Links (default off), Prometheus metrics.

## Requirements

* A Linux host with Docker installed: `curl -sSL https://get.docker.com | sh`.
* The `/dev/net/tun` device (present on virtually every VPS).

## Quick start with Docker Compose

```bash
mkdir -p ~/amnezia-wg-easy && cd ~/amnezia-wg-easy
curl -fsSLO https://raw.githubusercontent.com/ZongerX/amnezia-wg-easy-3.1/master/docker-compose.yml
curl -fsSLO https://raw.githubusercontent.com/ZongerX/amnezia-wg-easy-3.1/master/.env
curl -fsSLO https://raw.githubusercontent.com/ZongerX/amnezia-wg-easy-3.1/master/setup.sh
bash setup.sh
docker compose up -d
```

`setup.sh` asks for three things and writes them into `.env`:

* **WG_HOST**: detected with `curl -4 ifconfig.me`, press Enter to accept or type a domain.
* **WG_PORT**: a random UDP port is suggested. The default 51820 is the first one scanners and DPI look at.
* **Web UI password**: type one or press Enter to generate one. The password is hashed with bcrypt
  (`wgpw` inside the image) and only the hash is stored in `.env`. A generated password is shown once, save it.

Then open `http://<WG_HOST>:51821`, create a client and scan the QR code with AmneziaWG,
or copy the `vpn://` link into AmneziaVPN. Open the VPN port (UDP) in your firewall if you have one.

> 💡 Without `PASSWORD_HASH` the Web UI has no password, and the container log says so.
> To set it by hand: `docker run --rm ghcr.io/zongerx/amnezia-wg-easy-3.1 wgpw 'YOUR_PASSWORD'` and put the
> printed `PASSWORD_HASH='…'` line into `.env` (keep the single quotes, the hash contains `$`).

> 💡 `IMAGE_TAG` is optional: Compose uses `latest` (the stable `master` build) by default.
> Set `IMAGE_TAG=dev` in `.env` only to try the development branch.

## Run with docker run

```
  docker run -d \
  --name=amnezia-wg-easy \
  -e LANG=en \
  -e WG_HOST=<🚨YOUR_SERVER_IP> \
  -e PASSWORD_HASH='<🚨YOUR_ADMIN_PASSWORD_HASH>' \
  -e PORT=51821 \
  -e WG_PORT=51820 \
  -v ~/.amnezia-wg-easy:/etc/wireguard \
  -p 51820:51820/udp \
  -p 51821:51821/tcp \
  --cap-add=NET_ADMIN \
  --cap-add=SYS_MODULE \
  --sysctl="net.ipv4.conf.all.src_valid_mark=1" \
  --sysctl="net.ipv4.ip_forward=1" \
  --device=/dev/net/tun:/dev/net/tun \
  --restart unless-stopped \
  ghcr.io/zongerx/amnezia-wg-easy-3.1
```

> 💡 Replace `YOUR_SERVER_IP` with your WAN IP, or a Dynamic DNS hostname.
>
> 💡 Replace `YOUR_ADMIN_PASSWORD_HASH` with a bcrypt password hash to log in on the Web UI.
> See [How_to_generate_an_bcrypt_hash.md](./How_to_generate_an_bcrypt_hash.md) for know how generate the hash.

The Web UI will now be available on `http://0.0.0.0:51821`.

The Prometheus metrics will now be available on `http://0.0.0.0:51821/metrics`. Grafana dashboard [21733](https://grafana.com/grafana/dashboards/21733-wireguard/)

> 💡 Your configuration files will be saved in `~/.amnezia-wg-easy`

## Options

These options can be configured by setting environment variables using `-e KEY="VALUE"` in the `docker run` command.

| Env                           | Default           | Example                        | Description                                                                                                                                                                                                              |
|-------------------------------|-------------------|--------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `PORT`                        | `51821`           | `6789`                         | TCP port for Web UI.                                                                                                                                                                                                     |
| `WEBUI_HOST`                  | `0.0.0.0`         | `localhost`                    | IP address web UI binds to.                                                                                                                                                                                              |
| `PASSWORD_HASH`               | -                 | `$2y$05$Ci...`                 | When set, requires a password when logging in to the Web UI. See [How to generate an bcrypt hash.md]("https://github.com/wg-easy/wg-easy/blob/master/How_to_generate_an_bcrypt_hash.md") for know how generate the hash. |
| `WG_HOST`                     | -                 | `vpn.myserver.com`             | The public hostname of your VPN server.                                                                                                                                                                                  |
| `WG_DEVICE`                   | `eth0`            | `ens6f0`                       | Ethernet device the wireguard traffic should be forwarded through.                                                                                                                                                       |
| `WG_PORT`                     | `51820`           | `12345`                        | The public UDP port of your VPN server. WireGuard will listen on that (othwise default) inside the Docker container.                                                                                                     |
| `WG_CONFIG_PORT`              | `51820`           | `12345`                        | The UDP port used on [Home Assistant Plugin](https://github.com/adriy-be/homeassistant-addons-jdeath/tree/main/wgeasy)                                                                                                   |
| `WG_MTU`                      | `null`            | `1420`                         | The MTU the clients will use. Server uses default WG MTU.                                                                                                                                                                |
| `WG_PERSISTENT_KEEPALIVE`     | `0`               | `25`                           | Value in seconds to keep the "connection" open. If this value is 0, then connections won't be kept alive.                                                                                                                |
| `WG_DEFAULT_ADDRESS`          | `10.8.0.x`        | `10.6.0.x`                     | Clients IP address range.                                                                                                                                                                                                |
| `WG_DEFAULT_DNS`              | `1.1.1.1`         | `8.8.8.8, 8.8.4.4`             | DNS server clients will use. If set to blank value, clients will not use any DNS.                                                                                                                                        |
| `WG_ALLOWED_IPS`              | `0.0.0.0/0, ::/0` | `192.168.15.0/24, 10.0.1.0/24` | Allowed IPs clients will use.                                                                                                                                                                                            |
| `WG_PRE_UP`                   | `...`             | -                              | See [config.js](https://github.com/wg-easy/wg-easy/blob/master/src/config.js#L19) for the default value.                                                                                                                 |
| `WG_POST_UP`                  | `...`             | `iptables ...`                 | See [config.js](https://github.com/wg-easy/wg-easy/blob/master/src/config.js#L20) for the default value.                                                                                                                 |
| `WG_PRE_DOWN`                 | `...`             | -                              | See [config.js](https://github.com/wg-easy/wg-easy/blob/master/src/config.js#L27) for the default value.                                                                                                                 |
| `WG_POST_DOWN`                | `...`             | `iptables ...`                 | See [config.js](https://github.com/wg-easy/wg-easy/blob/master/src/config.js#L28) for the default value.                                                                                                                 |
| `WG_ENABLE_EXPIRES_TIME`      | `true`            | `false`                        | Expire time for clients (temporary clients)                                                                                                                                                                                         |
| `LANG`                        | `en`              | `de`                           | Web UI language (Supports: en, ua, ru, tr, no, pl, fr, de, ca, es, ko, vi, nl, is, pt, chs, cht, it, th, hi).                                                                                                            |
| `UI_TRAFFIC_STATS`            | `false`           | `true`                         | Enable detailed RX / TX client stats in Web UI                                                                                                                                                                           |
| `UI_CHART_TYPE`               | `2`               | `1`                            | UI_CHART_TYPE=0 # Charts disabled, UI_CHART_TYPE=1 # Line chart, UI_CHART_TYPE=2 # Area chart, UI_CHART_TYPE=3 # Bar chart                                                                                               |
| `DICEBEAR_TYPE`               | `false`           | `bottts`                       | see [dicebear types](https://www.dicebear.com/styles/)                                                                                                                                                                   |
| `USE_GRAVATAR`                | `false`           | `true`                         | Use or not GRAVATAR service                                                                                                                                                                                              |
| `WG_ENABLE_ONE_TIME_LINKS`    | `false`           | `true`                         | Enable display and generation of short one time download links (expire after 5 minutes)                                                                                                                                  |
| `MAX_AGE`                     | `0`               | `1440`                         | The maximum age of Web UI sessions in minutes. `0` means that the session will exist until the browser is closed.                                                                                                        |
| `UI_ENABLE_SORT_CLIENTS`      | `false`           | `true`                         | Enable UI sort clients by name                                                                                                                                                                                           |
| `ENABLE_PROMETHEUS_METRICS`   | `false`           | `true`                         | Enable Prometheus metrics `http://0.0.0.0:51821/metrics` and `http://0.0.0.0:51821/metrics/json`                                                                                                                         |
| `PROMETHEUS_METRICS_PASSWORD` | -                 | `$2y$05$Ci...`                 | If set, Basic Auth is required when requesting metrics. See [How to generate an bcrypt hash.md]("https://github.com/wg-easy/wg-easy/blob/master/How_to_generate_an_bcrypt_hash.md") for know how generate the hash.      |
| `AWG_PROFILE`                 | `3.1`             | `2.0`                          | AmneziaWG parameter set generated on first start: `3.1`, `2.0` or `1.0`. See [AmneziaWG parameters](#amneziawg-parameters).                                                                                              |
| `JC`, `JMIN`, `JMAX`, `S1`…`S4`, `H1`…`H4`, `I1`…`I5` | profile | `JC=5`, `H1=100-200`   | Override single generated values on first start.                                                                                                                                                                         |
| `HEADER_PROTECTION_KEY`, `RANDOM_TRAILERS`, `DISABLE_COOKIES`, `CONTENT_PADDING_ADDITION` | profile | `RANDOM_TRAILERS=on` | Same, for the AmneziaWG 3.x parameters.                                                                                                                                                         |
| `REKEY_AFTER_TIME`, `REKEY_TIMEOUT`, `REJECT_AFTER_TIME`, `KEEPALIVE_TIMEOUT`, `MAX_HANDSHAKE_ATTEMPTS` | profile | `100-120` | Same, for the AmneziaWG 3.x timings.                                                                                                                                                        |
| `IMAGE_TAG`                   | `latest`          | `dev`                          | Docker Compose only: the image tag to run.                                                                                                                                                                               |

> If you change `WG_PORT`, make sure to also change the exposed port.

## AmneziaWG parameters

The parameters are generated once, on first start (when there is no `wg0.json` yet), from `AWG_PROFILE`
and the env overrides above. After that they live in `wg0.json` and are edited with the **AmneziaWG**
button above the client list. Saving restarts the tunnel; every client must then re-import its config.

| Profile | What it generates | Clients |
|---------|-------------------|---------|
| `3.1` (default) | Same as the AmneziaVPN app: Jc 4–6, Jmin 10, Jmax 50, S1–S4 = 12, H1–H4 = 1–4, random HeaderProtectionKey, RandomTrailers and DisableCookies on, randomized timings, PersistentKeepalive 25–35 | AmneziaVPN 5.0.1.5+, AmneziaWG 3.1+ |
| `2.0` | Random S1–S4 and four non-overlapping H1–H4 ranges, no 3.x parameters | AmneziaWG 2.0+ |
| `1.0` | Random Jc, S1, S2 and single-value H1–H4, like w0rng/amnezia-wg-easy | any AmneziaWG |

| Parameter | Must match on server and clients | Notes |
|-----------|:---:|-------|
| S1, S2, S3, S4 | yes | Random padding of init, response, cookie and data packets. ≥ 12 when HeaderProtectionKey is set. Padded packet sizes must all differ. |
| H1, H2, H3, H4 | yes | Packet type headers, a number or a range `a-b`; ranges must not overlap. |
| HeaderProtectionKey | yes | 32-byte base64 key, encrypts packet headers (3.x). |
| RandomTrailers | yes | Random trailing bytes on handshake packets (3.1). |
| Jc, Jmin, Jmax | no | Junk packets sent before a handshake. |
| I1…I5 | no | Signature packets sent before a handshake, clients only. Tags: `<b 0xHEX>`, `<r N>`, `<rc N>`, `<rd N>`, `<t>`. |
| ContentPaddingAddition | no | Extra padding range for data packets (3.x). |
| RekeyAfterTime, RekeyTimeout, RejectAfterTime, KeepaliveTimeout, MaxHandshakeAttempts | no | Randomized WireGuard timers, a number or a range (3.x). |
| DisableCookies | no | Don't send cookie replies under load (3.1). |
| PersistentKeepalive | no | Client keepalive, a number or a range. Empty means `WG_PERSISTENT_KEEPALIVE`. |

An empty field means the parameter is off and is not written to the configs, so a parameter set without
3.x values also works with AmneziaWG 1.x/2.x clients.

> 💡 With S4 > 0 or ContentPaddingAddition, data packets get bigger: set `WG_MTU=1280` if large transfers stall.

> 💡 `awg-quick` prefers the `amneziawg` kernel module when the host has it loaded and falls back to
> `amneziawg-go` otherwise. Make sure a host module, if any, also supports AmneziaWG 3.1.

### Migrating from w0rng/amnezia-wg-easy

Point the image at `ghcr.io/zongerx/amnezia-wg-easy-3.1` and keep the same volume (`/etc/wireguard`).
The existing `wg0.json` is read as is: its AmneziaWG 1.0 parameters stay, so the current clients keep
working. To move to 3.1, open **AmneziaWG**, click **Generate AWG 3.1**, save, and re-import the client configs.

## Updating

Docker Compose:

```bash
docker compose pull && docker compose up -d
```

docker run:

```bash
docker stop amnezia-wg-easy
docker rm amnezia-wg-easy
docker pull ghcr.io/zongerx/amnezia-wg-easy-3.1
```

And then run the `docker run -d \ ...` command above again.

Images are published for `linux/amd64` and `linux/arm64`: `latest` from `master`, and one tag per branch (e.g. `dev`).

## Thanks

Based on [wg-easy](https://github.com/wg-easy/wg-easy) by Emile Nijssen.  
Use integrations with AmneziaWg from [amnezia-wg-easy](https://github.com/spcfox/amnezia-wg-easy) by Viktor Yudov
and the Web UI of [amnezia-wg-easy](https://github.com/w0rng/amnezia-wg-easy) by w0rng.  
AmneziaWG by [Amnezia](https://github.com/amnezia-vpn): [amneziawg-go](https://github.com/amnezia-vpn/amneziawg-go), [amneziawg-tools](https://github.com/amnezia-vpn/amneziawg-tools).
