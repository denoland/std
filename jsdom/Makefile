.PHONY: install bundle clean

install:
	npm install --no-package-lock \
	webpack@4.36.1 \
	webpack-cli@3.3.6 \
	jsdom@15.1.1

bundle:
	./node_modules/.bin/webpack-cli

clean:
	rm -rf node_modules vendor
