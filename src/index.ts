import dotenv from 'dotenv'
import express, { Application, RequestHandler } from 'express'
import cors from 'cors'
import symptomsRoutes from './routes/symptomsRoutes'
import authRoutes from './routes/authRoutes'
import historyRoutes from './routes/historyRoutes'
const { initializeDatabase } = require('./models')

dotenv.config()

const app: Application = express()
app.use(cors())
app.use(express.json())

initializeDatabase().catch(console.error)

const homeHandler: RequestHandler = (req, res) => {
  res.send('SympCheck Backend is up!')
}

const apiv1Handler: RequestHandler = (req, res) => {
    res.send('API v1 is Ready!')
  }

app.get('/', homeHandler)
app.get('/api/v1', apiv1Handler)

app.use('/api/v1/symptoms', symptomsRoutes)
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/history', historyRoutes)

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).send('Server Error')
})

if (require.main === module) {
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => console.log(`Server running on ${PORT}`))
}

export { app }