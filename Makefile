build:
	make -C assets
	npm run build
	mkdir -p dist/assets/spaHandler
	cp -r assets/spaHandler/dist/* dist/assets/spaHandler/

deploy: build
	npm run deploy

destroy:
	npm run destroy