import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import fp from 'fastify-plugin'
import AutoLoad from '@fastify/autoload'
import S from 'fluent-json-schema'

export default fp(async function app (fastify, opts) {
  await fastify.register(import('./plugins/config.no-load.js'), structuredClone(opts))

  await fastify.register(AutoLoad, {
    dir: join(import.meta.dirname, 'plugins'),
    ignorePattern: /.*.no-load\.js/,
    options: structuredClone(opts),
  })

  fastify.get('/', async (request, reply) => {
    return reply.render('index.njk')
  })

  fastify.get('/request/:fingerprint', {
    schema: {
      params: S.object()
        .prop('fingerprint', S.string().format('uuid')),
    },
  },
  async (request, reply) => {
    const file = fastify.fileIndex[request.params.fingerprint]

    if (!file) {
      return reply.render('404.njk', { file: request.params.fingerprint, message: 'not found' })
    }

    // get the file contents

    const fullPath = join(import.meta.dirname, fastify.config.dirPath, file)
    const fileContents = JSON.parse((await readFile(fullPath)).toString())

    return reply.render('file.njk', { file, fileContents })
  })
})
