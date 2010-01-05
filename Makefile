.PHONY: clean distro

clean:
	rm -rf *~ content/*~ wss.xpi
distro:
	zip -r wss.xpi *
