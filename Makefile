build:
	make -C assets
	npm run build
	mkdir -p dist/assets/spaHandler
	mkdir -p dist/assets/sampleContent
	cp -r assets/spaHandler/dist/* dist/assets/spaHandler/
	cp -r assets/sampleContent/dist/* dist/assets/sampleContent/

deploy: build
	npm run deploy

destroy:
	npm run destroy

publish: build
	npm publish