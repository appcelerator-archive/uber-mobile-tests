var win = Ti.UI.createWindow({backgroundColor: 'white'});
var listView = Ti.UI.createListView();
var sections = [];

var fruitSection = Ti.UI.createListSection({ headerTitle: 'Fruits'});
var fruitDataSet = [
    {properties: { title: 'Apple', color: 'black'}},
    {properties: { title: 'Banana', color: 'black'}},
	{properties: { title: 'Pineapple', color: 'black'}},
	{properties: { title: 'Peach', color: 'black'}},
	{properties: { title: 'Orange', color: 'black'}},
	{properties: { title: 'Durian', color: 'black'}},
	{properties: { title: 'Jackfruit', color: 'black'}},
	{properties: { title: 'Watermelon', color: 'black'}},
	{properties: { title: 'Prickly Pear', color: 'black'}},
	{properties: { title: 'Kiwi', color: 'black'}},
	{properties: { title: 'Tomatoes', color: 'black'}},
	{properties: { title: 'Asian Pear', color: 'black'}},
];
fruitSection.setItems(fruitDataSet);
sections.push(fruitSection);

var vegSection = Ti.UI.createListSection({ headerTitle: 'Vegetables'});
var vegDataSet = [
    {properties: { title: 'Carrots', color: 'black'}},
    {properties: { title: 'Potatoes', color: 'black'}},
	{properties: { title: 'Lettuce', color: 'black'}},
    {properties: { title: 'Winter Melon', color: 'black'}},
	{properties: { title: 'Bitter Melon', color: 'black'}},
    {properties: { title: 'Bok Choy', color: 'black'}},
	{properties: { title: 'Water Chestnut', color: 'black'}},
    {properties: { title: 'Bean Sprouts', color: 'black'}},
	{properties: { title: 'Nappa Cabbage', color: 'black'}},
	{properties: { title: 'Squash', color: 'black'}},
	{properties: { title: 'Spinach', color: 'black'}},
	{properties: { title: 'Sea Weed', color: 'black'}},
	{properties: { title: 'Ginger', color: 'black'}},
];
vegSection.setItems(vegDataSet);
sections.push(vegSection);

listView.sections = sections;
win.add(listView);
win.open();

var fishSection = Ti.UI.createListSection({ headerTitle: 'Fish'});
var fishDataSet = [
    {properties: { title: 'Cod', color: 'black'}},
    {properties: { title: 'Haddock', color: 'black'}},
	{properties: { title: 'Tuna', color: 'black'}},
	{properties: { title: 'Halibut', color: 'black'}},
	{properties: { title: 'Salmon', color: 'black'}},
	{properties: { title: 'Catfish', color: 'black'}},
	{properties: { title: 'Dogfish', color: 'black'}},
	{properties: { title: 'Shark', color: 'black'}},
	{properties: { title: 'Angler Fish', color: 'black'}},
	{properties: { title: 'Suckerfish', color: 'black'}},
	{properties: { title: 'Flatfish', color: 'black'}},
	{properties: { title: 'Rockfish', color: 'black'}},
	{properties: { title: 'Trout', color: 'black'}},
	{properties: { title: 'Piranha', color: 'black'}},
];
fishSection.setItems(fishDataSet);
listView.appendSection(fishSection);