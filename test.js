'use strict';

const
	program = require('commander'),
	unit = require('./lib/unit_test/helper.js'),
	ui = require('./lib/appium_test/helper.js'),
	getSDKSrc = require('./lib/appc_util.js').getSDKSrc,
	VER = require('./package.json').version;

program
	.version(VER)
	.option('-b, --branch [branchName]', 'Install a specific branch of the SDK to test with. Defaults to \'master\'.', 'master')
	.option('-u, --sdk-url <url>', 'Install the specified SDK URL.')
	.option('-z, --sdk-zip <pathToZip>', 'Install the specified SDK zip.')
	.option('-p, --platforms <platform1,platform2>', 'Run unit tests on the given platforms. Defaults to \'android,ios\'.', 'android,ios')
	.parse(process.argv);

const
	platforms = program.platforms.split(','),
	sdkSrc = getSDKSrc(program.branch, program.sdkUrl, program.sdkZip);

// simple check if platform is supported
platforms.forEach(platform => {
	const notSupported =
		platform !== 'ios' &&
		platform !== 'android';
	if (notSupported) {
		console.log(`'${platform}' is not a valid platform.`);
		process.exit(1);
	}
});

new Promise((resolve, reject) => {
	// run unit tests first
	unit.test(sdkSrc, platforms, (err, results) => {
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