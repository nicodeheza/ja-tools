import {Router} from 'express'
import {analyzeTextHandler, analyzeBulkHandler} from './handlers.analyzer.js'

const router = Router()

router.post('/', analyzeTextHandler)
router.post('/bulk', analyzeBulkHandler)

export default router
