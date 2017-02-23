'use strict';

const unit = require('./lib/unit_test/helper.js');

unit.test('master', ['ios'], (err, results) => {
	if (err) {
		console.error(err.toString());
		process.exit(1);
		return;
	}

	let p = Promise.resolve();

	platforms.forEach(platform => {
		p = p.then(() => {
			return new Promise((resolve, reject) => {
				console.log();
				console.log('=====================================');
				console.log(platform.toUpperCase());
				console.log('-------------------------------------');
				unit.outputResults(results[platform].results, resolve);
			});
		});
	});

	p.then(() => {
		process.exit(0);
	}).catch(err => {
		console.error(err.toString());
		process.exit(1);
	});
});

/*
	NOTE:
	- pulled from https://github.com/appcelerator/titanium-mobile-mocha-suite/blob/master/scripts/test.js#L474-L514
	- this will contain the main loop to run the unit tests first then the appium tests
	- es6 this file

	var program = require('commander'),
		packageJson = require('./package'),
		platforms = [];

	program
		.version(packageJson.version)
		// TODO Allow choosing a URL or zipfile as SDK to install!
		.option('-b, --branch [branchName]', 'Install a specific branch of the SDK to test with', 'master')
		.option('-p, --platforms <platform1,platform2>', 'Run unit tests on the given platforms', /^(android(,ios)?)|(ios(,android)?)$/, 'android,ios')
		.parse(process.argv);

	platforms = program.platforms.split(',');
*/