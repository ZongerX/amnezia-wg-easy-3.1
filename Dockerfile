ARG NODE_IMAGE=docker.io/library/node:24-alpine
ARG GO_IMAGE=docker.io/library/golang:1.25-alpine
ARG AWGGO_VERSION=v3.1.20260828
ARG AWGTOOLS_VERSION=v3.1.20260812

# amneziawg-go (userspace AmneziaWG). Cross-compiled on the build platform,
# so multi-arch builds don't need QEMU for this stage.
FROM --platform=$BUILDPLATFORM ${GO_IMAGE} AS build_awg_go
ARG AWGGO_VERSION
ARG TARGETOS
ARG TARGETARCH
ARG TARGETVARIANT
RUN apk add --no-cache git make
RUN git clone --depth 1 --branch ${AWGGO_VERSION} https://github.com/amnezia-vpn/amneziawg-go.git /amneziawg-go
WORKDIR /amneziawg-go
RUN export CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} && \
    if [ "${TARGETARCH}" = "arm" ]; then export GOARM="${TARGETVARIANT#v}"; fi && \
    make

# amneziawg-tools (awg, awg-quick). Built on the same base as the runtime image
# so the binary is linked against the same musl.
FROM ${NODE_IMAGE} AS build_awg_tools
ARG AWGTOOLS_VERSION
RUN apk add --no-cache git build-base linux-headers
RUN git clone --depth 1 --branch ${AWGTOOLS_VERSION} https://github.com/amnezia-vpn/amneziawg-tools.git /amneziawg-tools
RUN make -C /amneziawg-tools/src

# Web UI dependencies and Tailwind CSS. Pure JS, so it runs on the build platform.
FROM --platform=$BUILDPLATFORM ${NODE_IMAGE} AS build_node_modules
COPY src /app
WORKDIR /app
RUN npm ci && \
    npm run buildcss && \
    npm prune --omit=dev && \
    mv node_modules /node_modules

# Copy build result to a new image.
# This saves a lot of disk space.
FROM ${NODE_IMAGE}
ARG AWGGO_VERSION
ARG AWGTOOLS_VERSION
HEALTHCHECK --interval=1m --timeout=5s --retries=3 CMD /usr/bin/awg show wg0 > /dev/null 2>&1 || exit 1

# Install Linux packages
RUN apk add --no-cache \
    bash \
    dumb-init \
    iproute2 \
    iptables \
    iptables-legacy

# Use iptables-legacy
RUN set -eux; \
    dir="$(dirname "$(command -v iptables-legacy)")"; \
    for tool in iptables iptables-save iptables-restore; do \
      ln -sf "${dir}/${tool%%-*}-legacy${tool#iptables}" "${dir}/${tool}"; \
    done; \
    iptables --version

# AmneziaWG binaries
COPY --from=build_awg_go /amneziawg-go/amneziawg-go /usr/bin/amneziawg-go
COPY --from=build_awg_tools /amneziawg-tools/src/wg /usr/bin/awg
COPY --from=build_awg_tools /amneziawg-tools/src/wg-quick/linux.bash /usr/bin/awg-quick
RUN chmod +x /usr/bin/awg /usr/bin/awg-quick && \
    ln -s /usr/bin/awg /usr/bin/wg && \
    ln -s /usr/bin/awg-quick /usr/bin/wg-quick && \
    mkdir -p /etc/amnezia /etc/wireguard && \
    ln -s /etc/wireguard /etc/amnezia/amneziawg

COPY --from=build_node_modules /app /app

# Move node_modules one directory up, so during development
# we don't have to mount it in a volume.
# This results in much faster reloading!
#
# Also, some node_modules might be native, and
# the architecture & OS of your development machine might differ
# than what runs inside of docker.
COPY --from=build_node_modules /node_modules /node_modules

# Copy the needed wg-password scripts
COPY --from=build_node_modules /app/wgpw.sh /bin/wgpw
RUN chmod +x /bin/wgpw

# Set Environment
ENV DEBUG=Server,WireGuard
ENV AWGGO_VERSION=${AWGGO_VERSION}
ENV AWGTOOLS_VERSION=${AWGTOOLS_VERSION}

# Where the image was built from (passed by CI)
ARG IMAGE_REF
ARG GIT_SHA
ENV IMAGE_REF=${IMAGE_REF}
ENV GIT_SHA=${GIT_SHA}

# Run Web UI
WORKDIR /app
CMD ["/usr/bin/dumb-init", "node", "server.js"]
