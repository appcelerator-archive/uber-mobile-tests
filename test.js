'use strict';

const
	program = require('commander'),
	unit = require('./lib/unit_test/helper.js'),
	VER = require('./package.json').version;

program
	.version(VER)
	// TODO Allow choosing a URL or zipfile as SDK to install!
	.option('-b, --branch [branchName]', 'Install a specific branch of the SDK to test with', 'master')
	.option('-p, --platforms <platform1,platform2>', 'Run unit tests on the given platforms', /^(android(,ios)?)|(ios(,android)?)$/, 'android,ios')
	.parse(process.argv);

const platforms = program.platforms.split(',');
unit.test(program.branch, platforms, (err, results) => {
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