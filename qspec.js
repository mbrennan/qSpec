var forEach = function(items, itemFunction) {
	var itemKey, item;

	for (itemKey in items) {
		item = items[itemKey];
		itemFunction.apply(item, [item]);
	}
};

subject = (function(forEach, externalDefineModule, externalDefineAsyncTest, externalStartTest) {
	var Condition = function(workspace, conditionName, conditionFunction, executeBeforeAll, executeBeforeEach) {
		return {
			defineTest: function() {
				externalDefineAsyncTest('should ' + conditionName, function() {
					setTimeout(function() {
						executeBeforeAll();
						executeBeforeEach();
						conditionFunction.call(workspace);
						externalStartTest();
					}, 500);
				});
			}
		};
	};

	var Context = function(workspace, subjectName, contextName, contextFunction) {
		var conditions = [],
				provideContextFunctions = [],
				beforeAllFunctions = [],
				beforeEachFunctions = [],
				provideContextExecuted = false,
				beforeAllExecuted = false;

		var executeProvideContextFunctions = function() {
			if (provideContextExecuted) {
					return;
			}

			setTimeout(function() {
				forEach(provideContextFunctions, function() {
					this.call(workspace, modifiers);
				});

				provideContextExecuted = true;
			}, 0)
		};

		var executeBeforeAllFunctions = function() {
			if (beforeAllExecuted) {
				return;
			}

			forEach(beforeAllFunctions, function() {
				this.call(workspace, modifiers);
			});

			beforeAllExecuted = true;
		};

		var executeBeforeEachFunctions = function() {
			forEach(beforeEachFunctions, function() {
				this.call(workspace, modifiers);
			});
		};

		var environment = {
			should: function(conditionName, conditionFunction) {
				conditions.push(new Condition(workspace, conditionName, conditionFunction, executeBeforeAllFunctions, executeBeforeEachFunctions));
			}
		};

		var modifiers = {
			provideContext: function(provideContextFunction) {
				provideContextFunctions.push(provideContextFunction);
				return this;
			},
			beforeAll: function(beforeAllFunction) {
				beforeAllFunctions.push(beforeAllFunction);
				return this;
			},
			beforeEach: function(beforeEachFunction) {
				beforeEachFunctions.push(beforeEachFunction);
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
				externalDefineModule(subjectName + ', when ' + contextName, {
					setup: function() {
						executeProvideContextFunctions();
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
})(forEach, module, asyncTest, start);

