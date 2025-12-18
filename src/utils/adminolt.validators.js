// src/utils/adminolt.validators.js
export const validateStartMonitoringRequest = (data) => {
  const errors = [];

  if (data.oltId && typeof data.oltId !== 'string') {
    errors.push('oltId debe ser un string si se proporciona');
  }

  if (data.interval && (typeof data.interval !== 'number' || data.interval < 10000)) {
    errors.push('interval debe ser un número mayor a 10000 ms');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};