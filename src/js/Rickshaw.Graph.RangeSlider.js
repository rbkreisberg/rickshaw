Rickshaw.namespace('Rickshaw.Graph.RangeSlider');

Rickshaw.Graph.RangeSlider = Rickshaw.Class.create({

	initialize: function(args) {

		var element = this.element = args.element;
		var graph = this.graph = args.graph;

		this.build();

		graph.onUpdate( function() { this.update() }.bind(this) );
	},

	build: function() {

		var element = this.element;
		var graph = this.graph;
		var domain = graph.renderer.domain().x;

		$( function() {
			$(element).slider( {
				range: true,
				min: domain[0],
				max: domain[1],
				values: [ 
					domain[0],
					domain[1]
				],
				slide: function( event, ui ) {

					if (ui.values[0] >= ui.values[1]) { return; }

					graph.window.xMin = ui.values[0];
					graph.window.xMax = ui.values[1];					
					graph.update();

					// if we're at an extreme, stick there
					if (domain[0] == ui.values[0]) {
						graph.window.xMin = undefined;
					}
					if (domain[1] == ui.values[1]) {
						graph.window.xMax = undefined;
					}
				}
			} );
		} );

		element[0].style.width = graph.width + 'px';
	},

	update: function() {

		var element = this.element;
		var graph = this.graph;
		var values = $(element).slider('option', 'values');
		var oldMax = $(element).slider('option', 'max');
		var oldMin = $(element).slider('option', 'min');

		var domain = graph.renderer.domain().x;
		if ( domain[0] === undefined || domain[1] === undefined ) return;

		$(element).slider('option', 'min', domain[0]);
		$(element).slider('option', 'max', domain[1]);

		if (values[0] === oldMin || graph.window.xMin == null) {
			values[0] = domain[0];
		}
		if (values[1] === oldMax || graph.window.xMax == null) {
			values[1] = domain[1];
		}
		$(element).slider('option', 'values', values);
	}
});

