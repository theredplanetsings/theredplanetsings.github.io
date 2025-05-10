class Scatterplot {
  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      colorScale: _config.colorScale,
      containerWidth: 500,
      containerHeight: 350,
      margin: {top:20, right:20, bottom:50, left:60},
      tooltipPadding: 10
    };
    this.initVis();
  }

  initVis() {
    const vis = this;
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    vis.svg = d3.select(vis.config.parentElement)
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    vis.chart = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    vis.xScale = d3.scaleLinear().range([0, vis.width]);
    vis.yScale = d3.scaleLinear().range([vis.height, 0]);

    vis.xAxisG = vis.chart.append('g')
      .attr('transform', `translate(0,${vis.height})`);
    vis.yAxisG = vis.chart.append('g');

    // shape scale
    vis.symbolScale = d3.scaleOrdinal()
      .domain(['Fiction','Non Fiction'])
      .range([
        d3.symbol().type(d3.symbolCircle)(),
        d3.symbol().type(d3.symbolTriangle)()
      ]);

    // axis titles
    vis.chart.append('text')
      .attr('class','axis-title')
      .attr('x', vis.width/2)
      .attr('y', vis.height + 40)
      .style('text-anchor','middle')
      .text('Price ($)');

    vis.svg.append('text')
      .attr('class','axis-title')
      .attr('transform','rotate(-90)')
      .attr('x', -vis.height/2)
      .attr('y', 15)
      .style('text-anchor','middle')
      .text('User Rating');
  }

  updateVis() {
    const vis = this;
    vis.xScale.domain([0, d3.max(vis.data, d=>d.price)]);
    vis.yScale.domain([3.3, 5.0]);
    vis.renderVis();
  }

  renderVis() {
    const vis = this;

    const symbols = vis.chart.selectAll('.symbol')
      .data(vis.data, d=>d.name);


    symbols.join(
      enter => enter.append('path')
        .attr('class','symbol')
        .attr('d', d => vis.symbolScale(d.genre))
        .attr('transform', d => `translate(${vis.xScale(d.price)},${vis.yScale(d.userRating)})`)
        .attr('fill', d => vis.config.colorScale(d.genre))

        // make focusable & announceable
        .attr('tabindex', 0)
        .attr('role','img')
        .attr('aria-label', d =>
          `${d.name} by ${d.author}, Year ${d.year}, Price $${d.price}, Rating ${d.userRating}`
        )

        // mouse + keyboard handlers
        .on('mouseover', (event, d) => {
          showPointTooltip(event, d);
          speak(event.currentTarget.getAttribute('aria-label'));
        })
        .on('focus', (event) => {
          const d = d3.select(event.currentTarget).datum();
          showPointTooltip(event, d);
          speak(event.currentTarget.getAttribute('aria-label'));
        })
        .on('mouseleave', () => {
          hideTooltip();
        })
        .on('blur', () => {
          hideTooltip();
        })
        .on('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            speak(event.currentTarget.getAttribute('aria-label'));
          }
        }),

      update => update
        .attr('transform', d=>`translate(${vis.xScale(d.price)},${vis.yScale(d.userRating)})`),

      exit => exit.remove()
    );

    vis.xAxisG.call(d3.axisBottom(vis.xScale).ticks(6));
    vis.yAxisG.call(d3.axisLeft(vis.yScale).ticks(6));
  }
}