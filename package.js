Package.describe({
	summary: "Activity Feed",
	version: "0.1.0"
});

Package.on_use(function (api) {
	var clientDepends = [
		'less',
		'semantic-ui-less',
		'underscore',
		'templating',
		'bower'
	];
	api.use(clientDepends, 'client');

	var serverDepends = [
		'accounts-base',
		'underscore',
		'reactive-property',
		'reactive-list',
		'micro-queue',
		'power-queue'
	];
	api.use(serverDepends, 'server');

	api.add_files('smart.json','client');

	var clientServer = [
		'lib/activityfeed.js'
	];
	api.add_files(clientServer, ['client','server']);

	var client = [
		'lib/client/activityfeed.html',
		'lib/client/activityfeed.js'
	];
	api.add_files(client, 'client');

	var server = [
		'lib/server/collections.js',
		'lib/server/methods.js'
	];
	api.add_files(server, 'server');

	api.export('ActivityFeed');

});
