Meteor.publish('activityFeed', function(){
	return ActivityFeed.find({
		userId: Meteor.userId()
	}, {
		sort: {timestamp: 'desc'},
		limit: 20
	});
});
