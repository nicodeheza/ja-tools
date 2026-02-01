import type {FuriganaValues} from '../types/Settings.types'
import {JsonStorage} from './localStorage'

type SavedSettings = Partial<{
	furigana: FuriganaValues
}>

const SettingsStorage = new JsonStorage<SavedSettings>('_settings')

export function saveSettings(update: SavedSettings) {
	const settings: SavedSettings = SettingsStorage.getData() ?? {}

	const newSettings = {
		...settings,
		...update
	}

	SettingsStorage.saveData(newSettings)
}

export function getFurigana(): FuriganaValues {
	const settings = SettingsStorage.getData()

	return settings?.furigana || 'enable'
}
