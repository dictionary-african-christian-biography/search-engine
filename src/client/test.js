require('./search-lightweight');
require('./search');

// No unit tests for now, this is just a simple test by trial
getLightweightSearchResults('john').then((e) => console.log(e));
