'use strict';

const
	driver = global.driver,
	webdriver = global.webdriver;

describe('ListView', function () {
	// in general, the tests take a while to go through, which will hit mocha's 2 second timeout threshold.
	// set timeout to 5 minutes
	this.timeout(300000);

	it('should scroll to the bottom of the list', function () {
		const scrollUp = new webdriver.TouchAction()
			.press({x: 386, y: 1034}) // press near the bottom of the list
			.moveTo({x: 0, y: -530}) // drag finger up
			.release(); // release finger

		return driver
			.performTouchAction(scrollUp)
			.sleep(1000)
			.elementByAndroidUIAutomator('new UiSelector().text("Piranha")');
	});
});