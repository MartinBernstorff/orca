# Local install of this checkout into /Applications. These builds are ad-hoc
# signed, so the in-app updater can never update them — re-run `make deploy`.

# electron-builder spells it arm64/x64; lipo and uname spell it arm64/x86_64.
HOST_ARCH := $(shell uname -m)
EB_ARCH := $(shell uname -m | sed 's/^x86_64$$/x64/')
APP_DEST := /Applications/Orca.app
CLI_LINK := /usr/local/bin/orca
UNPACKED := dist/mac dist/mac-arm64 dist/mac-x64 dist/mac-universal

.PHONY: deploy pull build install cli-link clean uninstall

deploy: build install cli-link

# Fast-forward to your fork's latest, then deploy.
pull:
	git pull --ff-only
	$(MAKE) deploy

# Host arch only, `dir` target only: DMG/ZIP packaging adds minutes and produces
# nothing a local install uses. Cleaning first guarantees install/ finds one app.
build:
	pnpm install --frozen-lockfile
	rm -rf $(UNPACKED)
	pnpm run build:mac -- --mac dir --$(EB_ARCH)

install:
	@set -eu; \
	matches=$$(find dist -maxdepth 2 -type d -name Orca.app); \
	count=$$(printf '%s' "$$matches" | grep -c . || true); \
	if [ "$$count" -ne 1 ]; then \
		echo "Expected exactly one built Orca.app, found $$count:"; \
		printf '  %s\n' $$matches; \
		echo "Run 'make build' — it cleans dist/ so only the host arch remains."; \
		exit 1; \
	fi; \
	built_arch=$$(lipo -archs "$$matches/Contents/MacOS/Orca"); \
	if [ "$$built_arch" != "$(HOST_ARCH)" ]; then \
		echo "Refusing to install $$matches: built $$built_arch, host is $(HOST_ARCH)."; \
		exit 1; \
	fi; \
	echo "Installing $$matches ($$built_arch) -> $(APP_DEST)"; \
	osascript -e 'tell application "Orca" to quit' >/dev/null 2>&1 || true; \
	for i in 1 2 3 4 5 6 7 8 9 10; do pgrep -qx Orca || break; sleep 1; done; \
	if pgrep -qx Orca; then echo "Orca is still running; quit it and retry."; exit 1; fi; \
	rm -rf "$(APP_DEST)"; \
	ditto "$$matches" "$(APP_DEST)"; \
	xattr -dr com.apple.quarantine "$(APP_DEST)" 2>/dev/null || true; \
	echo "Installed $$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$(APP_DEST)/Contents/Info.plist") ($$(lipo -archs "$(APP_DEST)/Contents/MacOS/Orca"))"

cli-link:
	@target="$(APP_DEST)/Contents/Resources/bin/orca"; \
	if [ "$$(readlink $(CLI_LINK) 2>/dev/null)" = "$$target" ]; then \
		echo "$(CLI_LINK) already linked."; \
	else \
		echo "Linking $(CLI_LINK) -> $$target (may prompt for sudo)"; \
		sudo ln -sfn "$$target" "$(CLI_LINK)"; \
	fi

clean:
	rm -rf dist

uninstall:
	rm -rf "$(APP_DEST)"
	sudo rm -f "$(CLI_LINK)"
