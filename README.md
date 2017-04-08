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

This part is a port of https://github.com/appcelerator/appium-tests. https://github.com/appcelerator/appium-tests#2-test_configjs and https://github.com/appcelerator/appium-tests#3-mocha-files still applies to this framework. However, take note when creating the test app in `appium_tests`. You can create either a Titanium classic app or Alloy app:

**Titanium classic app:**

* At a minimum, the Titanium classic app needs `Resources/app.js` and `tiapp.xml`.

```
appium_tests/
|--- suite_name/
     |--- ti_classic_app/
          |--- Resources/
               |--- app.js
          |--- tiapp.xml
     |--- platform.js
     |--- platform2.js
```

**Alloy app:**

* At a minimum, the Alloy app needs `app/controllers/index.js` and `tiapp.xml`.

```
appium_tests/
|--- suite_name/
     |--- alloy_app/
          |--- app/
               |--- controllers
                    |--- index.js
          |--- tiapp.xml
     |--- platform.js
     |--- platform2.js
```

* You do not need to worry about the default assets for the Titanium classic and Alloy app. They are stored separately in `./lib/appium_test/classic_app` and `./lib/appium_test/alloy_app` respectively.
* The test apps' behavior mimic a regular Titanium classic or Alloy app. For example, if the classic test app needs more images for testing, it's okay to create a `Resources/assets/images/` folder in the test app and add the images into that folder.
* If you want to replace the default assets with your own content, use the same default directory structure and file name in the test app.
* The `tiapp.xml` should be treated like how you would normally treat a `tiapp.xml` in a Titanium classic or Alloy app.
* No cloud services should be enabled for the test apps.

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

  1. Launch Appium server on local machine.
  2. Create a data structure that contains information about the target mocha file, target test app, and desired Appium capabilities.
  3. While looping through the previous data structure and do the following:

      a. Using the above data structure, create a temporary mobile app (`lib/appium_test/temp`) that combines both the base app (`alloy_app` or `classic_app`) and target test app.

      b. Build (with `appc` CLI) `temp` app with selected Titanium SDK.

      c. Launch designated Genymotion emulator if testing against Android platform. If testing against iOS platform, designated simulator will be launched in next step by Appium.

      d. If testing for Android platform, connect Genymotion emulator to Appium server and install test app to the emulator. If testing for iOS platform, Appium will launch the designated iOS simulator, connect it to the server, and install the test app.

      e. Run the mocha test suite on the simulator/emulator and print out results to console.

      f. Once testing is complete, disconnect the simulator/emulator from Appium server. Depending on the `desiredCapabilities`, iOS simulators can be left running or killed.

      g. If Genymotion emulator is still running, gracefully kill the process.

      h. Delete `lib/appium_test/temp`.

# Maintenance

If you plan to add new tests, update existing tests, or make changes to the library, run `npm run check`. This will run `eslint` which will enforce the coding style (see `.eslintrc.json` file) for this project.

Here are some useful links from ESLint:

* http://eslint.org/docs/user-guide/integrations
* http://eslint.org/docs/user-guide/configuring
* http://eslint.org/docs/rules/