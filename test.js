'use strict';

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

	test(program.branch, platforms, function(err, results) {
		if (err) {
			console.error(err.toString());
			process.exit(1);
			return;
		}

		async.eachSeries(platforms, function (platform, next) {
			console.log();
			console.log('=====================================');
			console.log(platform.toUpperCase());
			console.log('-------------------------------------');
			outputResults(results[platform].results, next);
		}, function (err) {
			if (err) {
				console.error(err.toString());
				process.exit(1);
				return;
			}

			process.exit(0);
		});
	});
*/