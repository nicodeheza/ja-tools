import {JsonStorage} from '../../../store/localStorage'
import type {AnalyzeData} from './analyze.types'

export const analyzeStorage = new JsonStorage<AnalyzeData>('_analyzed_text')
