// Global objects go here (outside of any functions)
let data, scatterplot, barchart;
// initialises dispatcher
const dispatcher = d3.dispatch('filterCategories');
/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv('data/vancouver_trails.csv')
  .then(_data => {
    data = _data;
    // data preprocessing
    data.forEach(d => {
      d.distance = +d.distance;
      d.time = +d.time;
    });
    // logs the processed data to the console
    console.log(data);
    // initialises color scale
    const colorScale = d3.scaleOrdinal()
      .domain(['Easy', 'Intermediate', 'Difficult'])
      .range(['#A8E6A3', '#4CAF50', '#2E7D32']);
    // initialises scatterplot
    scatterplot = new Scatterplot({
      parentElement: '#scatterplot',
      colorScale: colorScale
    }, data);
    scatterplot.updateVis();
    // initialises barchart and passes dispatcher
    barchart = new Barchart({
      parentElement: '#barchart',
      colorScale: colorScale
    }, dispatcher, data);
    barchart.updateVis();
  })
  .catch(error => console.error(error));

// orchestrates the events by utilising the dispatcher
dispatcher.on('filterCategories', selectedCategories => {
  if (selectedCategories.length === 0) {
    scatterplot.data = data;
  } else {
    scatterplot.data = data.filter(d => selectedCategories.includes(d.difficulty));
  }
  scatterplot.updateVis();
});
/**
 * Use bar chart as filter and update scatter plot accordingly
function filterData() {
    if (difficultyFilter.length === 0) {
      scatterplot.data = data;
    } else {
      scatterplot.data = data.filter(d => difficultyFilter.includes(d.difficulty));
    }
    scatterplot.updateVis();
  }*/