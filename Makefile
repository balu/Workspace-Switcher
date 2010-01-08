VERSION=0.1
.PHONY: clean distro

clean:
	rm -rf *~ content/*~ wss.xpi
distro:
	mkdir -p downloads
	zip -r downloads/wss-${VERSION}.xpi *
