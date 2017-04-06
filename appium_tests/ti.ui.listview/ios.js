'use strict';

const
	driver = global.driver,
	webdriver = global.webdriver;

describe('ListView', function () {
	// in general, the tests take a while to go through, which will hit mocha's 2 second timeout threshold.
	// set timeout to 5 minutes
	this.timeout(300000);

	it('should scroll to the bottom of the list', function () {
		return driver
			.waitForElementByName('Apple', webdriver.asserters.isDisplayed)
			.execute('mobile: scroll', {direction: 'down'})
			.waitForElementByName('Haddock', webdriver.asserters.isDisplayed)
			.execute('mobile: scroll', {direction: 'down'})
			.waitForElementByName('Trout', webdriver.asserters.isDisplayed);
	});
});