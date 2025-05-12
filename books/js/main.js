// tooltips
function showTooltip(event, d) {
  d3.select('#tooltip')
    .html(`
      <div><strong>${d.name}</strong></div>
      <div>Author: ${d.author}</div>
      <div>Year: ${d.year}</div>
      <div>Price: $${d.price.toFixed(2)}</div>
      <div>Rating: ${d.userRating.toFixed(1)}</div>
    `)
    .style('left', (event.pageX + 10) + 'px')
    .style('top',  (event.pageY + 10) + 'px')
    .style('display','block');
}

const showPointTooltip = showTooltip;  

function showBarTooltip(event, d) {
  d3.select('#tooltip')
    .html(`
      <div><strong>${d.genre}</strong></div>
      <div>Count: ${d.count}</div>
    `)
    .style('left', (event.pageX + 10) + 'px')
    .style('top',  (event.pageY + 10) + 'px')
    .style('display','block');
}

function hideTooltip() {
  d3.select('#tooltip').style('display','none');
}

// State
let yearFilter    = new Set(),
    rawData, filteredByYear,
    barchart, scatterplot,
    genreFilter   = new Set(['Fiction','Non Fiction']);

const dispatcher = d3.dispatch('toggleGenre');
dispatcher.on('toggleGenre', genre => {
  if (genreFilter.has(genre)) genreFilter.delete(genre);
  else                        genreFilter.add(genre);
  render();
});

// Load and preprocess
d3.csv('data/book_data.csv', d => ({
  name:       d.Name,
  author:     d.Author,
  userRating: +d['User Rating'],
  reviews:    +d.Reviews,
  price:      +d.Price,
  year:       +d.Year,
  genre:      d.Genre  
}))
.then(data => {
  rawData = data;

  // year‐filter controls
  d3.select('#select-all').on('click', () => {
    d3.selectAll('#year-selection input').property('checked', true);
    updateByYear();
  });
  d3.select('#clear-all').on('click', () => {
    d3.selectAll('#year-selection input').property('checked', false);
    updateByYear();
  });

  const years = Array.from(new Set(data.map(d => d.year))).sort();
  const yearSel = d3.select('#year-selection');
  years.forEach(y => {
    yearSel.append('label')
      .attr('class','checkbox')
      .html(`<input type="checkbox" value="${y}" checked> ${y}`)
      .on('change', updateByYear);
    yearFilter.add(y);
  });

  // instantiate charts
  const colorScale = d3.scaleOrdinal()
    .domain(['Fiction','Non Fiction'])
    .range(['#74c476','#c7e9c0']);

  barchart = new Barchart({
    parentElement: '#barchart',
    colorScale,
    dispatcher
  });

  scatterplot = new Scatterplot({
    parentElement: '#scatterplot',
    colorScale
  }, rawData);

  // initial draw
  yearFilter  = new Set(years);
  genreFilter = new Set(['Fiction','Non Fiction']);
  updateByYear();

  // responsive redraw
  let firstLoad = true;
  d3.select(window).on('resize', () => {
    if (firstLoad) firstLoad = false;
    else {
      barchart.updateVis();
      scatterplot.updateVis();
    }
  });
})
.catch(console.error);

function updateByYear() {
  const boxes = d3.selectAll('#year-selection input').nodes();
  yearFilter = new Set(boxes.filter(cb => cb.checked).map(cb => +cb.value));
  render();
}

function render() {
  filteredByYear = rawData.filter(d => yearFilter.has(d.year));

  barchart.data = filteredByYear;
  barchart.updateVis();

  const scatterData = filteredByYear.filter(d => genreFilter.has(d.genre));
  scatterplot.data = scatterData;
  scatterplot.updateVis();
}
