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

const getMetaData = (metaStr: string) => {
  const meta = load(metaStr) as { [key: string]: string }
  MetaRequired.forEach((item) => {
    if (!Object.keys(meta).includes(item))
      throw `メタ情報に${item}がありません。`
  })
  return meta
}

// const getLessons = (ast: TxtNode[])

// 一旦ここに全部実装しちゃう
const md2json = () => {
  const file = readFileSync('./example/text.md', 'utf-8')
  const { children } = parse(file)

  const meta = children.shift()
  const metaData: { [key: string]: string } = getMetaData(meta.value)

  // return { metaData }
}

md2json()
