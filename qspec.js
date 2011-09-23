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
					executeBeforeAll();
					executeBeforeEach();
					conditionFunction.call(workspace);
				});
			}
		};
	};

	var Context = function(workspace, subjectName, contextName, contextFunction) {
		var conditions = [],
				setupFunctions = [],
				beforeAllFunctions = [],
				beforeEachFunctions = [],
				beforeAllFunctionsExecuted = false;

		var executeSetupFunctions = function() {
			forEach(setupFunctions, function() {
				this.call(workspace, modifiers);
			});
		};

		var executeBeforeAllFunctions = function() {
			if (beforeAllFunctionsExecuted) {
				return;
			}

			forEach(beforeAllFunctions, function() {
				this.call(workspace, modifiers);
			});

			beforeAllFunctionsExecuted = true;
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
			setup: function(setupFunction) {
				setupFunctions.push(setupFunction);
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
})(forEach, module, asyncTest, start);

