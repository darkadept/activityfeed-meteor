var C = {
	updateTimer: getSetting('public.packages.activityfeed.feedClientUpdateMSEC', Meteor.settings) || 20000,
	feedPostLimit: getSetting('public.packages.activityfeed.feedPostClientLimit', Meteor.settings) || 15
};

// After rendering the feed, set up the timer to refresh it
Template.activityFeed.rendered = function() {
	setInterval(function(){
		// Reactive refresh
		Session.set('activityFeed_feedUpdateTimer', moment().toDate());
	}, C.updateTimer);
};

Template.activityFeed.events = function() {
	return ActivityFeed.find({
		userId: Meteor.userId()
	}, {
		sort: {timestamp: 'desc'},
		limit: C.feedPostLimit
	});
};

Template.activityFeed_event.date = function() {
	var timer = Session.get('activityFeed_feedUpdateTimer');
	return moment(this.timestamp).fromNow();
};
