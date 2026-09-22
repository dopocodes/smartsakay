const weatherService = require('../services/weatherService');
const apiResponse = require('../utils/apiResponse');

const getCurrentWeather = async (req, res, next) => {
  try {
    const weather = await weatherService.fetchWeather();
    return apiResponse.success(res, {
      current: weather.current, alerts: weather.alerts, travelAdvisory: weather.travelAdvisory,
    }, 'Current weather retrieved');
  } catch (error) { next(error); }
};

const getForecast = async (req, res, next) => {
  try {
    const weather = await weatherService.fetchWeather();
    return apiResponse.success(res, {
      forecast: weather.forecast, alerts: weather.alerts, travelAdvisory: weather.travelAdvisory,
    }, 'Forecast retrieved');
  } catch (error) { next(error); }
};

module.exports = { getCurrentWeather, getForecast };
