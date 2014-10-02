ActivityVerbs = new Meteor.Collection('activityFeed_verbs');
ActivityItems = new Meteor.Collection('activityFeed_items');
ActivityFeed = new Meteor.Collection('activityFeed_feedItems');

// Library function to assist in getting a variable safely.
getSetting = function(str) {
	var seg = str.split('.');
	var O = Meteor.settings;
	while(O && seg.length) O = O[seg.shift()];
	return O;
};
