import { describe, expect, it, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { TokenComponent } from './Token.component'

describe('TokenComponent', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders a <br> for a newline token', () => {
    const { container } = render(
      <TokenComponent token={{ isWord: false, original: '\n' }} dict={{}} />
    )
    expect(container.querySelector('br')).not.toBeNull()
  })

  it('renders nothing for BOS and EOS tokens', () => {
    const { container } = render(
      <TokenComponent token={{ isWord: false, original: 'BOS' }} dict={{}} />
    )
    expect(container.textContent).toBe('')
    const eos = render(<TokenComponent token={{ isWord: false, original: 'EOS' }} dict={{}} />)
    expect(eos.container.textContent).toBe('')
  })

  it('renders other non-word tokens as text', () => {
    const { container } = render(
      <TokenComponent token={{ isWord: false, original: '、' }} dict={{}} />
    )
    expect(container.textContent).toBe('、')
  })
})
