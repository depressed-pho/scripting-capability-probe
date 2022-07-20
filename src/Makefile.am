MANIFEST_SRC = manifest.json.in

MCPACK_INSTALLATION_DIRECTORY = $(MCPACK_INSTALLATION_DIRECTORY_resource)
MCPACK_FILES = \
	items/wand_of_probing.json \
	manifest.json \
	pack_icon.png \
	scripts/server/index.js

EXTRA_DIST= \
	capability-probe.svg

# Strip comments from JSON.
%.json: %.json.in Makefile
	$(AM_V_GEN)
	$(AM_V_at)set -eu; \
	$(MKDIR_P) "$(dir $@)"; \
	$(SED) \
		-e "/^[ 	]*\/\//d" \
		< $< > $@.tmp; \
	mv $@.tmp $@

pack_icon.png: capability-probe.svg
	$(AM_V_GEN)
	$(AM_V_at)$(INKSCAPE) -o "$@" --export-width=128 --export-height=128 "$<"

CLEANFILES=
noinst_DATA=
include $(top_srcdir)/am/manifest.am
include $(top_srcdir)/am/mcpack.am
