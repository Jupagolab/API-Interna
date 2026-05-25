export const errorHandler = (err, req, res, next) => {
  console.error('[GlobalError]', err.message || err);

  let statusCode = err.status || err.statusCode || 500;
  let errorMessage = 'Error interno del servidor';
  const isProduction = process.env.NODE_ENV === 'production';

  // Si el error viene de Axios (API externa)
  if (err.response) {
    statusCode = err.response.status || statusCode;
    // Intentamos extraer el mensaje de error de la API externa
    const extError = err.response.data?.error || err.response.data;
    errorMessage = typeof extError === 'string' ? extError : JSON.stringify(extError) || 'Error externo';
  } else if (statusCode < 500) {
    // Errores del cliente (ej. 400 Bad Request, 404 Not Found)
    errorMessage = err.message;
  } else if (!isProduction) {
    // En desarrollo, mostramos el mensaje original del error 500
    errorMessage = err.message || 'Error interno del servidor';
  }

  // Responder con el formato estándar
  res.status(statusCode).json({
    success: false,
    error: errorMessage
  });
};
