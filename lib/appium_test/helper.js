'use strict';

const
	Setup = require('./setup_appium.js'),
	AppcUtil = require('../appc_util.js'),
	Mocha = require('mocha'),
	path = require('path'),
	fs = require('fs'),
	spawn = require('child_process').spawn,
	os = require('os');

const
	TEST_DIR = 'appium_tests',
	TEMP_APP = './temp',
	CONFIG_TESTS = require('../../appium_tests/test_config.js').tests,
	CONFIG_SERVER = require('../../appium_tests/test_config.js').server;

/* jshint -W079 */
const setup = new Setup();

// these will be accessed in the appium mocha tests
global.driver = setup.appiumServer(CONFIG_SERVER);
global.webdriver = setup.getWd();

exports.test = function (platforms, done, bail) {
	let
		ranAlready = '',
		appiumProc = null,
		playerPid = -1;

	const suiteData = _transform(platforms);

	let p = new Promise(resolve => {
		// start the local appium server
		appiumProc = _runAppium(CONFIG_SERVER, resolve);
	});

	_createTests(suiteData).forEach(test => {
		p = p.then(() => {
			// TODO: copy files from TEST_DIR to lib/appium_test/temp
			console.log(test.suite);
			process.exit(0);
		})
		.then(() => {
			return new Promise((resolve, reject) => {
				_buildTestApps(suiteData, resolve, reject);
			})
			.catch(err => {
				throw err;
			});
		})
		.then(() => {
			return new Promise((resolve, reject) => {
				if (test.cap.platformName !== 'Android') {
					resolve();
					return;
				}
				// need to launch the genymotion emulator first.
				// appium won't launch it like it does for ios simulators.
				_launchGeny(test.cap.deviceName, resolve, reject);
			})
			.then(pid => {
				playerPid = pid;
			});
		})
		.then(() => {
			// expose which device is being used to the test suites
			global.curDevice = {
				name: test.cap.deviceName,
				ver: test.cap.platformVersion
			};

			console.log(`Installing ${test.cap.app} to ${test.cap.deviceName} ...`);
			// TODO: need a flag if we want more logging
			return setup.startClient(test.cap, false);
		})
		.then(() => {
			return new Promise(resolve => {
				// grrrrr, can't run the same test suite twice in mocha; need to apply this workaround
				// https://github.com/mochajs/mocha/issues/995
				if (ranAlready === test.suite) {
					for (let file in require.cache) {
						// seems safe: http://stackoverflow.com/a/11477602
						delete require.cache[file];
					}
				}
				ranAlready = test.suite;

				// this is also part of the above workaround
				new Mocha({
					useColors: false,
					fullStackTrace: true
				})
				.addFile(test.suite)
				.run(failures => {
					resolve();
				});
			});
		})
		.then(() => {
			// sever the connection between the client device and appium server
			return setup.stopClient();
		})
		.then(() => {
			return new Promise(resolve => {
				if (test.cap.platformName !== 'Android') {
					resolve();
					return;
				}
				// quit the currently running genymotion emulator
				_quitGeny(playerPid, resolve);
			});
		});
		// TODO: delete lib/appium_test/temp
	});

	p.then(() => {
		console.log('Done running Appium tests.');
		done();
	})
	.catch(err => {
		bail(err);
	})
	.then(() => {
		_killAppium(appiumProc);
	});
};

/**
	generates an array of objects to be used by _buildTestApps()

	@param {Array} platforms - a list of supported platforms
	@return {Array} - array of json objects; the object properies are defined as:
		{
			mocha: absolute path to the mocha file in the TEST_DIR,
			app: absolute path to the test app associated with the appium test,
			name: the name of the test suite,
			platform: the target platform that the test suite is tested against
		}
**/
function _transform(platforms) {
	const
		suites = [],
		files = [];

	platforms.forEach(platform => {
		const configTests = CONFIG_TESTS[platform];
		for (let suite in configTests) {
			// ignore 'desiredCapabilities'; it's not a suite
			if (suite !== 'desiredCapabilities') {
				const
					mochaFile = _makeAbs(`${suite}${path.sep}${platform}.js`),
					testApp = _makeAbs(path.join(suite, configTests[suite].proj));

				try {
					fs.statSync(mochaFile);
					fs.statSync(testApp);
				}
				catch (err) {
					throw new Error(`'${err.path}' doesn't exist in '${TEST_DIR}' directory.`);
				}

				suites.push({
					mocha: mochaFile,
					app: testApp,
					name: suite,
					platform: platform
				});
			}
		}
	});

	return suites;
}

