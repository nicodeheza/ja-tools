import {JsonStorage} from '../../../store/localStorage'
import type {CachedEvent} from './TextGenerator.types'

export const GeneratedTextStorage = new JsonStorage<CachedEvent>('_event_cache')
