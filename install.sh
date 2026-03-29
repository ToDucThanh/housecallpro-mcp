#!/bin/sh
# hcpro installer — downloads pre-built binaries from GitHub Releases
# Usage: curl -fsSL https://raw.githubusercontent.com/ToDucThanh/housecallpro-mcp/feature/cli/install.sh | sh
#
# Environment variables:
#   HCPRO_VERSION      - Pin to a specific release tag (default: latest)
#   HCPRO_INSTALL_DIR  - Override install directory (default: ~/.local/bin)
set -eu

BOLD="" GREEN="" RED="" RESET=""
if [ -z "${NO_COLOR:-}" ] && [ -t 1 ]; then
  BOLD="\033[1m"; GREEN="\033[32m"; RED="\033[31m"; RESET="\033[0m"
fi

info() { printf "${GREEN}info${RESET}  %s\n" "$1"; }
die()  { printf "${RED}error${RESET} %s\n" "$1" >&2; exit 1; }

need() { command -v "$1" >/dev/null 2>&1 || return 1; }
need curl   || die "curl is required but not found."
need tar    || die "tar is required but not found."
need claude || die "Claude Code is required but not found. Install it first: https://claude.ai/code"

REPO="ToDucThanh/housecallpro-mcp"
VERSION="${HCPRO_VERSION:-latest}"
BIN_DIR="${HCPRO_INSTALL_DIR:-$HOME/.local/bin}"
LIB_DIR="$HOME/.local/lib/hcpro"

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
case "$OS" in darwin|linux) ;; *) die "Unsupported OS: $OS" ;; esac
case "$ARCH" in x86_64|amd64) ARCH="x64" ;; aarch64|arm64) ARCH="arm64" ;; *) die "Unsupported arch: $ARCH" ;; esac

BINARY="hcpro-${OS}-${ARCH}"
TARBALL="${BINARY}.tar.gz"

if [ "$VERSION" = "latest" ]; then
  BASE_URL="https://github.com/${REPO}/releases/latest/download"
else
  BASE_URL="https://github.com/${REPO}/releases/download/${VERSION}"
fi

printf "\n"
info "Downloading hcpro (${OS}/${ARCH})..."

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

curl -fsSL "${BASE_URL}/${TARBALL}"        -o "${TMPDIR}/${TARBALL}"        || die "Download failed."
curl -fsSL "${BASE_URL}/${TARBALL}.sha256" -o "${TMPDIR}/${TARBALL}.sha256" || die "Checksum download failed."

info "Verifying checksum..."
cd "$TMPDIR"
if [ "$OS" = "darwin" ]; then
  shasum -a 256 -c "${TARBALL}.sha256" >/dev/null 2>&1 || die "Checksum mismatch."
else
  sha256sum -c "${TARBALL}.sha256" >/dev/null 2>&1 || die "Checksum mismatch."
fi

info "Installing to ${LIB_DIR}..."
rm -rf "$LIB_DIR" && mkdir -p "$LIB_DIR"
tar -xzf "${TMPDIR}/${TARBALL}" -C "$LIB_DIR"
mv "${LIB_DIR}/${BINARY}" "${LIB_DIR}/hcpro"
chmod +x "${LIB_DIR}/hcpro"

mkdir -p "$BIN_DIR"
ln -sf "${LIB_DIR}/hcpro" "${BIN_DIR}/hcpro"
info "Linked ${BIN_DIR}/hcpro"

case ":${PATH}:" in
  *":${BIN_DIR}:"*) ;;
  *)
    printf "\n  ${BOLD}Add to your PATH:${RESET}\n"
    printf "    export PATH=\"%s:\$PATH\"\n\n" "$BIN_DIR"
    ;;
esac

printf "\n"
info "hcpro installed!"
printf "\n"
printf "  ${BOLD}Get started:${RESET}\n"
printf "    hcpro auth login              # Connect HouseCall Pro\n"
printf "    hcpro auth claude login       # Connect Claude\n"
printf "    hcpro \"list my jobs today\"    # Start querying\n\n"
