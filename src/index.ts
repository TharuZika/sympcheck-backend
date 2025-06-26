// src/index.ts
import express, { Application, RequestHandler } from 'express'
import cors from 'cors'
import symptomsRoutes from './routes/symptomsRoutes'

const app: Application = express()
app.use(cors())
app.use(express.json())

// routes

const homeHandler: RequestHandler = (req, res) => {
  res.send('SympCheck Backend is up!')
}

const apiv1Handler: RequestHandler = (req, res) => {
    res.send('API v1 is Ready!')
  }

app.get('/', homeHandler)
app.get('/api/v1', apiv1Handler)

app.use('/api/v1/symptoms', symptomsRoutes)

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).send('Server Error')
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on ${PORT}`))