/**
	starts and run the local appium server.

	@param {Object} server - the server property from test_config.js
	@param {Function} done - the callback to call when the server is up and running
**/
function _runAppium(server, done) {
	let appiumExe = path.join(__dirname, '..', '..', 'node_modules', '.bin', 'appium');
	if (os.platform() === 'win32') {
		// use the windows compatible appium script
		appiumExe += '.cmd';
	}

	let flags = ['--log-no-colors'];

	const cmd = AppcUtil.spawnConvert(appiumExe, flags);

	const prc = spawn(cmd, flags);

	prc.stdout.on('data', output => {
		const line = output.toString().trim();

		const
			regStr = `started on (0\\.0\\.0\\.0|${server.host})\\:${server.port}$`,
			isRunning = new RegExp(regStr, 'g').test(line);
		if (isRunning) {
			console.log(`Local Appium server started on ${server.host}:${server.port}`);
			done();
		}

		const isShutDown = '[Appium] Received SIGTERM - shutting down' === line;
		if (isShutDown) {
			console.log('Appium server shutting down ...');
		}
	});
	prc.stderr.on('data', output => {
		console.log(output.toString());
	});
	prc.on('error', err => {
		console.log(err.stack);
	});

	return prc;
}

/**
	a wrapper to kill the spawned local appium server process.

	NOTE: running appiumProc.kill() on windows only kills the parent, which orphans its child processes.
	'taskkill' should kill the parent and it's children.
**/
function _killAppium(appiumProc) {
	if (os.platform() === 'win32') {
		console.log('Appium server shutting down ...');
		spawn('taskkill', ['/PID', appiumProc.pid, '/T', '/F']);
	} else {
		appiumProc.kill();
	}
}

/**
	using the suite data structure from transform() method, generate a list of mocha suite
	and appium capabilities pair.

	@param {Array} suites - the data structure returned from transform() method
	@return {Array} - an array of json objects; the object properies are defined as:
		{
			suite: absolute path to the test suite in the TEST_DIR,
			cap: valid appium's capabilities; https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/default-capabilities-arg.md
		}
**/
function _createTests(suites) {
	const listOfTests = [];

	suites.forEach(targetSuite => {
		const
			tests = CONFIG_TESTS[targetSuite.platform],
			desiredCap = tests.desiredCapabilities,
			configSuite = tests[targetSuite.name];

		const tiBuildDir = path.join(targetSuite.name, configSuite.proj, 'build');

		switch (targetSuite.platform) {
			case 'ios':
				desiredCap.platformName = 'iOS';

				// appium needs an absolute path to the specified built mobile app (simulator only for now)
				const iosApp = path.join(tiBuildDir, 'iphone', 'build', 'Products', 'Debug-iphonesimulator', `${configSuite.proj}.app`);
				desiredCap.app = _makeAbs(iosApp);
			break;

			case 'android':
				desiredCap.platformName = 'Android';

				// for android, appium requires these two properties
				desiredCap.appPackage = configSuite.appPackage;
				desiredCap.appActivity = configSuite.appActivity;

				// appium needs an absolute path to the specified built mobile app
				const androidApk = path.join(tiBuildDir, 'android', 'bin', `${configSuite.proj}.apk`);
				desiredCap.app = _makeAbs(androidApk);
			break;

			case 'windows':
				// NOTE: don't know the actually appium value
				desiredCap.platformName = 'Windows';
			break;
		}

		// it is possible for a test suite to have multiple target test devices
		configSuite.testDevices.forEach(device => {
			// Object.assign() makes a shallow copy (propertry and values only) of desiredCap object
			const newDesires = Object.assign({}, desiredCap);
			newDesires.deviceName = device.deviceName;
			newDesires.platformVersion = device.platformVersion;

			listOfTests.push({
				suite: targetSuite.mocha,
				cap: newDesires
			});
		});
	});

	return listOfTests;
}

