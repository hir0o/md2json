import { parse } from '@textlint/text-to-ast'
import { TxtNode, TxtParentNode } from '@textlint/ast-node-types'

import { readFileSync } from 'fs'

const getMetaData = (ast: TxtParentNode) => {
  let meta = {}
  for (let i = 1; i < ast.length; i++) {
    const item = ast.shift()
    if (item.raw === '---') break
    if (item.type === 'Break') continue // 改行は無視
    const [tag, content] = item.raw.split(/: /)
    // TODO: /: /にマッチしなかったら、throw
    meta = { ...meta, [tag]: content }
  }
  ;['title', 'content', 'tag', 'imageUrl', 'difficulty', 'score'].forEach(
    (item) => {
      if (!Object.keys(meta).includes(item))
        throw `メタ情報に${item}がありません。`
    }
  )
  return meta
}

// 一旦ここに全部実装しちゃう
const md2json = () => {
  const file = readFileSync('./example/text.md', 'utf-8')
  const { children } = parse(file)

  if (children.shift().raw !== '---') throw 'ファイルの先頭は---です。'

  const metaData: { [key: string]: string } = getMetaData(children)

  return { metaData }
}

md2json()
