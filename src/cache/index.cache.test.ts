import {describe, it, expect, beforeEach} from 'vitest'
import {Cache} from './index.cache.js'

describe('Cache', () => {
  let cache: Cache<string>

  beforeEach(() => {
    cache = new Cache<string>(3)
  })

  describe('add()', () => {
    it('should add a record and make it retrievable', () => {
      cache.add('a', 'value-a')
      expect(cache.get('a')).toBe('value-a')
    })

    it('should add multiple records', () => {
      cache.add('a', 'value-a')
      cache.add('b', 'value-b')
      cache.add('c', 'value-c')
      expect(cache.get('a')).toBe('value-a')
      expect(cache.get('b')).toBe('value-b')
      expect(cache.get('c')).toBe('value-c')
    })

    it('should evict the least recently used record when exceeding maxSize', () => {
      cache.add('a', 'value-a')
      cache.add('b', 'value-b')
      cache.add('c', 'value-c')
      cache.add('d', 'value-d') // 'a' is LRU — should be evicted
      expect(cache.get('a')).toBeUndefined()
      expect(cache.get('b')).toBe('value-b')
      expect(cache.get('c')).toBe('value-c')
      expect(cache.get('d')).toBe('value-d')
    })

    it('should evict the correct LRU record after access reorders the list', () => {
      cache.add('a', 'value-a')
      cache.add('b', 'value-b')
      cache.add('c', 'value-c')
      cache.get('a') // 'a' moves to head; 'b' becomes LRU
      cache.add('d', 'value-d') // 'b' should be evicted
      expect(cache.get('b')).toBeUndefined()
      expect(cache.get('a')).toBe('value-a')
      expect(cache.get('c')).toBe('value-c')
      expect(cache.get('d')).toBe('value-d')
    })

    it('should upsert: update value and move to head when key already exists', () => {
      cache.add('a', 'value-a')
      cache.add('b', 'value-b')
      cache.add('c', 'value-c')
      cache.add('a', 'value-a-updated') // 'a' is now head; 'b' becomes LRU
      expect(cache.get('a')).toBe('value-a-updated')
      cache.add('d', 'value-d') // 'b' should be evicted, not 'a'
      expect(cache.get('b')).toBeUndefined()
      expect(cache.get('a')).toBe('value-a-updated')
    })

    it('should not grow beyond maxSize', () => {
      cache.add('a', '1')
      cache.add('b', '2')
      cache.add('c', '3')
      cache.add('d', '4')
      cache.add('e', '5')
      // only the 3 most recently added should remain
      expect(cache.get('a')).toBeUndefined()
      expect(cache.get('b')).toBeUndefined()
      expect(cache.get('c')).toBe('3')
      expect(cache.get('d')).toBe('4')
      expect(cache.get('e')).toBe('5')
    })
  })

  describe('get()', () => {
    it('should return undefined for a missing key', () => {
      expect(cache.get('missing')).toBeUndefined()
    })

    it('should return the correct value for an existing key', () => {
      cache.add('a', 'value-a')
      expect(cache.get('a')).toBe('value-a')
    })

    it('should move the accessed record to the head, protecting it from eviction', () => {
      cache.add('a', 'value-a')
      cache.add('b', 'value-b')
      cache.add('c', 'value-c')
      cache.get('a') // 'a' moves to head; 'b' is now LRU
      cache.add('d', 'value-d') // should evict 'b'
      expect(cache.get('b')).toBeUndefined()
      expect(cache.get('a')).toBe('value-a')
    })
  })

  describe('remove()', () => {
    it('should remove an existing record', () => {
      cache.add('a', 'value-a')
      cache.remove('a')
      expect(cache.get('a')).toBeUndefined()
    })

    it('should be a no-op for a non-existent key', () => {
      expect(() => cache.remove('missing')).not.toThrow()
    })

    it('should allow adding a new record after removing one (size tracking)', () => {
      cache.add('a', 'value-a')
      cache.add('b', 'value-b')
      cache.add('c', 'value-c')
      cache.remove('a')
      cache.add('d', 'value-d') // should NOT evict anything since size is now 2
      expect(cache.get('b')).toBe('value-b')
      expect(cache.get('c')).toBe('value-c')
      expect(cache.get('d')).toBe('value-d')
    })

    it('should correctly remove the head node', () => {
      cache.add('a', 'value-a')
      cache.add('b', 'value-b')
      cache.remove('b') // 'b' is head
      expect(cache.get('b')).toBeUndefined()
      expect(cache.get('a')).toBe('value-a')
    })

    it('should correctly remove the tail node', () => {
      cache.add('a', 'value-a')
      cache.add('b', 'value-b')
      cache.remove('a') // 'a' is tail
      expect(cache.get('a')).toBeUndefined()
      expect(cache.get('b')).toBe('value-b')
    })

    it('should correctly remove a middle node', () => {
      cache.add('a', 'value-a')
      cache.add('b', 'value-b')
      cache.add('c', 'value-c')
      cache.remove('b') // 'b' is in the middle
      expect(cache.get('b')).toBeUndefined()
      expect(cache.get('a')).toBe('value-a')
      expect(cache.get('c')).toBe('value-c')
    })
  })

  describe('clear()', () => {
    it('should remove all records', () => {
      cache.add('a', 'value-a')
      cache.add('b', 'value-b')
      cache.clear()
      expect(cache.get('a')).toBeUndefined()
      expect(cache.get('b')).toBeUndefined()
    })

    it('should allow adding records after clearing', () => {
      cache.add('a', 'value-a')
      cache.add('b', 'value-b')
      cache.add('c', 'value-c')
      cache.clear()
      cache.add('d', 'value-d')
      cache.add('e', 'value-e')
      expect(cache.get('d')).toBe('value-d')
      expect(cache.get('e')).toBe('value-e')
    })

    it('should reset capacity so maxSize is respected again after clear', () => {
      cache.add('a', 'value-a')
      cache.add('b', 'value-b')
      cache.add('c', 'value-c')
      cache.clear()
      cache.add('x', 'value-x')
      cache.add('y', 'value-y')
      cache.add('z', 'value-z')
      cache.add('w', 'value-w') // 'x' should be evicted
      expect(cache.get('x')).toBeUndefined()
      expect(cache.get('y')).toBe('value-y')
      expect(cache.get('z')).toBe('value-z')
      expect(cache.get('w')).toBe('value-w')
    })
  })

  describe('generics', () => {
    it('should work with number values', () => {
      const numCache = new Cache<number>(2)
      numCache.add('count', 42)
      expect(numCache.get('count')).toBe(42)
    })

    it('should work with object values', () => {
      const objCache = new Cache<{name: string}>(2)
      objCache.add('user', {name: 'Alice'})
      expect(objCache.get('user')).toEqual({name: 'Alice'})
    })
  })
})