/**
	use appc cli to do the following:
		1. get the active sdk
		2. change the titanium test app to the active sdk
		3. clean the titanium test app
		4. build (only) the test apps per platform

	@param {Array} suites - the data structure from _transform() method
	@param {Function} done - the promise resolve function to call once the task is done
	@param {Function} bail - the promise reject function to call if there are any failures
**/
function _buildTestApps(suites, done, bail) {
	// in test_config.js, the same titanium app can appear per platform per suite.
	// so, will need to track which project's tiapp.xml has already been modified
	const tiappMod = {};

	let activeSDK = '';
	let p = new Promise((resolve, reject) => {
		AppcUtil.getSDKList(resolve, reject);
	})
	.then(sdkList => {
		activeSDK = sdkList.activeSDK;
	});

	suites.forEach(targetSuite => {
		p = p.then(() => {
			const
				tiProj = CONFIG_TESTS[targetSuite.platform][targetSuite.name].proj,
				mobileProjDir = _makeAbs(path.join(targetSuite.name, tiProj));

			// only change the tiapp.xml if it hasn't been modified
			if (!tiappMod[tiProj]) {
				tiappMod[tiProj] = true;
				const tiappXmlFile = path.join(mobileProjDir, 'tiapp.xml');
				__change(tiappXmlFile);
			}

			return mobileProjDir;
		})
		.then(mobileProjDir => {
			return new Promise(resolve => {
				// shouldn't clean the build directory needlessly because the other built app is probably still good
				AppcUtil.cleanProject(mobileProjDir, targetSuite.platform, resolve);
			})
			.then(() => {
				return mobileProjDir;
			});
		})
		.then(mobileProjDir => {
			return new Promise(resolve => {
				AppcUtil.buildOnly(mobileProjDir, targetSuite.platform, buildPrc => {
					buildPrc.stdout.on('data', prcCb);
					buildPrc.stderr.on('data', prcCb);
					buildPrc.on('exit', () => {
						resolve();
					});

					function prcCb(output) {
						console.log(output.toString().trim());
					}
				});
			});
		});
	});

	p.then(() => {
		done();
	})
	.catch(err => {
		bail(err);
	});

	// modify the tiapp.xml with the specified titanium sdk
	function __change(tiappXml) {
		let xml = fs.readFileSync(tiappXml, {encoding: 'utf8'}).trim();

		const
			oldSdkXml = xml.match(/<sdk\-version>.+<\/sdk\-version>/g)[0],
			newSdkXml = `<sdk-version>${activeSDK}</sdk-version>`;

		xml = xml.replace(oldSdkXml, newSdkXml);
		fs.writeFileSync(tiappXml, xml);
	}
}

