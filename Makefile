UUID = utc-clock@swsnr.de

CATALOGS = $(wildcard po/*.po)

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
