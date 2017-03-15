# uber-mobile-tests

A singular test framework that merged both https://github.com/appcelerator/titanium-mobile-mocha-suite and https://github.com/appcelerator/appium-tests.

# Requirements

1. Minimum node version 4.X.
2. Minimum NPM version 3.X.
3. GA Appc CLI Core should be installed on your machine and logged in.

  **Note:** Appc CLI NPM is a node dependency for this framework.
4. Genymotion emulator installed to default location; the Appium tests depend on it.

# Setup

1. Run `npm install`.
2. Install `appium-doctor`: `[sudo] npm install -g appium-doctor`.
3. Run `appium-doctor` and fix any issues that may come up.

# How-Tos

### Flag Usage

Run `node test.js --help` to see a list of available flags.

```
  Options:

    -h, --help                             output usage information
    -V, --version                          output the version number
    -b, --branch [branchName]              Install a specific branch of the SDK to test with. Defaults to 'master'.
    -u, --sdk-url <url>                    Install the specified SDK URL.
    -z, --sdk-zip <pathToZip>              Install the specified SDK zip.
    -p, --platforms <platform1,platform2>  Run unit tests on the given platforms. Defaults to 'android,ios'.
```

If you run `node test.js` (no flags), then the framework will check for new Titanium SDK against `master` branch
and run all tests on both Android and iOS platform in that order.

### Unit Tests

The Titanium unit tests lives in the `unit_tests` directory and uses the `ti-mocha.js` module to run the test suites.

This part is a port of https://github.com/appcelerator/titanium-mobile-mocha-suite, but with some differences:

* In `titanium-mobile-mocha-suite`, the unit tests (any `ti.*.test.js` file) lived here: https://github.com/appcelerator/titanium-mobile-mocha-suite/tree/master/Resources.
The unit tests in this framework live in the `./unit_tests` directory and will be copied over to `./lib/unit_test/mocha`; a Titanium classic app created at runtime.
* `./lib/unit_test/mocha` will contain `utilities/assertions.js` and `utilities/utilities.js` in the `Resources` directory. Hence, the unit tests will contain these
modules at the top:

```
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');
```

### Appium Tests

The Appium tests (UI verification) lives in the `appium_tests` directory.

This part is a port of https://github.com/appcelerator/appium-tests. To write Appium tests, follow these steps: https://github.com/appcelerator/appium-tests#how-to-write-tests.

**Note:** The above link will reference this test suite structure:

```
tests/
|--- suite_name/
	 |--- test_app/
	 |--- platform.js
	 |--- platform2.js
```

For this framework, the `tests/` directory will be `appium_tests/` directory:

```
appium_tests/
|--- suite_name/
	 |--- test_app/
	 |--- platform.js
	 |--- platform2.js
```

# Technical Notes

* Entry point file is `test.js` and all supporting files live in `lib` directory.
* Unit tests run first before running the Appium tests.
* Unit test flow `require('./lib/unit_test/helper.js').test()`:

  1. In parallel:

    a. Install and set as default the new Titanium SDK, if available.

    b. Delete `mocha` test app, if available.
  2. Record the path to the installed Titanium SDK. Will be used for SDK cleanup.
  3. Create a Titanium classic project (called `mocha`) with `appc new`.
  4. Copy files from `lib/unit_test/app` into `mocha/Resources` directory.

    a. During this phase, the unit tests in `unit_tests` directory will be copied into `mocha/Resources`
  5. Add specific properties into `mocha/tiapp.xml`.
  6. Run (using `appc run`) `mocha` app, i.e. unit tests, against specified platforms.
  7. Write results to JUnit XML files at the root level of this framework.
  8. Delete all non-GA and non-selected Titanium SDKs.

* Appium flow `require('./lib/appium_test/helper.js').test()`:

  1. Launch Appium server locally.
  2. Clean and build (with `appc` CLI) all the test apps in `appium_tests` directory with selected Titanium SDK.
  3. While looping through each test suite in `appium_tests` directory, do the following:

    a. Launch designated Genymotion emulator if testing against Android platform. If testing against iOS platform, designated simulator will be launched in next step by Appium.

    b. If testing for Android platform, connect Genymotion emulator to Appium server and install test app to the emulator. If testing for iOS platform, Appium will launch the designated iOS simulator, connect it to the server, and install the test app.

    c. Run the mocha test suite on the simulator/emulator and print out results to console.

    d. Once testing is complete, disconnect the simulator/emulator from Appium server. Depending on the `desiredCapabilities`, iOS simulators can be left running or killed.

    e. If Genymotion emulator is still running, gracefully kill the process.
  4. Gracefully kill the Appium local server.
