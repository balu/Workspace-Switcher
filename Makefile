VERSION=0.2
.PHONY: clean distro

clean:
	rm -rf *~ content/*~ wss.xpi
distro:
	mkdir -p downloads
	zip -r downloads/wss-${VERSION}.xpi *
