/*
	Defines the parent directory in a string.
*/
var	parseduration = helpers.parsetime;
templates = {
	/*
		This checks if the template is saved. If not, it loads it via websockets.
		Then it goes to compileTemplate and returns a div.
	*/
	buildElement: function(config) {
		var template     = config.template,
			parameters   = config.parameters
			callback     = config.callback
		/*
			Check if the template is saved. If yes, compile the file diretly.
		*/
		if (savedtemplates[template] != undefined) {
			var tmpl = templates.compileTemplate(savedtemplates[templates], template);
			templates.checkAndReturn({template: template, params: parameters, tmpl: tmpl});
		}
		else {
			/*
				If the template isn't saved, get it from the server. Emit an request.
			*/
			socket.emit('load-template', {name: template});
			/*
				When the response comes, save it!
			*/
			socket.once('template', function(data) {
				/*
					Save template.
				*/
				var tmpl = templates.compileTemplate(data.template, template);
				/*
					Do a dependency check. What is this?
					The template album, for example, has the template tracklist included.
					We need to load that first before we can compile anything.
				*/
				templates.checkAndReturn({template: template, params: parameters, tmpl: tmpl})
			})
		}
	},
	/*
		This prepares the template for rendering. You can use it multiple times!
	*/
	compileTemplate: function(template, name) {
		savedtemplates[name] = swig.compile(template, {filename: name});
		return savedtemplates[name];
	},
	/*
		Returns a string of HTML. Pass in a template made using compileTemplate()
	*/
	renderTemplate: function(template, parameters) {
		var output = template(parameters);
		return output;
	},
	/*
		F.e. an album template has the tracklist template. This keeps track of all the dependencies
		so they can be checked if needed.
	*/
	dependencies: {
		album: ["tracklist"]
	},
	dependenciesCheck: function(config) {
		/*
			Shorthands for the possible parameters
		*/
		var callback 	 = config.cb,
			name     	 = config.name,
			dependencies = templates.dependencies[name];
		/*
			Check which dependencies must be loaded.
		*/
		var neededdependencies = _.filter(dependencies, function(dep) {
			return savedtemplates[dep] == undefined;
		})
		/*
			Check if any templates must be loaded.
		*/
		if (neededdependencies.length != 0) {
			/*
				Async sockets. Cannot be a $.each loop!
			*/
			function getTemplate() {
				/*
					Get specific dependency from loop.
				*/
				var dependency = dependencies[j];
				/*
					Search for template.
				*/
				socket.emit('load-template', {name: dependency})
				socket.once('template', function(data) {
					templates.compileTemplate(data.template, dependency);
					j++;
					if (j < dependencycount) {
						getTemplate()
					}
					else {
						callback()
					}
				})
			}
			/*
				Loop variables
			*/
			var j 				= 0,
				dependencycount = neededdependencies.length;
			getTemplate()
		}
		else {
			callback()
		}

	},
	checkAndReturn: function(obj) {
		var template     = obj.template,
			parameters   = obj.params,
			tmpl         = obj.tmpl,
			dependencies = templates.dependencies[template]
		templates.dependenciesCheck({
			cb: function() {
				/*
					Add the new templates to the parameters
				*/
				if (dependencies) {
					$.each(dependencies, function(key,templatename) {
						parameters[templatename] = savedtemplates[templatename];
					});
				}
				/*
					Add a function that parses the duration to the template!
				*/
				parameters.parseduration = parseduration;
				/*
					And finally, compile and render the file.
				*/
				var output = templates.renderTemplate(tmpl, parameters);
				callback(output);
			},
			name: template
		})
	}
}
savedtemplates = {}