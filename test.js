'use strict';

const
	program = require('commander'),
	unit = require('./lib/unit_test/helper.js'),
	ui = require('./lib/appium_test/helper.js'),
	VER = require('./package.json').version;

program
	.version(VER)
	// TODO Allow choosing a URL or zipfile as SDK to install!
	.option('-b, --branch [branchName]', 'Install a specific branch of the SDK to test with', 'master')
	.option('-p, --platforms <platform1,platform2>', 'Run unit tests on the given platforms', /^(android(,ios)?)|(ios(,android)?)$/, 'android,ios')
	.parse(process.argv);

const platforms = program.platforms.split(',');

new Promise((resolve, reject) => {
	// run unit tests first
	unit.test(program.branch, platforms, (err, results) => {
		if (err) {
			reject(err);
			return;
		}
		resolve(results);
	});
})
.then(unitTestResults => {
	// print out results from unit tests
	return new Promise(resolve => {
		platforms.forEach(platform => {
			const header = `
=====================================
${platform.toUpperCase()}
-------------------------------------`;
			console.log(header);
			unit.outputResults(unitTestResults[platform].results);
		});
		resolve();
	});
})
.then(() => {
	// run the appium mocha tests
	return new Promise((resolve, reject) => {
		ui.test(platforms, resolve, reject);
	});
})
.catch(err => {
	const msg = err.stack || err.toString();
	console.log(msg);
	process.exit(1);
});