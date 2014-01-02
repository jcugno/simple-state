REPORTER = dot
FILES = test/*

test:
	@NODE_ENV=test ./node_modules/mocha/bin/mocha $(FILES) \
	  --reporter $(REPORTER) \
	  --recursive

.PHONY: test
