#!/usr/bin/env bash
# First-time setup for AmneziaWG Easy: fills WG_HOST, WG_PORT and the Web UI
# password (PASSWORD_HASH) in the .env next to this script.
# Первичная настройка: заполняет WG_HOST, WG_PORT и пароль веб-интерфейса в .env.
#
# Usage / запуск:  bash setup.sh
set -euo pipefail

cd "$(dirname "$0")"
ENV_FILE=.env

if [ ! -f "$ENV_FILE" ]; then
  echo "No $ENV_FILE next to setup.sh. Download it first (see README)." >&2
  exit 1
fi
if ! command -v docker > /dev/null; then
  echo "Docker is not installed: curl -sSL https://get.docker.com | sh" >&2
  exit 1
fi

get_env() {
  grep -E "^$1=" "$ENV_FILE" | head -n 1 | cut -d= -f2- || true
}

# Replaces KEY=... or appends it. Values here never contain "|", "&" or "\".
set_env() {
  if grep -qE "^$1=" "$ENV_FILE"; then
    sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$1" "$2" >> "$ENV_FILE"
  fi
}

ask() {
  local prompt=$1 default=$2 answer
  read -r -p "$prompt [$default]: " answer
  echo "${answer:-$default}"
}

# --- WG_HOST ---------------------------------------------------------------
host=$(get_env WG_HOST)
if [ -z "$host" ] || [[ "$host" == *YOUR_SERVER_IP* ]]; then
  host=$(curl -4 -fsS --max-time 5 ifconfig.me 2> /dev/null || true)
fi
host=$(ask "Public IP or domain of this server (WG_HOST)" "${host:-}")
if [ -z "$host" ]; then
  echo "WG_HOST is required." >&2
  exit 1
fi
set_env WG_HOST "$host"

# --- WG_PORT ---------------------------------------------------------------
port=$(get_env WG_PORT)
if [ -z "$port" ] || [ "$port" = "51820" ]; then
  # A random port: the default 51820 is the first one scanners and DPI check.
  port=$(( (RANDOM * 32768 + RANDOM) % 40000 + 20000 ))
fi
port=$(ask "VPN UDP port (WG_PORT)" "$port")
set_env WG_PORT "$port"

# --- PASSWORD_HASH -----------------------------------------------------------
if [ -n "$(get_env PASSWORD_HASH)" ]; then
  change=$(ask "A Web UI password is already set. Change it? (y/n)" "n")
else
  change=y
fi

generated=
if [[ "$change" =~ ^[Yy] ]]; then
  read -r -s -p "Web UI password (empty = generate one): " password
  echo
  if [ -z "$password" ]; then
    password=$(LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 20 || true)
    generated=$password
  fi

  tag=$(get_env IMAGE_TAG)
  image="ghcr.io/zongerx/amnezia-wg-easy-3.1:${tag:-latest}"
  echo "Hashing the password with $image ..."
  hash=$(docker run --rm "$image" wgpw "$password" | sed -n "s/^PASSWORD_HASH='\(.*\)'$/\1/p") || true
  if [ -z "$hash" ]; then
    echo "Could not hash the password (is Docker running and are you allowed to use it?)." >&2
    exit 1
  fi
  # Single quotes: the bcrypt hash contains "$", which Compose would expand.
  set_env PASSWORD_HASH "'$hash'"
fi

ui_port=$(get_env PORT)
echo
echo "Saved to $ENV_FILE."
echo "  Web UI:   http://$host:${ui_port:-51821}"
echo "  VPN port: $port/udp (open it in your firewall)"
if [ -n "$generated" ]; then
  echo "  Password: $generated   <- save it now, it is not stored anywhere"
fi
echo
echo "Start it with: docker compose up -d"
