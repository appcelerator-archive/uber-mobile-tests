'use strict';

/**
 * Copyright (c) 2015-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const path = require('path'),
	fs = require('fs-extra'),
	colors = require('colors'),
	ejs = require('ejs'),
	StreamSplitter = require('stream-splitter'),
	AppcUtil = require('../appc_util.js'),
	SOURCE_DIR = path.join(__dirname, 'app'),
	PROJECT_NAME = 'mocha',
	PROJECT_DIR = path.join(__dirname, PROJECT_NAME),
	UNIT_TESTS_DIR = path.join(__dirname, '..', '..', 'unit_tests'),
	TEMPLATES_DIR = path.join(__dirname, 'templates'),
	JUNIT_TEMPLATE = path.join(TEMPLATES_DIR, 'junit.xml.ejs'),
	APP_TEMPLATE = path.join(TEMPLATES_DIR, 'app.ejs');

class UnitTestHelper {
	/**
	 * Installs a Titanium SDK to test against, generates a test app, then runs the
	 * app for each platform with our mocha test suite. Outputs the results in a JUnit
	 * test report, and holds onto the results in memory as a JSON object.
	 *
	 * @param  {Object} sdkSrc branch/zip/url of SDK to install. If null/undefined, no SDK will be installed
	 * @param  {Array[String]} platforms [description]
	 * @param  {Function} callback  [description]
	 */
	static test(sdkSrc, platforms, callback) {
		let sdkPath,
			results = {};

		Promise.resolve()
			.then(() => {
				// install new SDK and delete old test app in parallel
				return new Promise((resolve, reject) => {
					initEnvironment(sdkSrc, resolve, reject);
				});
			})
			.then(() => {
				// Record the SDK we just installed so we retain it when we clean up at end
				return new Promise((resolve, reject) => {
					AppcUtil.getSDKInstallDir((err, installPath) => {
						if (err) {
							return reject(err);
						}
						sdkPath = installPath;
						resolve();
					});
				});
			})
			.then(() => {
				return new Promise(resolve => {
					console.log('Generating project');
					AppcUtil.generateProject(PROJECT_NAME, __dirname, platforms, resolve);
				});
			})
			.then(() => {
				return new Promise(resolve => {
					copyMochaAssets(resolve);
				});
			})
			.then(() => {
				return new Promise(resolve => {
					addTiAppProperties(resolve);
				});
			})
			.then(() => {
				return new Promise((resolve, reject) => {
					build(platforms, results, resolve, reject);
				});
			})
			.then(() => {
				AppcUtil.cleanNonGaSDKs(sdkPath, cleanupErr => {
					callback(cleanupErr, results);
				});
			})
			.catch(error => {
				callback(error);
			});
	}

	static outputResults(results) {
		let indents = 0,
			n = 0,
			suites = {},
			passes = 0,
			failures = 0,
			skipped = 0,
			keys = [];

		function indent() {
			return Array(indents).join('  ');
		}

		// start
		console.log();

		results.forEach(item => {
			let s = suites[item.suite] || {
				tests: [],
				suite: item.suite,
				duration: 0,
				passes: 0,
				failures: 0,
				start: ''
			}; // suite name to group by
			s.tests.unshift(item);
			s.duration += item.duration;
			if (item.state === 'failed') {
				s.failures += 1;
			} else if (item.state === 'passed') {
				s.passes += 1;
			}
			suites[item.suite] = s;
		});
		keys = Object.keys(suites);

		keys.forEach(v => {
			++indents;
			console.log('%s%s', indent(), v);
			// now loop through the tests
			suites[v].tests.forEach(test => {
				if (test.state === 'skipped') {
					skipped++;
					console.log(indent() + colors.cyan('  - %s'), test.title);
				} else if (test.state === 'failed') {
					failures++;
					console.log(indent() + colors.red('  %d) %s'), ++n, test.title);
					++indents;
					console.log(indent() + colors.red('  %s'), JSON.stringify(test));
					--indents;
				} else {
					passes++;
					console.log(indent() + colors.green('  ✓') + colors.gray(' %s '), test.title);
				}
			});
			--indents;
			if (1 === indents) {
				console.log();
			}
		});

		// Spit out overall stats: test count, failure count, pending count, pass count.
		console.log('%d Total Tests: %d passed, %d failed, %d skipped.', (skipped + failures + passes), passes, failures, skipped);
	}
}

module.exports = UnitTestHelper;

