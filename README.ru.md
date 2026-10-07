# AmneziaWG Easy 3.1

[English](./README.md) | **Русский**

Самый простой способ поднять и администрировать AmneziaWG на любом Linux-сервере.

Веб-интерфейс [w0rng/amnezia-wg-easy](https://github.com/w0rng/amnezia-wg-easy) поверх
[AmneziaWG 3.1](https://docs.amnezia.org/documentation/amnezia-wg/): `amneziawg-go` v3.1.20260828 и
`amneziawg-tools` v3.1.20260812, собранные из исходников, плюс окно со всеми параметрами AmneziaWG 3.1.

<p align="center">
  <img src="./assets/screenshot.png" width="802" />
</p>

## Возможности

* Всё в одном контейнере: AmneziaWG 3.1 (`amneziawg-go` в userspace) + веб-интерфейс.
* Параметры AmneziaWG редактируются в веб-интерфейсе: S1–S4, диапазоны H1–H4, I1–I5, HeaderProtectionKey,
  RandomTrailers, DisableCookies, ContentPaddingAddition, тайминги rekey/keepalive.
* Наборы параметров в один клик: для клиентов AmneziaWG 3.1, 2.0 и 1.0.
* Выдача клиента QR-кодом, файлом `.conf` или ссылкой `vpn://` для приложения AmneziaVPN (копируется в буфер обмена).
* Временные клиенты: на 1 час, 1 день, 7 дней, 30 дней или до любой даты; по истечении отключаются или удаляются.
* Клик по клиенту показывает последнее рукопожатие, endpoint, общий трафик и живой график нагрузки.
* Графики Tx/Rx у каждого клиента, видно, кто сейчас подключён.
* Создание, редактирование, удаление, включение и выключение клиентов; случайные имена для новых клиентов.
* Аватары Gravatar или случайные.
* Светлая и тёмная тема, несколько языков интерфейса.
* Одноразовые ссылки (по умолчанию выключены), метрики Prometheus.

## Требования

* Linux-сервер с Docker: `curl -sSL https://get.docker.com | sh`.
* Устройство `/dev/net/tun` (есть практически на любом VPS).

## Быстрый старт через Docker Compose

```bash
mkdir -p ~/amnezia-wg-easy && cd ~/amnezia-wg-easy
curl -fsSLO https://raw.githubusercontent.com/ZongerX/amnezia-wg-easy-3.1/master/docker-compose.yml
curl -fsSLO https://raw.githubusercontent.com/ZongerX/amnezia-wg-easy-3.1/master/.env
curl -fsSLO https://raw.githubusercontent.com/ZongerX/amnezia-wg-easy-3.1/master/setup.sh
bash setup.sh
docker compose up -d
```

`setup.sh` задаёт три вопроса и записывает ответы в `.env`:

* **WG_HOST** — определяется через `curl -4 ifconfig.me`; Enter, чтобы согласиться, или впишите домен.
* **WG_PORT** — предлагается случайный UDP-порт. Стандартный 51820 сканеры и DPI проверяют первым.
* **Пароль веб-интерфейса** — введите свой или нажмите Enter, чтобы сгенерировать. Пароль хэшируется bcrypt
  (утилитой `wgpw` из образа), в `.env` попадает только хэш. Сгенерированный пароль показывается один раз — сохраните его.

Затем откройте `http://<WG_HOST>:51821`, создайте клиента и отсканируйте QR-код в AmneziaWG
или вставьте ссылку `vpn://` в AmneziaVPN. Если на сервере есть файрвол, откройте в нём порт VPN (UDP).

> 💡 Без `PASSWORD_HASH` веб-интерфейс открыт без пароля, об этом предупреждает лог контейнера.
> Задать пароль вручную: `docker run --rm ghcr.io/zongerx/amnezia-wg-easy-3.1 wgpw 'ВАШ_ПАРОЛЬ'`, а выведенную
> строку `PASSWORD_HASH='…'` вставить в `.env` (одинарные кавычки обязательны: в хэше есть `$`).

> 💡 `IMAGE_TAG` указывать не нужно: Compose по умолчанию берёт `latest` — стабильную сборку из `master`.
> `IMAGE_TAG=dev` в `.env` нужен, только чтобы попробовать ветку разработки.

## Запуск через docker run

```
  docker run -d \
  --name=amnezia-wg-easy \
  -e LANG=ru \
  -e WG_HOST=<🚨IP_ВАШЕГО_СЕРВЕРА> \
  -e PASSWORD_HASH='<🚨ХЭШ_ПАРОЛЯ>' \
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

> 💡 `IP_ВАШЕГО_СЕРВЕРА` — внешний IP сервера или домен (в том числе Dynamic DNS).
>
> 💡 `ХЭШ_ПАРОЛЯ` — bcrypt-хэш пароля для входа в веб-интерфейс, см. [How_to_generate_an_bcrypt_hash.md](./How_to_generate_an_bcrypt_hash.md).

Веб-интерфейс будет доступен на `http://0.0.0.0:51821`.

Метрики Prometheus — на `http://0.0.0.0:51821/metrics`, дашборд Grafana [21733](https://grafana.com/grafana/dashboards/21733-wireguard/).

> 💡 Конфигурация хранится в `~/.amnezia-wg-easy`.

## Настройки

Задаются переменными окружения: в `.env` для Docker Compose или через `-e KEY="VALUE"` в `docker run`.

| Переменная | По умолчанию | Пример | Описание |
|------------|--------------|--------|----------|
| `PORT` | `51821` | `6789` | TCP-порт веб-интерфейса. |
| `WEBUI_HOST` | `0.0.0.0` | `localhost` | Адрес, на котором слушает веб-интерфейс. |
| `PASSWORD_HASH` | - | `'$2a$12$...'` | bcrypt-хэш пароля веб-интерфейса. Если не задан, вход без пароля. |
| `WG_HOST` | - | `vpn.myserver.com` | Публичный адрес VPN-сервера. |
| `WG_DEVICE` | `eth0` | `ens6f0` | Интерфейс, через который уходит трафик клиентов (внутри контейнера — `eth0`). |
| `WG_PORT` | `51820` | `34519` | Публичный UDP-порт VPN. Лучше случайный. |
| `WG_CONFIG_PORT` | `51820` | `12345` | UDP-порт, который попадает в конфиги клиентов, если он отличается от `WG_PORT` (например, за NAT). |
| `WG_MTU` | `null` | `1280` | MTU для клиентов. Сервер использует MTU по умолчанию. |
| `WG_PERSISTENT_KEEPALIVE` | `0` | `25` | Keepalive клиента в секундах, если он не задан в окне AmneziaWG. `0` — выключен. |
| `WG_DEFAULT_ADDRESS` | `10.8.0.x` | `10.6.0.x` | Диапазон адресов клиентов. |
| `WG_DEFAULT_DNS` | `1.1.1.1` | `8.8.8.8, 8.8.4.4` | DNS для клиентов. Пустое значение — без DNS. |
| `WG_ALLOWED_IPS` | `0.0.0.0/0, ::/0` | `192.168.15.0/24, 10.0.1.0/24` | Какие адреса клиенты направляют в туннель. |
| `WG_PRE_UP`, `WG_POST_UP`, `WG_PRE_DOWN`, `WG_POST_DOWN` | `...` | `iptables ...` | Команды при подъёме и остановке интерфейса, значения по умолчанию — в [config.js](./src/config.js). |
| `WG_ENABLE_EXPIRES_TIME` | `true` | `false` | Срок действия клиентов (временные клиенты). |
| `LANG` | `en` | `ru` | Язык интерфейса (en, ua, ru, tr, no, pl, fr, de, ca, es, ko, vi, nl, is, pt, chs, cht, it, th, hi). |
| `UI_TRAFFIC_STATS` | `false` | `true` | Подробная статистика RX/TX у клиентов. |
| `UI_CHART_TYPE` | `2` | `1` | Графики трафика: `0` — выключены, `1` — линии, `2` — области, `3` — столбцы. |
| `DICEBEAR_TYPE` | `false` | `bottts` | Стиль случайных аватаров, см. [dicebear](https://www.dicebear.com/styles/). |
| `USE_GRAVATAR` | `false` | `true` | Аватары Gravatar для клиентов с e-mail в имени. |
| `WG_ENABLE_ONE_TIME_LINKS` | `false` | `true` | Короткие одноразовые ссылки на конфиг (живут 5 минут). |
| `MAX_AGE` | `0` | `1440` | Время жизни сессии веб-интерфейса в минутах. `0` — до закрытия браузера. |
| `UI_ENABLE_SORT_CLIENTS` | `false` | `true` | Сортировка клиентов по имени. |
| `ENABLE_PROMETHEUS_METRICS` | `false` | `true` | Метрики Prometheus на `/metrics` и `/metrics/json`. |
| `PROMETHEUS_METRICS_PASSWORD` | - | `'$2a$12$...'` | bcrypt-хэш пароля Basic Auth для метрик. |
| `AWG_PROFILE` | `3.1` | `2.0` | Набор параметров AmneziaWG, который генерируется при первом запуске: `3.1`, `2.0` или `1.0`. См. [Параметры AmneziaWG](#параметры-amneziawg). |
| `JC`, `JMIN`, `JMAX`, `S1`…`S4`, `H1`…`H4`, `I1`…`I5` | из профиля | `JC=5`, `H1=100-200` | Переопределяют отдельные значения при первом запуске. |
| `HEADER_PROTECTION_KEY`, `RANDOM_TRAILERS`, `DISABLE_COOKIES`, `CONTENT_PADDING_ADDITION` | из профиля | `RANDOM_TRAILERS=on` | То же для параметров AmneziaWG 3.x. |
| `REKEY_AFTER_TIME`, `REKEY_TIMEOUT`, `REJECT_AFTER_TIME`, `KEEPALIVE_TIMEOUT`, `MAX_HANDSHAKE_ATTEMPTS` | из профиля | `100-120` | То же для таймингов AmneziaWG 3.x. |
| `IMAGE_TAG` | `latest` | `dev` | Только для Docker Compose: тег образа. |

> Если меняете `WG_PORT`, поменяйте и проброшенный порт (в Docker Compose это происходит автоматически).

## Параметры AmneziaWG

Параметры генерируются один раз, при первом запуске (пока нет `wg0.json`), из `AWG_PROFILE` и переменных
выше. Дальше они хранятся в `wg0.json` и меняются кнопкой **AmneziaWG** над списком клиентов.
При сохранении туннель перезапускается, и всем клиентам нужно заново импортировать конфиг.

| Профиль | Что генерирует | Клиенты |
|---------|----------------|---------|
| `3.1` (по умолчанию) | Как приложение AmneziaVPN: Jc 4–6, Jmin 10, Jmax 50, S1–S4 = 12, H1–H4 = 1–4, случайный HeaderProtectionKey, RandomTrailers и DisableCookies включены, случайные тайминги, PersistentKeepalive 25–35 | AmneziaVPN 5.0.1.5+, AmneziaWG 3.1+ |
| `2.0` | Случайные S1–S4 и четыре непересекающихся диапазона H1–H4, без параметров 3.x | AmneziaWG 2.0+ |
| `1.0` | Случайные Jc, S1, S2 и одиночные значения H1–H4, как у w0rng/amnezia-wg-easy | любой AmneziaWG |

| Параметр | Должен совпадать на сервере и клиентах | Примечание |
|----------|:---:|------------|
| S1, S2, S3, S4 | да | Случайное дополнение пакетов init, response, cookie и data. Не меньше 12 при заданном HeaderProtectionKey. Размеры пакетов с дополнением не должны совпадать. |
| H1, H2, H3, H4 | да | Заголовки типов пакетов: число или диапазон `a-b`; диапазоны не должны пересекаться. |
| HeaderProtectionKey | да | Ключ 32 байта в base64, шифрует заголовки пакетов (3.x). |
| RandomTrailers | да | Случайный «хвост» у пакетов рукопожатия (3.1). |
| Jc, Jmin, Jmax | нет | Мусорные пакеты перед рукопожатием. |
| I1…I5 | нет | Пакеты-сигнатуры перед рукопожатием, только у клиентов. Теги: `<b 0xHEX>`, `<r N>`, `<rc N>`, `<rd N>`, `<t>`. |
| ContentPaddingAddition | нет | Дополнительное дополнение пакетов с данными, диапазон (3.x). |
| RekeyAfterTime, RekeyTimeout, RejectAfterTime, KeepaliveTimeout, MaxHandshakeAttempts | нет | Случайные таймеры WireGuard: число или диапазон (3.x). |
| DisableCookies | нет | Не отправлять cookie-ответы под нагрузкой (3.1). |
| PersistentKeepalive | нет | Keepalive клиента: число или диапазон. Пусто — берётся `WG_PERSISTENT_KEEPALIVE`. |

Пустое поле означает, что параметр выключен и не пишется в конфиги. Поэтому набор без значений 3.x
работает и с клиентами AmneziaWG 1.x/2.x.

> 💡 При S4 > 0 или ContentPaddingAddition пакеты с данными становятся больше: если большие загрузки зависают, задайте `WG_MTU=1280`.

> 💡 `awg-quick` предпочитает модуль ядра `amneziawg`, если он загружен на хосте, и только без него использует
> `amneziawg-go`. Если модуль на хосте есть, он тоже должен поддерживать AmneziaWG 3.1.

### Переход с w0rng/amnezia-wg-easy

Поменяйте образ на `ghcr.io/zongerx/amnezia-wg-easy-3.1` и оставьте тот же том (`/etc/wireguard`).
Существующий `wg0.json` читается как есть: параметры AmneziaWG 1.0 сохраняются, текущие клиенты продолжают
работать. Чтобы перейти на 3.1, откройте **AmneziaWG**, нажмите **AWG 3.1**, сохраните и заново импортируйте конфиги клиентов.

## Обновление

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

и снова выполните команду `docker run -d \ ...` выше.

Образы собираются для `linux/amd64` и `linux/arm64`: `latest` из `master` и отдельный тег для каждой ветки (например, `dev`).

## Благодарности

Основано на [wg-easy](https://github.com/wg-easy/wg-easy) Эмиля Ниссена (Emile Nijssen).  
Интеграция AmneziaWG — из [amnezia-wg-easy](https://github.com/spcfox/amnezia-wg-easy) Виктора Юдова
и веб-интерфейс [amnezia-wg-easy](https://github.com/w0rng/amnezia-wg-easy) от w0rng.  
AmneziaWG — проект [Amnezia](https://github.com/amnezia-vpn): [amneziawg-go](https://github.com/amnezia-vpn/amneziawg-go), [amneziawg-tools](https://github.com/amnezia-vpn/amneziawg-tools).
