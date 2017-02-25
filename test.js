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

// run unit tests first
let p = new Promise((resolve, reject) => {
	unit.test(program.branch, platforms, (err, results) => {
		if (err) {
			reject(err);
			return;
		}
		resolve(results);
	});
});

// print out results from unit tests
p.then(unitTestResults => {
	return new Promise(resolve => {
		platforms.forEach(platform => {
			console.log();
			console.log('=====================================');
			console.log(platform.toUpperCase());
			console.log('-------------------------------------');
			unit.outputResults(unitTestResults[platform].results);
		});
		resolve();
	});
});

p.then(() => {
	process.exit(0);
}).catch(err => {
	console.error(err.toString());
	process.exit(1);
});