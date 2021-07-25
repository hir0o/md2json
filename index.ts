import { parse } from '@textlint/markdown-to-ast'
import { ASTNodeTypes, TxtNode } from '@textlint/ast-node-types'
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
  next: () => TxtNode
  current: () => TxtNode
}

const astHandler = (children: TxtNode) => {
  let index = 0
  return ((children: TxtNode) => {
    const next = () => children[++index]
    const current = () => children[index]
    return { next, current }
  })(children)
}

const raiseError = (message: string, ast: TxtNode) => {
  throw new Error(`${message} line:${ast.loc.start.line}`)
}

const getMetaData = (ast: TxtNode) => {
  if (ast.type !== 'Yaml') raiseError('ファイルの先頭はYaml形式です。', ast)

  const meta = load(ast.value) as { [key: string]: string }
  MetaRequired.forEach((item) => {
    if (!Object.keys(meta).includes(item))
      throw `メタ情報に${item}がありません。`
  })
  return meta
}

const getLesson = (ast: AstHandler) => {
  const title = getLessonTitle(ast)
  const description = getDescription(ast)
  const content = getContent(ast)
  console.log({ content })

  return { title, description }
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
      raiseError('概要が不正です。', reItem)
    }
  } else {
    raiseError('概要がありません。', item)
  }
}

const getContent = (ast: AstHandler) => {
  let content = ''
  ast.next()
  while (ast.current().raw !== '### 本文') {
    content += ast.current().raw + '\n'
    ast.next()
  }
  return content
}

// 一旦ここに全部実装しちゃう
const md2json = () => {
  try {
    const file = readFileSync('./example/text.md', 'utf-8')
    const { children } = parse(file)

    const ast = astHandler(children)

    const metaData: { [key: string]: string } = getMetaData(ast.current())
    const lesson = getLesson(ast)

    return { metaData }
  } catch (error) {
    console.error(error)
  }
}

md2json()
