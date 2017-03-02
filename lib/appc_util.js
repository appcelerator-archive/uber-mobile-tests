'use strict';

const
	spawn = require('child_process').spawn,
	os = require('os'),
	path = require('path');

let appcExe = path.join(__dirname, '..', 'node_modules', '.bin', 'appc');
if (os.platform() === 'win32') {
	appcExe += '.cmd';
}

const NO_FLAGS = ['--no-banner', '--no-colors', '--no-prompt', '--no-services'];

class AppcUtil {
	/**
		Install the specified SDK version and make it the default

		@param {String} sdkVersion - sdk version
		@param {Function} done - async callback function
	**/
	static installSDK(sdkVersion, done) {
		let args = ['ti', 'sdk', 'install'];
		if (sdkVersion.indexOf('.') == -1) { // no period, probably mean a branch
			args.push('-b');
		}
		args.push(sdkVersion);
		args.push('-d'); // make default
		args = args.concat(NO_FLAGS);

		const appcCmd = _spawnConvert(appcExe, args);

		console.log(`Installing SDK with args: ${args}`);
		const prc = spawn(appcCmd, args);
		prc.stdout.on('data', data => {
			console.log(data.toString());
		});
		prc.on('exit', code => {
			if (code !== 0) {
				done('Failed to install SDK');
			} else {
				done();
			}
		});
	}

	/**
		Look up the full path to the SDK we just installed (the SDK we'll be hacking
		to add our locally built Windows SDK into).

		@param {Function} done - callback function
	**/
	static getSDKInstallDir(done) {

	}

	/**
		Runs `appc new` to generate a project for the specific platforms.

		@param {Array} platforms - array of valid platform strings
		@param {Function} done - callback function
	**/
	static generateProject(platforms, done) {

	}

	/**
		Runs `appc run`

		@param {String} platform - a valid platorm
		@param {Function} done - callback function
	**/
	static runBuild(platform, done) {

	}

	/**
		Remove all CI SDKs installed. Skip GA releases, and skip the passed in SDK path we just installed.

		@param {String} sdkPath - The SDK we just installed for testing. Keep this one in case next run can use it.
		@param {Function} done - callback function
	**/
	static cleanNonGaSDKs(sdkPath, done) {

	}
}
module.exports = AppcUtil;

/**
	an internal method to convert ChildProcess.spawn() arguments to be more cross-platform

	@param {String} cmd - the external program/process to call
	@param {Array} flags - the flags that will be passed to the external program/process
	@return {String} - returns the same program or cmd.exe
**/
function _spawnConvert(cmd, flags) {
	switch (os.platform()) {
		case 'win32':
			flags.unshift('/c', cmd);
			return 'cmd.exe';

		default: // macOS
			return cmd;
	}
}