// Add required properties for our unit tests!
function addTiAppProperties(done) {
	const tiapp_xml = path.join(PROJECT_DIR, 'tiapp.xml'),
		content = [];

	// Not so smart but this should work...
	fs.readFileSync(tiapp_xml).toString().split(/\r?\n/).forEach(line => {
		content.push(line);
		// FIXME app thinning breaks tests which expect image files to exist on filesystem normally!
		if (line.indexOf('<use-app-thinning>') >= 0) {
			// used 'appc new' to create the mobile project; remove the default created <use-app-thinning>
			content.pop();
			// and turn off app-thinning
			content.push('<use-app-thinning>false</use-app-thinning>');
		} else if (line.indexOf('<modules>') >= 0) {
			// Grab contents of modules/modules.xml to inject as moduel listign for tiapp.xml
			// This allows PR to override

			// remove open tag
			content.pop();
			// now inject the overriden modules listing from xml file
			content.push(fs.readFileSync(path.join(SOURCE_DIR, 'modules', 'modules.xml')).toString());
		} else if (line.indexOf('</modules>') >= 0) {
			// ignore end modules tag since injection above already wrote it!
			content.pop();
		} else if (line.indexOf('<property name="ti.ui.defaultunit"') >= 0) {
			// Inject some properties used by tests!
			// TODO Move this out to a separate file so PR could override

			content.push('\t<property name="presetBool" type="bool">true</property>');
			content.push('\t<property name="presetDouble" type="double">1.23456</property>');
			content.push('\t<property name="presetInt" type="int">1337</property>');
			content.push('\t<property name="presetString" type="string">Hello!</property>');
		}
	});
	fs.writeFileSync(tiapp_xml, content.join('\n'));

	done();
}

function copyMochaAssets(done) {
	// copy (overwrite if already exists) Resources directory
	let src = path.join(SOURCE_DIR, 'Resources'),
		dest = path.join(PROJECT_DIR, 'Resources');
	fs.copySync(src, dest);

	const mobileTests = [];
	fs.readdirSync(UNIT_TESTS_DIR).forEach(file => {
		if (/.+\.test\.js$/.test(file)) {
			mobileTests.push(`require('./${file}');`);

			// copy (overwrite if already exists) all unit tests into the titanium app
			const unitTestFile = path.join(UNIT_TESTS_DIR, file),
				destTestFile = path.join(dest, file);
			fs.copySync(unitTestFile, destTestFile);
		}
	});
	// create an app.js that has the required unit tests
	const appJs = ejs.render(fs.readFileSync(APP_TEMPLATE).toString(), {
		unitTests: mobileTests
	});
	fs.writeFileSync(path.join(dest, 'app.js'), appJs);

	// copy (overwrite if already exists) modules so we can test those too
	src = path.join(SOURCE_DIR, 'modules');
	dest = path.join(PROJECT_DIR, 'modules');
	fs.copySync(src, dest);

	// copy (overwrite if already exists) plugins so we can test those too
	src = path.join(SOURCE_DIR, 'plugins');
	dest = path.join(PROJECT_DIR, 'plugins');
	if (fs.existsSync(src)) {
		fs.copySync(src, dest);
	}

	// copy (overwrite if already exists) i18n so we can test those too
	src = path.join(SOURCE_DIR, 'i18n');
	dest = path.join(PROJECT_DIR, 'i18n');
	if (fs.existsSync(src)) {
		fs.copySync(src, dest);
	}
	done();
}

/**
 * Once a build has been spawned off this handles grabbing the test results from the output.
 * @param  {[type]}   prc  Handle of the running process from spawn
 * @param  {Function} done [description]
 */
function handleBuild(prc, done) {
	let results = [],
		output = '',
		stderr = '',
		splitter = prc.stdout.pipe(StreamSplitter('\n'));

	// Set encoding on the splitter Stream, so tokens come back as a String.
	splitter.encoding = 'utf8';

	splitter.on('token', token => {
		console.log(token);

		let str = token,
			index = -1,
			result;

		if ((index = str.indexOf('!TEST_START: ')) !== -1) {
			// grab out the JSON and add to our result set
			str = str.slice(index + 13).trim();
			output = '';
			stderr = '';
		} else if ((index = str.indexOf('!TEST_END: ')) !== -1) {
			str = str.slice(index + 11).trim();
			//  grab out the JSON and add to our result set
			result = JSON.parse(massageJSONString(str));
			result.stdout = output; // record what we saw in output during the test
			result.stderr = stderr; // record what we saw in output during the test
			results.push(result);
			output = ''; // reset output
			stderr = ''; // reset stderr
			result = null; // reset test result object
		} else if ((index = str.indexOf('!TEST_RESULTS_STOP!')) !== -1) {
			prc.kill();
			return done(null, {
				date: new Date().toISOString(),
				results: results
			});
			// Handle when app crashes and we haven't finished tests yet!
		} else if (((index = str.indexOf('-- End application log ----')) !== -1) ||
			((index = str.indexOf('-- End simulator log ---')) !== -1)) {
			prc.kill(); // quit this build...
			return done('Failed to finish test suite before app crashed and logs ended!'); // failed too many times
		} else {
			// append output
			output += `${str}\n`;
		}
	});
	splitter.on('error', err => {
		// Any errors that occur on a source stream will be emitted on the
		// splitter Stream, if the source stream is piped into the splitter
		// Stream, and if the source stream doesn't have any other error
		// handlers registered.
		done(err);
	});
	prc.stderr.on('data', data => {
		console.log(data.toString().trim());
		stderr += `${data.toString().trim()}\n`;
	});
}

