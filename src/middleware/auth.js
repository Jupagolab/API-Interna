import { configDotenv } from 'dotenv';
configDotenv({ path: '.env' });

const VALID_TOKEN = process.env.API_CLIENT_SECRET;

export const verifyClientToken = (req, res, next) => {
  // 1. Obtener el header "Authorization"
  const authHeader = req.headers['authorization'];

  // 2. Verificar si existe el header
  if (!authHeader) {
    return res.status(401).json({
      error: 'Acceso Denegado',
      message: 'No se proporcionó token de autorización'
    });
  }

  // 3. El formato estándar es "Bearer <token>", así que separamos el string
  const token = authHeader.split(' ')[1]; // Toma la segunda parte después del espacio

  if (!token) {
    return res.status(401).json({
      error: 'Formato inválido',
      message: 'El formato debe ser: Bearer <token>'
    });
  }

  // 4. Comparar el token recibido con el secreto en tu .env
  if (token !== VALID_TOKEN) {
    return res.status(403).json({
      error: 'Prohibido',
      message: 'Token inválido o incorrecto'
    });
  }

  // 5. Si todo está bien, permitimos pasar a la siguiente función (el controlador)
  next();
};