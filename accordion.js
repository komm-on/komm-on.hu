const sequentialIdGenerator = function* (prefix) {
  for (let i = 0; true; i++) {
    yield `${prefix}-${i}`
  }
}

const accordionIdGenerator = sequentialIdGenerator('accordion')

const groupTokens = (tokens) => {
  const result = []

  let isHead = false
  tokens.forEach((t) => {
    if (t.type === 'heading_open' && t.tag === 'h1') {
      isHead = true
      result.push({ headTokens: [], bodyTokens: [] })
    } else if (t.type === 'heading_close' && t.tag === 'h1') {
      isHead = false
    } else {
      if (isHead) {
        result.at(-1)?.headTokens?.push(t)
      } else {
        result.at(-1)?.bodyTokens?.push(t)
      }
    }
  })

  return result
}

const createAccordionHead = (state, accordionId, itemId, tokens) => {
  Object.assign(state.push('accordion_header_open', 'h1', 1), {
    attrs: [['class', 'accordion-header']],
  })
  Object.assign(state.push('accordion_button_open', 'button', 1), {
    attrs: [
      ['class', 'accordion-button collapsed'],
      ['type', 'button'],
      ['data-bs-toggle', 'collapse'],
      ['data-bs-target', `#${itemId}`],
    ],
  })

  state.tokens.push(...tokens)

  state.push('accordion_button_open', 'button', -1)
  state.push('accordion_header_close', 'h2', -1)
}

const createAccordionBody = (state, accordionId, itemId, tokens) => {
  Object.assign(state.push('accordion_body_container_open', 'div', 1), {
    attrs: [
      ['id', itemId],
      ['class', 'accordion-collapse collapse'],
      ['data-bs-parent', `#${accordionId}`],
    ],
  })
  Object.assign(state.push('accordion_body_content_open', 'div', 1), {
    attrs: [['class', 'accordion-body']],
  })

  state.tokens.push(...tokens)

  state.push('accordion_body_content_close', 'div', -1)
  state.push('accordion_body_container_close', 'div', -1)
}

const createAccordionItem = (state, accordionId, itemId, tokens) => {
  Object.assign(state.push('accordion_item_open', 'div', 1), {
    attrs: [['class', 'accordion-item']],
  })
  createAccordionHead(state, accordionId, itemId, tokens.headTokens)
  createAccordionBody(state, accordionId, itemId, tokens.bodyTokens)
  state.push('accordion_item_close', 'div', -1)
}

const createAccordionContainer = (state, accordionId, groupedTokens) => {
  Object.assign(state.push('accordion_container_open', 'div', 1), {
    attrs: [
      ['id', accordionId],
      ['class', 'accordion'],
    ],
  })

  groupedTokens.forEach((gt, i) =>
    createAccordionItem(state, accordionId, `${accordionId}-${i}`, gt),
  )

  state.push('accordion_container_close', 'div', -1)
}

export const markdownItBootstrapAccordions = (md) => {
  md.block.ruler.before(
    'fence',
    'accordion_block',
    (state, startLine, endLine, silent) => {
      const startPos = state.bMarks[startLine] + state.tShift[startLine]
      // const maxPos = state.eMarks[startLine]

      // Check for the %%% syntax
      if (
        state.src[startPos] !== '%' ||
        state.src[startPos + 1] !== '%' ||
        state.src[startPos + 2] !== '%'
      ) {
        return false
      }

      // // Match "accordion" syntax
      // if (!state.src.slice(startPos, maxPos).startsWith('%%% accordion')) {
      //   return false
      // }

      if (silent) {
        return true
      }

      let nextLine = startLine

      // Find the end of the block
      while (nextLine < endLine) {
        nextLine++
        const linePos = state.bMarks[nextLine] + state.tShift[nextLine]
        const lineMax = state.eMarks[nextLine]

        // Look for the closing "%%%"
        if (state.src.slice(linePos, lineMax).trim() === '%%%') {
          break
        }
      }

      const countPre = state.tokens.length
      state.md.block.tokenize(state, startLine + 1, nextLine)
      const countPost = state.tokens.length
      const countNew = countPost - countPre
      const newTokens = state.tokens.splice(countPre, countNew)
      const groupedTokens = groupTokens(newTokens)

      const accordionId = accordionIdGenerator.next().value
      createAccordionContainer(state, accordionId, groupedTokens)

      state.line = nextLine + 1
      return true
    },
  )
}
