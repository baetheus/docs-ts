/**
 * markdown utilities
 *
 * @since 0.2.0
 */

import * as prettier from 'prettier'
import * as O from 'fp-ts/lib/Option'
import { Class, Func, Interface, Method, TypeAlias, Constant, Module, Export, Example } from './parser'
import { pipe } from 'fp-ts/lib/pipeable'
const toc = require('markdown-toc')

const CRLF = '\n\n'
const h1 = (title: string) => `# ${title}`
const h2 = (title: string) => `## ${title}`
const fence = (language: string) => (code: string): string => '```' + language + '\n' + code + '\n' + '```'
const ts = fence('ts')
const bold = (code: string) => '**' + code + '**'
const strike = (text: string) => '~~' + text + '~~'

const prettierOptions: prettier.Options = {
  parser: 'markdown',
  semi: false,
  singleQuote: true,
  printWidth: 120
}

function handleTitle(s: string, deprecated: boolean): string {
  const title = s.trim() === 'hasOwnProperty' ? s + ' (function)' : s
  return deprecated ? strike(title) : title
}

function printInterface(i: Interface): string {
  let s = h1(handleTitle(i.name, i.deprecated) + ' (interface)')
  s += printDescription(i.description)
  s += printSignature(i.signature)
  s += printExamples(i.examples)
  s += printSince(i.since)
  s += CRLF
  return s
}

function printTypeAlias(ta: TypeAlias): string {
  let s = h1(handleTitle(ta.name, ta.deprecated) + ' (type alias)')
  s += printDescription(ta.description)
  s += printSignature(ta.signature)
  s += printExamples(ta.examples)
  s += printSince(ta.since)
  s += CRLF
  return s
}

function printConstant(c: Constant): string {
  let s = h1(handleTitle(c.name, c.deprecated))
  s += printDescription(c.description)
  s += printSignature(c.signature)
  s += printExamples(c.examples)
  s += printSince(c.since)
  s += CRLF
  return s
}

function printFunction(f: Func): string {
  let s = h1(handleTitle(f.name, f.deprecated))
  s += printDescription(f.description)
  s += printSignatures(f.signatures)
  s += printExamples(f.examples)
  s += printSince(f.since)
  s += CRLF
  return s
}

function printStaticMethod(f: Func): string {
  let s = h2(handleTitle(f.name, f.deprecated) + ' (static method)')
  s += printDescription(f.description)
  s += printSignatures(f.signatures)
  s += printExamples(f.examples)
  s += printSince(f.since)
  s += CRLF
  return s
}

function printExport(e: Export): string {
  let s = h1(handleTitle(e.name, e.deprecated))
  s += printDescription(e.description)
  s += printSignature(e.signature)
  s += printExamples(e.examples)
  s += printSince(e.since)
  s += CRLF
  return s
}

function printMethod(m: Method): string {
  let s = h2(handleTitle(m.name, m.deprecated) + ' (method)')
  s += printDescription(m.description)
  s += printSignatures(m.signatures)
  s += printExamples(m.examples)
  s += printSince(m.since)
  s += CRLF
  return s
}

function printClass(c: Class): string {
  let s = h1(handleTitle(c.name, c.deprecated) + ' (class)')
  s += printDescription(c.description)
  s += printSignature(c.signature)
  s += printExamples(c.examples)
  s += printSince(c.since)
  s += CRLF
  s += c.staticMethods.map(printStaticMethod).join(CRLF)
  s += c.methods.map(printMethod).join(CRLF)
  s += CRLF
  return s
}

function printSignature(signature: string): string {
  return CRLF + bold('Signature') + CRLF + ts(signature)
}

function printSignatures(signature: Array<string>): string {
  return CRLF + bold('Signature') + CRLF + ts(signature.join('\n'))
}

function printDescription(description: O.Option<string>): string {
  return pipe(
    description,
    O.fold(
      () => '',
      s => CRLF + s
    )
  )
}

function printModuleDescription(m: Module): string {
  let s = h1(handleTitle(m.name, m.deprecated) + ' overview')
  s += CRLF
  s += printDescription(m.description)
  s += printExamples(m.examples)
  s += printSince(m.since)
  s += CRLF
  return s
}

/**
 * @since 0.2.0
 */
export function printExamples(examples: Array<Example>): string {
  if (examples.length === 0) {
    return ''
  }
  return (
    CRLF +
    examples
      .map(code => {
        return bold('Example') + CRLF + ts(code)
      })
      .join(CRLF)
  )
}

function printSince(since: string): string {
  return CRLF + `Added in v${since}`
}

/**
 * @since 0.2.0
 */
function printHeader(title: string, order: number): string {
  let s = '---\n'
  s += `title: ${title}\n`
  s += `nav_order: ${order}\n`
  s += `parent: Modules\n`
  s += '---\n\n'
  return s
}

/**
 * @since 0.2.0
 */
export function printModule(module: Module, counter: number): string {
  const header = printHeader(module.path.slice(1).join('/'), counter)
  const md =
    CRLF +
    module.interfaces.map(i => printInterface(i)).join('') +
    module.typeAliases.map(i => printTypeAlias(i)).join('') +
    module.classes.map(c => printClass(c)).join('') +
    [
      ...module.constants.map(c => printConstant(c)),
      ...module.functions.map(f => printFunction(f)),
      ...module.exports.map(e => printExport(e))
    ]
      .sort()
      .join('')

  const result =
    header +
    printModuleDescription(module) +
    CRLF +
    '---' +
    CRLF +
    '<h2 class="text-delta">Table of contents</h2>' +
    CRLF +
    toc(md).content +
    CRLF +
    '---' +
    CRLF +
    md
  return prettier.format(result, prettierOptions)
}
