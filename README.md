# uber-mobile-tests (WIP)

The purpose of this repo is to combine https://github.com/appcelerator/titanium-mobile-mocha-suite and https://github.com/appcelerator/appium-tests into a singular test framework.

# TODO:
- `test.js` will contain the main loop.
  - Using commander, it should provide the following options:
    - -b, --branch [branchName] -> Install a specific branch of the SDK to test with; defaults to `master`
    - -p, --platforms <platform1,platform2> -> Run unit tests and appium tests on the given platforms; defaults to both `andrdoid` and `ios`
    - -s, --suites <suite1,suite2> -> Run specified suite; defaults to running all suites
      - **THIS PART IS NOT INTEGRATED YET**; pulled from https://github.com/appcelerator/appium-tests
      - Add this later when time permits.
  - at a high-level, the main loop should do the following:
    1. In parallel, install new sdk and delete old test app.
    2. Record the SDK we just installed so we retain it when we clean up at end.
    3. Create a titanium project.
    4. Copy assets from `lib/unit_test/app` into the titanium project.
      a. Populate `lib/unit_test/templates/app.ejs` with the test suites from `./unit_tests`.
      b. Render `lib/unit_test/templates/app.ejs` into the titanium project.
    5. Add required properties for our unit tests.
    6. Run unit test builds for each platform, and spit out JUnit report.
    7. Remove all CI SDKs installed.
    8. **TODO:** follow `appium-tests` main loop: [here](https://github.com/appcelerator/appium-tests/blob/master/README.md#main-loop), minus `buildTestApps()`; the unit_test app should be enough.
      a. **TODO:** need to poupulate `appium_tests` folder with the this structure [here](https://github.com/appcelerator/appium-tests/tree/master/tests)