function massageJSONString(testResults) {
	// preserve newlines, etc - use valid JSON
	testResults = testResults.replace(/\\n/g, "\\n")
		.replace(/\\'/g, '\\\'')
		.replace(/\\"/g, '\\"')
		.replace(/\\&/g, '\\&')
		.replace(/\\r/g, '\\r')
		.replace(/\\t/g, '\\t')
		.replace(/\\b/g, '\\b')
		.replace(/\\f/g, '\\f');
	// remove non-printable and other non-valid JSON chars
	return testResults.replace(/[\u0000-\u0019]+/g, '');
}

/**
 * Converts JSON results of unit tests into a JUnit test result XML formatted file.
 *
 * @param jsonResults {Object} JSON containing results of the unit test output
 * @param prefix {String} prefix for test names to identify them uniquely
 * @param done {Function} callback function
 */
function outputJUnitXML(jsonResults, prefix, done) {
	// We need to go through the results and separate them out into suites!
	let suites = {},
		keys = [],
		values = [],
		r = '';
	jsonResults.results.forEach(item => {
		let s = suites[item.suite] || {
			tests: [],
			suite: item.suite,
			duration: 0,
			passes: 0,
			failures: 0,
			start: ''
		}; // suite name to group by
		s.tests.unshift(item);
		s.duration += item.duration;
		if (item.state === 'failed') {
			s.failures += 1;
		} else if (item.state === 'passed') {
			s.passes += 1;
		}
		suites[item.suite] = s;
	});
	keys = Object.keys(suites);
	values = keys.map(v => {
		return suites[v];
	});
	r = ejs.render('' + fs.readFileSync(JUNIT_TEMPLATE), {
		'suites': values,
		'prefix': prefix
	});

	// Write the JUnit XML to a file
	fs.writeFileSync(path.join(__dirname, '..', '..', 'junit.' + prefix + '.xml'), r);
	done();
}

/**
 * Install the SDK version specified, and clean previous apps in parallel
 *
 * @param {Object} sdkSrc Branch/zip/url of SDK to install. If null/undefined, no SDK will be installed
 * @param {Function} done Resolve callback function
 * @param {Function} fail Rejection callback function
 */
function initEnvironment(sdkSrc, done, fail) {
	let installSDK = new Promise((resolve, reject) => {
		if (sdkSrc) {
			console.log('Installing SDK');
			AppcUtil.installSDK(sdkSrc, err => {
				(err) ? reject(err): resolve();
			});
		} else {
			resolve();
		}
	});

	let clearPreviousApp = new Promise(resolve => {
		// If the project already exists, wipe it
		if (fs.existsSync(PROJECT_DIR)) {
			fs.removeSync(PROJECT_DIR);
		}
		resolve();
	});

	Promise.all([installSDK, clearPreviousApp])
		.catch(fail)
		.then(done);
}

/**
 * Build all the app for all desired platforms, and run their respective test suite
 *
 * @param {Array} platforms Mobile OSs to be tested
 * @param {Array} results Collection of test results
 * @param {Function} done Resolve callback function
 * @param {Function} fail Rejection callback function
 */
function build(platforms, results, done, fail) {
	let p = Promise.resolve();
	platforms.forEach(platform => {
		p = p.then(() => {
			return new Promise((resolve, reject) => {
				AppcUtil.runBuild(PROJECT_DIR, platform, handleBuild, (err, result) => {
					if (err) {
						reject(err);
					}
					results[platform] = result;
					outputJUnitXML(result, platform, resolve);
				});
			});
		});
	});

	p
		.catch(fail)
		.then(done);
}