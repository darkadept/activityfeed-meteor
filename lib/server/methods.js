var C = {
	feedQueueMax: getSetting('public.packages.activityfeed.feedQueueMax') || 50
};

Meteor.methods({
	addActivity: addActivity
});

/*
This stores the entire verb collection in memory and keeps
it synced with all database changes.
This should help alleviate pressure on the database.
For scalability in the future, this could be moved to Redis.
 */
var verbMemory = {};
ActivityVerbs.find().observe({
	added: function(doc) {
		verbMemory[doc.name] = doc;
		verbMemory[doc.name]._summaryTemplateFunction = _.template(verbMemory[doc.name].summaryTemplate);
		verbMemory[doc.name]._extraTemplateFunction = _.template(verbMemory[doc.name].extraTemplate);
		verbMemory[doc.name]._determineUsersFunction = _.template(verbMemory[doc.name].determineUsers);
	},
	changed: function(newDoc, oldDoc) {
		if (newDoc.name != oldDoc.name) {
			delete verbMemory[oldDoc.name];
		}
		verbMemory[newDoc.name] = newDoc;
		verbMemory[newDoc.name]._summaryTemplateFunction = _.template(verbMemory[newDoc.name].summaryTemplate);
		verbMemory[newDoc.name]._extraTemplateFunction = _.template(verbMemory[newDoc.name].extraTemplate);
		verbMemory[newDoc.name]._determineUsersFunction = _.template(verbMemory[newDoc.name].determineUsers);
	},
	removed: function(oldDoc) {
		delete verbMemory[oldDoc.name];
	}
});

// The feed generation queue.
var feedQueue = new PowerQueue({
	maxProcessing: C.feedQueueMax,
	reactive: false
});

// Method to add an activity
// Subject is an object specifying id and collection
// Verb is the name of the verb
// Object is an optional object specifying id and collection
function addActivity(subject, verb, object) {
	check(verb, String);
	check(subject, Match.ObjectIncluding({
		id: String,
		collection: String
	}));
	check(object, Match.Optional(Match.ObjectIncluding({
		id: String,
		collection: String
	})));

	//TODO Plug some sort of authentication here

	// Verb should be in memory store
	if (!verbMemory[verb]) {
		throw new Meteor.Error(404, "Activity verb not found");
	}

	// Add the activity to the store
	ActivityItems.insert({
		subject: subject,
		object: object,
		verbId: verbMemory[verb]._id
	}, function(err, id) {
		if (err) throw new Meteor.Error(500, "Error adding activity item");

		// Process the activity on the queue
		feedQueue.add(addActivityItem(subject, object, verbMemory[verb], id));
	});

}

// Returns a function that processes an activity item
function addActivityItem(subject, object, verb, id) {
	return function(done) {

		// Get the collections for subject and (optionally) the object
		var subjectCollection = getCollection(subject.collection);
		var objectCollection = null;
		if (object)	objectCollection = getCollection(object.collection);
		if (!subjectCollection || (object && !objectCollection)) {
			console.log('Collections cannot be found.');
			done(true);
			return;
		}

		// Fetch the subject and object documents
		var subjectDoc = subjectCollection.findOne(subject.id);
		var objectDoc = (object) ? objectCollection.findOne(object.id) : null;

		// Build the parameter object
		var parameterObject = {
			subject: subjectDoc,
			object: objectDoc
		};

		// Pass t he parameter object through the summary, extra, and determineUsers template functions
		var summary = verb._summaryTemplateFunction(parameterObject);
		var extra = verb._extraTemplateFunction(parameterObject);
		var users = JSON.parse(verb._determineUsersFunction(parameterObject));

		// Determine users function should return a string id of a user
		// or an array of string ids.
		if (_(users).isString()) {
			users = [ users ];
		} else if (!_(users).isArray()) {
			done(true);
			return;
		}

		// For each user, add the activity into the users feed
		_(users).each(function(userId){
			ActivityFeed.insert({
				userId: userId,
				icon: verb.icon,
				summary: summary,
				extra: extra,
				timestamp: new Date(),
				verbId: verb._id,
				activityItemId: id
			});
		});

		done();
	}
}

// Returns a collection by name. Name is variable name, not passed string.
function getCollection(s) {
	if (s === 'Meteor.users') return Meteor.users;
	var globals = Function('return this')();
	for (var globalObject in globals) {
		if (this[globalObject] instanceof Meteor.Collection) {
			if (globalObject === s) {
				return (globals[globalObject]);
			}
		}
	}
	return undefined; // if none of the collections match
}
