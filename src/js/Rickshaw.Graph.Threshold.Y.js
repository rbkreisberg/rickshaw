
Rickshaw.namespace('Rickshaw.Graph.Threshold.Y');

Rickshaw.Graph.Threshold.Y = function(args) {

  var self = this;

  this.initialize = function(args) {

    var graph = this.graph = args.graph;
    this.vis = this.graph.vis;
    this.lower_threshold = args.lower_threshold  || graph.y.domain()[0] - graph.y.domain()[0];
    this.upper_threshold = args.upper_threshold || graph.y.domain()[1] +  graph.y.domain()[1] ;

    this.graph.onUpdate( function() { self.render() } );
  };

  this.render = function() {
    var graph = this.graph;
    var vis = this.vis;

    vis.selectAll('.threshold').remove();

      this.upper = vis.insert('rect',":first-child")
      .attr('class','threshold upper')
      .style('stroke','#d22')
      .style('stroke-opacity',0.8)
      .style('fill','#d22')
      .style('fill-opacity',0.3)
      .attr('x',0)
      .attr('width',graph.width)
      .attr('y',0)
      .attr('height',d3.max([graph.y(self.upper_threshold),0]));

      this.lower = vis.insert('rect',":first-child")
      .attr('class','threshold lower')
      .style('stroke','#d22')
      .style('stroke-opacity',0.8)
      .style('fill','#d22')
      .style('fill-opacity',0.3)
      .attr('x',0)
      .attr('width',graph.width)
      .attr('y',graph.y(self.lower_threshold))
      .attr('height',d3.max([graph.y(self.lower_threshold),0]));

  };

  this.initialize(args);
};

