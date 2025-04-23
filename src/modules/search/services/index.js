/**
 * Export services
 */
const searchService = require('./search.service');
const searchAnalyticsService = require('./search-analytics.service');
const searchHighlightsService = require('./search-highlights.service');
const searchQueryService = require('./search-query.service');
const searchFacetsService = require('./search-facets.service');
const searchConfig = require('./search-config');

module.exports = {
  searchService,
  searchAnalyticsService,
  searchHighlightsService,
  searchQueryService,
  searchFacetsService,
  searchConfig
}; 