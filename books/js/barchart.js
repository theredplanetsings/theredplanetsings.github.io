class Barchart {
  constructor(_config) {
    this.config = {
      parentElement:   _config.parentElement,
      colorScale:      _config.colorScale,
      dispatcher:      _config.dispatcher,
      containerWidth:  400,
      containerHeight: 300,
      margin: { top:30, right:20, bottom:40, left:40 },
      tooltipPadding:  _config.tooltipPadding || 10
    };
    this.initVis();
  }

  initVis() {
    const vis = this;
    vis.width  = vis.config.containerWidth  - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top  - vis.config.margin.bottom;

    vis.svg = d3.select(vis.config.parentElement)
      .attr('width',  vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    vis.chart = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    vis.xScale = d3.scaleBand()
      .domain(['Fiction','Non Fiction'])
      .range([0, vis.width])
      .padding(0.3);

    vis.yScale = d3.scaleLinear().range([vis.height,0]);

    vis.xAxisG = vis.chart.append('g')
      .attr('transform', `translate(0,${vis.height})`);
    vis.yAxisG = vis.chart.append('g');

    vis.chart.append('text')
      .attr('class','axis-title')
      .attr('x', vis.width/2)
      .attr('y', vis.height + 30)
      .style('text-anchor','middle')
      .text('Genre');

    vis.svg.append('text')
      .attr('class','axis-title')
      .attr('transform','rotate(-90)')
      .attr('x', -vis.height/2)
      .attr('y', 15)
      .style('text-anchor','middle')
      .text('Count');
  }

  updateVis() {
    const vis = this;
    const counts = Array.from(
      d3.rollup(vis.data, v=>v.length, d=>d.genre),
      ([genre, count]) => ({ genre, count })
    );
    vis.yScale.domain([0, d3.max(counts, d=>d.count)]);
    this.renderVis(counts);
  }

  renderVis(counts) {
    const vis = this;

    const bars = vis.chart.selectAll('.bar')
      .data(counts, d => d.genre);

    bars.join(
      enter => enter.append('rect')
        .attr('class','bar')
        .attr('x',      d => vis.xScale(d.genre))
        .attr('width',  vis.xScale.bandwidth())
        .attr('y',      vis.height)
        .attr('height', 0)
        .attr('fill',   d => vis.config.colorScale(d.genre))

        .attr('tabindex',   0)
        .attr('role',       'button')
        .attr('aria-label', d => `${d.genre}: ${d.count} books`)

        .on('click',    (e,d) => vis.config.dispatcher.call('toggleGenre', null, d.genre))
        .on('mouseover',(event,d) => showBarTooltip(event, d))
        .on('focus',    (event,d) => showBarTooltip(event, d))
        .on('mouseleave', hideTooltip)
        .on('blur',       hideTooltip)

        .call(enter => enter.transition()
          .attr('y',      d => vis.yScale(d.count))
          .attr('height', d => vis.height - vis.yScale(d.count))
        ),

      update => update.call(update => update.transition()
        .attr('y',      d => vis.yScale(d.count))
        .attr('height', d => vis.height - vis.yScale(d.count))
      ),

      exit => exit.remove()
    );

    vis.chart.selectAll('.bar')
      .classed('active', d => genreFilter.has(d.genre));

    vis.xAxisG.call(d3.axisBottom(vis.xScale));
    vis.yAxisG.call(d3.axisLeft(vis.yScale).ticks(5));
  }
}
