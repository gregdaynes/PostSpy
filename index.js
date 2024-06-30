import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import fp from 'fastify-plugin'
import AutoLoad from '@fastify/autoload'
import S from 'fluent-json-schema'
import Undici from 'undici'

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

    return reply.render('file.njk', { file, fileContents, fingerprint: request.params.fingerprint })
  })

  await fastify.register(import('@fastify/formbody'), opts)

  fastify.post('/request/:fingerprint', {
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

    // Prepare request
    const requestConfig = {
      method: '',
      url: '',
      maxRedirects: 0,
    }

    requestConfig.method = fileContents.method
    requestConfig.url = fileContents.url
    requestConfig.responseFormat = fileContents.responseFormat

    if (fileContents.followRedirects) {
      request.log.debug(fileContents.followRedirects, 'Follow redirects')

      if (fileContents.followRedirects === true) {
        // Some arbitrary number of redirects, we don't want too many though
        requestConfig.maxRedirects = 10
      } else if (typeof fileContents.folowRedirects === 'number') {
        requestConfig.maxRedirects = fileContents.folowRedirects
      } else {
        throw new Error('followRedirects invalid')
      }
    }

    // perform request
    const { statusCode, headers, trailers, body } = await Undici.request(
      requestConfig.url,
      {
        method: requestConfig.method,
        maxRedirections: requestConfig.maxRedirects,
      }
    )

    let bodyData
    for await (const data of body) {
      bodyData = data.toString()
    }

    if (requestConfig.responseFormat) {
      switch (requestConfig.responseFormat) {
        case 'json':
          try {
            bodyData = JSON.parse(bodyData)
          } catch (err) {
            console.error(err)
            console.info('Response body is not valid JSON')
          }
      }
    }

    return reply.render('file.njk', { file, fileContents, fingerprint: request.params.fingerprint, response: { statusCode, headers, body: bodyData, trailers } })
  })
})