/**
	launch the specified genymotion emulator if it is defined in your genymotion app.

	NOTE: this assumes that you have genymotion and virtualbox installed on the machine and in the default location.

	@param {String} genyDevice - the genymotion emulator used for testing
	@param {Function} done - the Promise resolve function; called only when this task is done
	@param {Function} stop - the Promise reject function; called when runtime errors appear in this promise chain
**/
function _launchGeny(genyDevice, done, stop) {
	console.log(`Launching Genymotion emulator: ${genyDevice} ...`);

	let playerPid = -1;

	// check if the specified genymotion emulator is in genymotion app
	new Promise((resolve, reject) => {
		let vboxManageExe = 'VBoxManage';
		if (os.platform() === 'win32') {
			// need to get absolute path to VBoxManage.exe
			vboxManageExe = path.join(process.env.VBOX_MSI_INSTALL_PATH, 'VBoxManage.exe');
		}

		const listVmsCmd = spawn(vboxManageExe, ['list', 'vms']);

		let output = '';
		listVmsCmd.stdout.on('data', chunk => {
			output += chunk;
		});

		listVmsCmd.stderr.on('data', output => {
			console.log(output.toString());
		});

		listVmsCmd.on('exit', () => {
			const
				regExp = new RegExp(`^"${genyDevice}"`, 'm'),
				deviceExist = regExp.test(output.trim());

			if (!deviceExist) {
				reject(new Error(`"${genyDevice}" doesn't exist; make sure to add it in genymotion.`));
				return;
			}
			resolve();
		});
	})
	.then(() => {
		return new Promise(resolve => {
			// player executable should be in the default install location (hopefully)
			const player = (os.platform() === 'win32') ?
				'C:\\Program Files\\Genymobile\\Genymotion\\player.exe' :
				'/Applications/Genymotion.app/Contents/MacOS/player.app/Contents/MacOS/player';

			// launch genymotion emulator via player
			const flags = ['--vm-name', genyDevice],
				playerCmd = spawn(player, flags);
			playerPid = playerCmd.pid;

			// the spawned player prints to stdout and stderr, but the correct log information won't appear until you manually kill genymotion emulator.
			// so, going to use a ReadStream; seems faster than using fs.readFileSync
			const genymobileDir = (os.platform() === 'win32') ?
				path.join(process.env.LOCALAPPDATA, 'Genymobile') :
				path.join(os.homedir(), '.Genymobile');

			const playerLog = path.join(genymobileDir, 'Genymotion', 'deployed', genyDevice, 'genymotion-player.log');

			// sometimes, genymotion-player.log will not exist because genymotion have not been ran yet on the machine.
			// this will wait for the log file to be created so we can watch it.
			let logExist = null;
			while (!logExist) {
				try {
					logExist = fs.statSync(playerLog);
				}
				catch (err) { /* do nothing */ }
			}

			__readPlayerLog(60000); // 1 minute
			function __readPlayerLog(deltaLimit) {
				let isLaunched = false;

				const playerStream = fs.createReadStream(playerLog);
				playerStream.on('data', output => {
					const
						// putting the output in an array so it's easier to deal with
						matches = output.toString().trim().match(/\w+ \d+ \d+\:\d+\:\d+ .+/g),
						// try to grab the last line from the file
						lastLine = matches[matches.length - 1],
						// capture the timestamp that is prefixed in the log per line
						dateTime = lastLine.match(/^\w+ \d+|\d+\:\d+\:\d+/g),
						// create a valid date string for Date.parse; need to add the current year after date
						fullDateTime = `${dateTime[0]} ${new Date().getFullYear()} ${dateTime[1]}`;

					const
						logTime = Date.parse(fullDateTime),
						deltaTime = Date.now() - logTime;

					// should find the recent log that is within the delatLimit
					if (deltaTime <= deltaLimit && /Connected$/g.test(lastLine)) {
						isLaunched = true;
						resolve();
					}
				});
				playerStream.on('end', () => {
					if (!isLaunched) {
						deltaLimit += deltaLimit;
						__readPlayerLog(deltaLimit);
					}
				});
			}
		});
	})
	.then(() => {
		done(playerPid);
	})
	.catch(err => {
		stop(err);
	});
}

/**
	kills the genymotion emulator by running:
	- applescript on macOS: 'quit app "player"'
	- vbscript on Windows: look at vbScript

	if you were to send kill signals to the "player" process (from launchGeny()),
	then genymotion will not be able to handle those signals, i.e. the player process will be killed,
	but the VBox processes will still be alive and "adb devices" will persist the android emulator (both launched by "player").
	this will cause the next launch of genymotion emulator to be more likely to be unsuccessful.

	by running these external commands, they will make genymotion emulator die gracefully.

	@param {Number} playerPid - the genymotion pid
	@param {Function} done - Promise resolve function to call when this task is done
**/
function _quitGeny(playerPid, done) {
	let
		cmd = 'osascript',
		flags = ['-e', 'quit app "player"'];

	if (os.platform() === 'win32') {
		const vbScript = `
Set WshShell = WScript.CreateObject("WScript.Shell")
WshShell.AppActivate ${playerPid}
WshShell.SendKeys "%{F4}"`;

		const vbFile = path.join(__dirname, 'kill_geny.vbs');
		fs.writeFileSync(vbFile, vbScript);

		flags = [];
		cmd = AppcUtil.spawnConvert(vbFile, flags);
	}

	spawn(cmd, flags)
	.on('exit', () => {
		done();
	});
}

/**
	an internal method to create an absolute path to a file in the TEST_DIR

	@param {String} file - a file relative to TEST_DIR
	@return {String} - an absolute path to a file in the TEST_DIR
**/
function _makeAbs(file) {
	return path.join(__dirname, '..', '..', TEST_DIR, file);
}