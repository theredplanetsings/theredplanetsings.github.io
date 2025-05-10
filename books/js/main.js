
let voiceEnabled = false;

function showTooltip(event, d) {
  const tt = d3.select('#tooltip');
  tt
    .html(`
      <div><strong>${d.name}</strong></div>
      <div>Author: ${d.author}</div>
      <div>Year: ${d.year}</div>
      <div>Price: $${d.price.toFixed(2)}</div>
      <div>Rating: ${d.userRating.toFixed(1)}</div>
    `)
    .style('left',  (event.pageX + 10) + 'px')
    .style('top',   (event.pageY + 10) + 'px')
    .style('display','block');
}

function hideTooltip() {
  d3.select('#tooltip')
    .style('display','none');
}

// alias for scatterplot
const showPointTooltip = showTooltip;
// track filters
let yearFilter = new Set();
let rawData, filteredByYear;

let barchart, scatterplot;

// at top of main.js
let genreFilter = new Set(['Fiction','Non Fiction']);
const dispatcher = d3.dispatch('toggleGenre');

// wire the toggle event
dispatcher.on('toggleGenre', genre => {
  if (genreFilter.has(genre)) genreFilter.delete(genre);
  else                        genreFilter.add(genre);
  render();
});

d3.csv('data/book_data.csv', d => ({
  name: d.Name,
  author: d.Author,
  userRating: +d['User Rating'],
  reviews: +d.Reviews,
  price: +d.Price,
  year: +d.Year,
  genre: d.Genre  
}))
.then(data => {
  rawData = data;

d3.select('#select-all')
  .on('click', () => {
    d3.selectAll('#year-selection input')
      .property('checked', true);
    updateByYear();
  });

d3.select('#clear-all')
  .on('click', () => {
    d3.selectAll('#year-selection input')
      .property('checked', false);
    updateByYear();
  });


d3.select('#voice-toggle')
  .on('click', () => {
    voiceEnabled = !voiceEnabled;
    d3.select('#voice-toggle')
      .text(voiceEnabled ? 'Disable Voice Over' : 'Enable Voice Over');
  });

  // 1) build year checkboxes
  const years = Array.from(new Set(data.map(d => d.year))).sort();
  const yearSel = d3.select('#year-selection');
  years.forEach(y => {
    yearSel.append('label')
      .attr('class','checkbox')
      .html(`<input type="checkbox" value="${y}" checked> ${y}`)
      .on('change', updateByYear);
    yearFilter.add(y);
  });

  // 2) instantiate charts
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
  });


  // 1) start by showing ALL genres
  genreFilter = new Set(['Fiction','Non Fiction']);
  // 2) start by having every year checked
  yearFilter = new Set(years);
  
  // first draw
  updateByYear();
})
.catch(console.error);

function updateByYear(){
  // update yearFilter
  const boxes = d3.selectAll('#year-selection input').nodes();
  yearFilter = new Set(boxes.filter(cb => cb.checked).map(cb => +cb.value));
  render();
}

function render(){
  // filter rawData by year
  filteredByYear = rawData.filter(d => yearFilter.has(d.year));

  // render barchart (counts per genre in filteredByYear)
  barchart.data = filteredByYear;
  barchart.updateVis();


  // 3) scatter: treat genreFilter as the list of *hidden* genres
  const scatterData = filteredByYear.filter(d => genreFilter.has(d.genre));

  scatterplot.data = scatterData;
  scatterplot.updateVis();
}

function speak(text) {
  // 1) if voice is off or browser doesn't support it, do nothing
  if (!voiceEnabled || !window.speechSynthesis) return;

  // 2) otherwise cancel any in-flight speech and speak
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  u.pitch = 1;
  window.speechSynthesis.speak(u);
}


