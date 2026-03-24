import {relations} from 'drizzle-orm'
import {index, int, primaryKey, sqliteTable as table, text} from 'drizzle-orm/sqlite-core'

export const words = table('words', {
	id: int().primaryKey({autoIncrement: true})
})
export const wordsRelations = relations(words, ({many}) => ({
	kanjis: many(kanjis),
	kanas: many(kanas),
	sense: many(sense)
}))

export const kanjis = table(
	'kanjis',
	{
		id: int().primaryKey({autoIncrement: true}),
		common: int({mode: 'boolean'}).notNull(),
		text: text().notNull(),
		wordId: int('word_id').notNull()
	},
	(t) => [index('kanjis_text_idx').on(t.text), index('kanjis_word_id_idx').on(t.wordId)]
)
export const kanjisRelations = relations(kanjis, ({one, many}) => ({
	word: one(words, {
		fields: [kanjis.wordId],
		references: [words.id]
	}),
	kanas: many(kanasToKanjis)
}))

export const kanas = table(
	'kanas',
	{
		id: int().primaryKey({autoIncrement: true}),
		common: int({mode: 'boolean'}).notNull(),
		text: text().notNull(),
		wordId: int('word_id').notNull()
	},
	(t) => [index('kanas_text_idx').on(t.text), index('kanas_word_id_idx').on(t.wordId)]
)
export const kanasRelations = relations(kanas, ({one, many}) => ({
	word: one(words, {
		fields: [kanas.wordId],
		references: [words.id]
	}),
	kanjis: many(kanasToKanjis)
}))

export const kanasToKanjis = table(
	'kanas_kanjis',
	{
		kanaId: int('kana_id')
			.notNull()
			.references(() => kanas.id),
		kanjisId: int('kanji_id')
			.notNull()
			.references(() => kanjis.id)
	},
	(t) => [primaryKey({columns: [t.kanaId, t.kanjisId]})]
)
export const kanasToKanjisRelations = relations(kanasToKanjis, ({one}) => ({
	kana: one(kanas, {
		fields: [kanasToKanjis.kanaId],
		references: [kanas.id]
	}),
	kanji: one(kanjis, {
		fields: [kanasToKanjis.kanjisId],
		references: [kanjis.id]
	})
}))

export const sense = table(
	'sense',
	{
		id: int().primaryKey({autoIncrement: true}),
		wordId: int('word_id').notNull()
	},
	(t) => [index('sense_word_id_idx').on(t.wordId)]
)
export const senseRelations = relations(sense, ({many, one}) => ({
	words: one(words, {
		fields: [sense.wordId],
		references: [words.id]
	}),
	glosses: many(glosses),
	pos: many(senseToPos),
	kanas: many(senseToKana),
	kanjis: many(senseToKanji),
	mecabPos: many(senseToMecabPos)
}))

export const senseToKana = table('sense_kana', {
	senseId: int('sense_id')
		.notNull()
		.references(() => sense.id),
	kanaId: int('kana_id')
		.notNull()
		.references(() => kanas.id)
})
export const senseToKanaRelations = relations(senseToKana, ({one}) => ({
	sense: one(sense, {
		fields: [senseToKana.senseId],
		references: [sense.id]
	}),
	kana: one(kanas, {
		fields: [senseToKana.kanaId],
		references: [kanas.id]
	})
}))

export const senseToKanji = table('sense_kanji', {
	senseId: int('sense_id')
		.notNull()
		.references(() => sense.id),
	kanjiId: int('kanji_id')
		.notNull()
		.references(() => kanjis.id)
})
export const senseToKanjiRelations = relations(senseToKanji, ({one}) => ({
	sense: one(sense, {
		fields: [senseToKanji.senseId],
		references: [sense.id]
	}),
	kanji: one(kanjis, {
		fields: [senseToKanji.kanjiId],
		references: [kanjis.id]
	})
}))

export const glosses = table(
	'glosses',
	{
		id: int().primaryKey({autoIncrement: true}),
		text: text().notNull(),
		senseId: int('sense_id').notNull()
	},
	(t) => [index('glosses_sense_id_idx').on(t.senseId)]
)
export const glossesRelations = relations(glosses, ({one}) => ({
	// Fix: relate glosses to sense by senseId -> sense.id
	sense: one(sense, {
		fields: [glosses.senseId],
		references: [sense.id]
	})
}))

export const tags = table('tags', {
	id: int().primaryKey({autoIncrement: true}),
	abbreviation: text().notNull(),
	text: text().notNull()
})
export const tagsRelations = relations(tags, ({many}) => ({
	senseToPos: many(senseToPos)
}))

export const senseToPos = table(
	'sense_pos',
	{
		senseId: int('sense_id')
			.notNull()
			.references(() => sense.id),
		tagId: int('tag_id')
			.notNull()
			.references(() => tags.id)
	},
	(t) => [primaryKey({columns: [t.senseId, t.tagId]})]
)
export const senseToPosRelations = relations(senseToPos, ({one}) => ({
	sense: one(sense, {
		fields: [senseToPos.senseId],
		references: [sense.id]
	}),
	pos: one(tags, {
		fields: [senseToPos.tagId],
		references: [tags.id]
	})
}))

export const mecabPos = table('mecab_pos', {
	id: int().primaryKey({autoIncrement: true}),
	text: text().notNull()
})
export const mecabPosRelations = relations(mecabPos, ({many}) => ({
	senseToMecabPos: many(senseToMecabPos)
}))

export const senseToMecabPos = table(
	'sense_mecab_pos',
	{
		mecabPosId: int('mecab_pos_id')
			.notNull()
			.references(() => mecabPos.id),
		senseId: int('sense_id')
			.notNull()
			.references(() => sense.id)
	},
	(t) => [
		primaryKey({columns: [t.mecabPosId, t.senseId]}),
		index('sense_mecab_pos_sense_id_idx').on(t.senseId)
	]
)

export const senseToMecabPosRelations = relations(senseToMecabPos, ({one}) => ({
	mecabPos: one(mecabPos, {
		fields: [senseToMecabPos.mecabPosId],
		references: [mecabPos.id]
	}),
	sense: one(sense, {
		fields: [senseToMecabPos.senseId],
		references: [sense.id]
	})
}))
