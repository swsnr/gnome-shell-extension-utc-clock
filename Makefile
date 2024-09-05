PREFIX = /usr/local
DESTDIR =
HOME-DESTDIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)

UUID = utc-clock@swsnr.de

DIST-EXTRA-SRC = LICENSE-GPL2 LICENSE-MPL2 icons
BLUEPRINTS = $(wildcard ui/*.blp)
UIDEFS = $(addsuffix .ui,$(basename $(BLUEPRINTS)))
CATALOGS = $(wildcard po/*.po)

.PHONY: dist
dist: compile
	mkdir -p ./dist/
	mkdir -p ./build/ui
	cp -t ./build/ui $(UIDEFS)
	pnpm dist:format
	gnome-extensions pack --force --out-dir dist build \
		--podir=../po --extra-source=../metadata.json \
		--extra-source=ui --extra-source=lib \
		$(addprefix --extra-source=,$(wildcard src/*)) \
		$(addprefix --extra-source=../,$(DIST-EXTRA-SRC)) \
		$(addprefix --schema=../,$(wildcard schemas/*.gschema.xml))

# Make a reproducible dist package
.PHONY: dist-repro
dist-repro: dist
	strip-nondeterminism dist/$(UUID).shell-extension.zip

# Install to local home directory; this simply unpacks the zip file as GNOME would do
.PHONY: install-home
install-home: dist
	gnome-extensions install --force dist/$(UUID).shell-extension.zip

.PHONY: uninstall-home
uninstall-home:
	rm -rf $(HOME-DESTDIR)

# Install system wide, moving various parts to appropriate system directories
.PHONY: install-system
install-system: dist
	install -d \
		$(DESTDIR)/$(PREFIX)/share/gnome-shell/extensions/$(UUID) \
		$(DESTDIR)/$(PREFIX)/share/glib-2.0/schemas
	bsdtar -xf dist/$(UUID).shell-extension.zip \
		-C $(DESTDIR)/$(PREFIX)/share/gnome-shell/extensions/$(UUID) --no-same-owner
	mv $(DESTDIR)/$(PREFIX)/share/gnome-shell/extensions/$(UUID)/schemas/*.gschema.xml \
		$(DESTDIR)/$(PREFIX)/share/glib-2.0/schemas
	rm -rf $(DESTDIR)/$(PREFIX)/share/gnome-shell/extensions/$(UUID)/schemas

.PHONY: uninstall-system
uninstall-system:
	rm -rf \
		$(DESTDIR)/$(PREFIX)/share/gnome-shell/extensions/$(UUID) \
		$(DESTDIR)/$(PREFIX)/share/glib-2.0/schemas/org.gnome.shell.extensions.swsnr-utc-clock.gschema.xml

.PHONY: compile
compile: $(UIDEFS)
	pnpm compile

# For blueprint, see https://jwestman.pages.gitlab.gnome.org/blueprint-compiler/translations.html
# The language doesn't really matter for blueprint, but xgettext warns if we don't set it
.PHONY: pot
pot:
	find src -name '*.ts' | \
		xargs xgettext $(XGETTEXT_METADATA) \
			--from-code=UTF-8 --language=JavaScript --output=po/$(UUID).pot
	xgettext $(XGETTEXT_METADATA) --from-code=UTF-8 --language=C \
		--join-existing --output=po/$(UUID).pot \
		 --add-comments --keyword=_ --keyword=C_:1c,2 \
		$(wildcard ui/*.blp)

.PHONY: messages
messages: $(CATALOGS)

.PHONY: clean
clean:
	rm -rf ./dist/ ./build/

.PHONY: format
format:
	pnpm format --write

.PHONY: lint
lint:
	pnpm lint

.PHONY: check-types
check-types:
	pnpm check:types

.PHONY: check check-types
check: lint
	pnpm format --check

.PHONY: fix
fix: format
	pnpm lint --fix

$(UIDEFS): %.ui: %.blp
	blueprint-compiler compile --output $@ $<

$(CATALOGS): %.po: pot
	msgmerge --update --backup=none --lang=$(notdir $(basename $@)) $@ po/picture-of-the-day@swsnr.de.pot
