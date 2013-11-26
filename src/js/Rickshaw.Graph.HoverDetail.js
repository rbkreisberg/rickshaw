Rickshaw.namespace('Rickshaw.Graph.HoverDetail');

Rickshaw.Graph.HoverDetail = Rickshaw.Class.create({

	initialize: function(args) {

		var graph = this.graph = args.graph;

		this.xFormatter = args.xFormatter || function(x) {
			return new Date( x * 1000 ).toUTCString();
		};

		this.yFormatter = args.yFormatter || function(y) {
			return y === null ? y : y.toFixed(2);
		};

		this.clickCallback = d3.functor(args.click || function() {});
		this.activePoint = null;

		var element = this.element = document.createElement('div');
		element.className = 'detail';

		this.visible = true;
		graph.element.appendChild(element);

		this.lastEvent = null;
		this._addListeners();

		this.onShow = args.onShow;
		this.onHide = args.onHide;
		this.onRender = args.onRender;

		this.formatter = args.formatter || this.formatter;

	},

	formatter: function(series, x, y, formattedX, formattedY, d) {
		return series.name + ':&nbsp;' + formattedY;
	},

	update: function(e) {

		e = e || this.lastEvent;
		if (!e) return;
		this.lastEvent = e;

		if (!e.target.nodeName.match(/^(path|svg|rect)$/)) return;

		var graph = this.graph;

		var eventX = e.offsetX || e.layerX;
		var eventY = e.offsetY || e.layerY;

		var scaleX = d3.scale.linear().domain(graph.domain.x).range([0,graph.width]);
		var invertX = d3.scale.linear().domain([0,graph.width]).range(graph.domain.x);
		var domainX = invertX(eventX);

		var scaleY = d3.scale.linear().domain(graph.domain.y).range([graph.height,0]);

		var j = 0;
		var points = [];
		var nearestPoint;

		this.graph.series.active().forEach( function(series) {

			var data = this.graph.stackedData[j++];

			var domainIndexScale = d3.scale.linear()
				.domain([data[0].x, data.slice(-1)[0].x])
				.range([0, data.length - 1]);

			var approximateIndex = Math.round(domainIndexScale(domainX));
			var dataIndex = Math.min(approximateIndex || 0, data.length - 1);

			for (var i = approximateIndex; i < data.length - 1;) {

				if (!data[i] || !data[i + 1]) break;

				if (data[i].x <= domainX && data[i + 1].x > domainX) {
					dataIndex = i;
					break;
				}

				if (data[i + 1].x <= domainX) { i++ } else { i-- }
			}

			if (dataIndex < 0) dataIndex = 0;
			var value = data[dataIndex];

			var distance = Math.sqrt(
				Math.pow(scaleX(value.x) - eventX, 2) +
				Math.pow(scaleY(value.y + value.y0) - eventY, 2)
			);

			var xFormatter = series.xFormatter || this.xFormatter;
			var yFormatter = series.yFormatter || this.yFormatter;

			var point = {
				formattedXValue: xFormatter(value.x),
				formattedYValue: yFormatter(series.scale ? series.scale.invert(value.y) : value.y),
				series: series,
				value: value,
				distance: distance,
				order: j,
				name: series.name
			};

			if (!nearestPoint || distance < nearestPoint.distance) {
				nearestPoint = point;
			}

			points.push(point);

		}, this );

		if (nearestPoint === undefined) return;
		nearestPoint.active = true;

		var dX = scaleX(nearestPoint.value.x);
		var formattedXValue = nearestPoint.formattedXValue;

		if ( dX < 0 || nearestPoint.value.y === null) {
			this.hide();
			return;
		}


		this.element.innerHTML = '';
		this.element.style.left = dX + 'px';

		this.visible && this.render( {
			points: points,
			detail: points, // for backwards compatibility
			mouseX: eventX,
			mouseY: eventY,
			formattedXValue: formattedXValue,
			domainX: dX
		} );
	},

	hide: function() {
		this.visible = false;
		this.activePoint = null;
		this.element.classList.add('inactive');

		if (typeof this.onHide == 'function') {
			this.onHide();
		}
	},

	show: function() {
		this.visible = true;
		this.element.classList.remove('inactive');

		if (typeof this.onShow == 'function') {
			this.onShow();
		}
	},

	clickHandler: function(evt) {
		if (!this.activePoint) return;
		var point = this.activePoint;
		var dot = d3.select(this.element).select('.dot.active').node();
		this.clickCallback(evt, {el: dot, data: point});
	},

	render: function(args) {

		var graph = this.graph;
		var points = args.points;
		var point = points.filter( function(p) { return p.active } ).shift();
		var scaleX = d3.scale.linear().domain(graph.domain.x).range([0,graph.width]);
		var xPos = scaleX(point.value.x);

		this.activePoint = point;

		if ( point.value.y === null ) {
			this.hide();
			return;
		}

		var formattedXValue = point.formattedXValue;
		var formattedYValue = point.formattedYValue;

		this.element.innerHTML = '';
		this.element.style.left = xPos + 'px';

		var xLabel = document.createElement('div');

		xLabel.className = 'x_label';
		xLabel.innerHTML = formattedXValue;
		this.element.appendChild(xLabel);

		var item = document.createElement('div');

		item.className = 'item';

		// invert the scale if this series displays using a scale
		var series = point.series;
		var actualY = series.scale ? series.scale.invert(point.value.y) : point.value.y;

		item.innerHTML = this.formatter(series, point.value.x, actualY, formattedXValue, formattedYValue, point);
		item.style.top = this.graph.y(point.value.y0 + point.value.y) + 'px';

		this.element.appendChild(item);

		var dot = document.createElement('div');

		dot.className = 'dot';
		dot.style.top = item.style.top;
		dot.style.borderColor = series.color;

		this.element.appendChild(dot);

		if (point.active) {
			item.className = 'item active';
			dot.className = 'dot active';
		}

		this.show();

		if (typeof this.onRender == 'function') {
			this.onRender(args);
		}
	},

	_addListeners: function() {

		var svg = this.graph.element.querySelector('svg.graph');
		svg.addEventListener(
			'mousemove',
			function(e) {
				this.visible = true;
				this.update(e);
			}.bind(this),
			false
		);

		svg.addEventListener(
			'click',
			this.clickHandler.bind(this));

		this.graph.onUpdate( function() { this.update() }.bind(this) );

		svg.addEventListener(
			'mouseout',
			function(e) {
				if (e.relatedTarget && !(e.relatedTarget.compareDocumentPosition(svg) & Node.DOCUMENT_POSITION_CONTAINS)) {
					this.hide();
				}
			}.bind(this),
			false
		);
	}
});

