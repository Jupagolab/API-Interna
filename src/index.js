import app from './config/server.js'
import './config/database.js';

const PORT = app.get("port");

app.listen(PORT, () => {
  console.log(`Server on port: ${PORT}`)
})