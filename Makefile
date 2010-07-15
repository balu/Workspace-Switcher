VERSION=0.4
DISTRO_FILES=chrome.manifest content skin defaults install.rdf README

.PHONY: clean distro

clean:
	rm -rf *~ content/*~ wss.xpi
distro:
	mkdir -p downloads
	rm -rf downloads/wss-${VERSION}.xpi
	zip -r downloads/wss-${VERSION}.xpi ${DISTRO_FILES}
