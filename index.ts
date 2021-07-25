import { parse } from '@textlint/markdown-to-ast'
import { TxtNode } from '@textlint/ast-node-types'
import { readFileSync } from 'fs'
import { load } from 'js-yaml'

const MetaRequired = [
  'title',
  'content',
  'tag',
  'imageUrl',
  'difficulty',
  'score'
]

type AstHandler = {
  prev: () => TxtNode
  next: () => TxtNode
  current: () => TxtNode
}

const astHandler = (children: TxtNode) => {
  let index = 0
  return ((children: TxtNode) => {
    const prev = () => children[--index]
    const next = () => children[++index]
    const current = () => children[index]
    return { prev, next, current }
  })(children)
}

const raiseError = (message: string, ast: TxtNode) => {
  throw new Error(`${message} line:${ast.loc.start.line}`)
}

const getMetaData = (ast: TxtNode) => {
  if (ast.type !== 'Yaml') raiseError('ファイルの先頭はYaml形式です', ast)

  const meta = load(ast.value) as { [key: string]: string }
  MetaRequired.forEach((item) => {
    if (!Object.keys(meta).includes(item)) throw `メタ情報に${item}がありません`
  })
  return meta
}

const getLesson = (ast: AstHandler) => {
  const title = getLessonTitle(ast)
  const description = getDescription(ast)
  const exp = getExp(ast)
  const content = getContent(ast)
  const quizContent = getQuizContent(ast)
  const quizCoices = getQuizCoices(ast)
  const quizExplanation = getQuizExplanation(ast)

  return {
    title,
    description,
    exp,
    content,
    quizContent,
    quizCoices,
    quizExplanation
  }
}

const getLessonTitle = (ast: AstHandler) => {
  const item = ast.next()

  if (item.type === 'Header' && item.depth === 2) {
    return item.children[0].value
  } else {
    raiseError('タイトルがありません', item)
  }
}

const getDescription = (ast: AstHandler) => {
  const item = ast.next()
  if (
    item.type === 'Header' &&
    item.depth === 3 &&
    item.children[0].value === '概要'
  ) {
    const reItem = ast.next()
    if (reItem.type === 'Paragraph') {
      return reItem.children[0].value
    } else {
      raiseError('概要が不正です', reItem)
    }
  } else {
    raiseError('概要がありません', item)
  }
}

const getExp = (ast: AstHandler) => {
  const item = ast.next()
  if (item.raw === '### 経験値') {
    const reItem = ast.next()
    if (reItem.type === 'Paragraph' && /^([1-9]\d*|0)$/.test(reItem.raw)) {
      return Number(reItem.raw)
    } else {
      raiseError('経験値が不正です', reItem)
    }
  } else {
    raiseError('経験値がありません', item)
  }
}

const getContent = (ast: AstHandler) => {
  let content = ''
  if (ast.next().raw === '### 本文') {
    ast.next()
    // TODO: "### 問題"があるかどうか
    // --- か、EOFだとerror ?
    while (ast.current().raw !== '### 問題') {
      content += ast.current().raw + '\n\n'
      ast.next()
    }
    ast.prev()
    return content.slice(0, -2) // 後ろの改行を削除
  } else {
    raiseError('本文がありません', ast.current())
  }
}

const getQuizContent = (ast: AstHandler) => {
  let content = ''
  if (ast.next().raw === '### 問題') {
    ast.next()
    // TODO: 選択肢があるかどうか
    while (ast.current().type !== 'List') {
      content += ast.current().raw + '\n\n'
      ast.next()
    }
    ast.prev()
    return content.slice(0, -2) // 後ろの改行を削除
  } else {
    raiseError('問題がありません', ast.current())
  }
}

const getQuizCoices = (ast: AstHandler) => {
  if (ast.next().type === 'List') {
    return ast.current().children.map((item: TxtNode) => {
      // if type === ListItemは不要
      return { content: item.children[0].raw, isCorrect: item.checked }
    })
  } else {
    raiseError('選択肢がありません', ast.current())
  }
}

const getQuizExplanation = (ast: AstHandler) => {
  let content = ''
  if (ast.next().raw === '### 解説') {
    ast.next()
    while (
      ast.current() !== undefined &&
      ast.current().type !== 'HorizontalRule'
    ) {
      content += ast.current().raw + '\n\n'
      ast.next()
    }
    return content.slice(0, -2) // 後ろの改行を削除
  } else {
    raiseError('解説がありません', ast.current())
  }
}

const getLessons = (ast: AstHandler) => {
  let lessons = []
  while (ast.current() !== undefined) {
    lessons.push(getLesson(ast))
  }
  return lessons
}

export const md2json = () => {
  try {
    const file = readFileSync('./example/text.md', 'utf-8')
    const { children } = parse(file)

    const ast = astHandler(children)

    const metaData: { [key: string]: string } = getMetaData(ast.current())
    const lessons = getLessons(ast) // こっから！！！！

    return { ...metaData, lessons }
  } catch (error) {
    console.error(error)
  }
}

console.log(JSON.stringify(md2json()))
