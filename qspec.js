var forEach = function(items, itemFunction) {
	var itemKey, item;

	for (itemKey in items) {
		item = items[itemKey];
		itemFunction.apply(item, [item]);
	}
};

subject = (function(forEach) {
	var Condition = function(workspace, conditionName, conditionFunction) {
		var testTimeout = 5000;
		var expectAssertions;

		var modifiers = {
			expect: function(numberOfAssertions) {
				expectAssertions = numberOfAssertions;
				return this;
			},
			timeout: function(newTimeout) {
				testTimeout = newTimeout;
				return this;
			}
		};

		return {
			defineTest: function() {
				test('should ' + conditionName, function() {
					stop(testTimeout);
					if (expectAssertions) {
						expect(expectAssertions);
					}

					conditionFunction.call(workspace);
				});
			},
			modifiers: modifiers
		};
	};

	var Context = function(workspace, subjectName, contextName, contextFunction) {
		var conditions = [],
				setupFunctions = [];

		var executeSetupFunctions = function() {
			forEach(setupFunctions, function() {
				this.call(workspace, modifiers);
			});
		};

		var environment = {
			should: function(conditionName, conditionFunction) {
				var condition = new Condition(workspace, conditionName, conditionFunction);
				conditions.push(condition);

				return condition.modifiers;
			}
		};

		var modifiers = {
			setup: function(setupDetails) {
				var setupFunction;
				if (typeof setupDetails !== 'function') {
					setupFunction = setupDetails.setup;
				} else {
					setupFunction = setupDetails;
				}

				setupFunctions.push(setupFunction);
				return this;
			}
		};

		contextFunction.call(workspace, environment);

		return {
			modifiers: modifiers,
			defineTests: function() {
				forEach(conditions, function() {
					this.defineTest();
				});
			},
			defineModule: function() {
				module(subjectName + ', when ' + contextName, {
					setup: function() {
						executeSetupFunctions();
					}
				});

				this.defineTests();
			}
		};
	};

	var Subject = function(subjectName, subjectFunction) {
		var workspace = {},
				contexts = [];

		var environment = {
			when: function(contextName, contextFunction) {
				var context = new Context(workspace, subjectName, contextName, contextFunction);
				contexts.push(context);

				return context.modifiers;
			}
		};

		subjectFunction.call(workspace, environment);
		
		return {
			defineModules: function() {
				forEach(contexts, function() {
					this.defineModule();
				});
			}
		};
	};

	return function(subjectName, subjectFunction) {
		var subject = new Subject(subjectName, subjectFunction);
		subject.defineModules();
	};
})(jQuery ? $.each : forEach);

