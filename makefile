# Node environment
code:
	docker run -ti --rm \
		-v $(shell pwd)\:/usr/src/app \
		-w /usr/src/app \
		-p 8080\:5173 \
		-u "node" \
		-e NPM_CONFIG_PREFIX=/home/node/.npm-global \
		node \
		bash

# Install dependencies
install:
	docker run -ti --rm \
		-u "node" \
		-v $(shell pwd)\:/usr/src/app \
		-w /usr/src/app \
		node \
		npm install

# Run dev server and auto lauch browser
dev:
	(sleep 2 && python3 -m webbrowser http://localhost:8456/) &
	docker run -ti --rm \
		-u "node" \
		-v $(shell pwd)\:/usr/src/app \
		-w /usr/src/app \
		-p 8456\:5173 \
		node \
		npm run dev

# Build bundle
build:
	docker run -ti --rm \
		-u "node" \
		-v $(shell pwd)\:/usr/src/app \
		-w /usr/src/app \
		node \
		npm run build
