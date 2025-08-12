import app from './config/server.js'

const PORT = app.get("port");

app.listen(PORT, () => {
  console.log(`Server on port: ${PORT}`)
})