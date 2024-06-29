import fs from 'node:fs'
import path from 'node:path'
import fp from 'fastify-plugin'
import { v5 as uuid, NIL as NIL_UUID } from 'uuid'

export default fp(
  async function (fastify) {
    fastify.addHook('onReady', function () {
      const files = fastify.listFiles()
      const filesStripped = fastify.stripCommonPath(files)
      const filesFingerPrinted = fastify.fingerPrint(filesStripped)
      const fileTree = fastify.fileListToTree(filesFingerPrinted)
      fastify.decorate('fileTree', fileTree)
    })

    fastify.addHook('preHandler', function (request, reply, done) {
      reply.locals = Object.assign({}, reply.locals, {
        fileTree: fastify.fileTree,
      })

      done()
    })

    fastify.decorate('listFiles', function (dirPath) {
      if (!dirPath) dirPath = fastify.config.dirPath

      function getAllFiles (dirPath, arrayOfFiles) {
        const files = fs.readdirSync(dirPath)

        arrayOfFiles = arrayOfFiles || []

        files.forEach(function (file) {
          if (fs.statSync(dirPath + '/' + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles)
          } else {
            arrayOfFiles.push(path.join(import.meta.dirname, dirPath, '/', file))
          }
        })

        return arrayOfFiles
      }

      return getAllFiles(dirPath, [])
    })

    fastify.decorate('stripCommonPath', function (files) {
      const dirPath = fastify.config.dirPath

      return files.map(file => file.replace(path.join(import.meta.dirname, dirPath), ''))
    })

    fastify.decorate('fingerPrint', function (files) {
      return files.map(file => {
        return [file, uuid(file, NIL_UUID)]
      })
    })

    fastify.decorate('fileListToTree', function (files) {
      const result = []
      const level = { result }

      files.forEach(([path, fingerprint]) => {
        path.split('/').reduce((r, name, i, a) => {
          if (!r[name]) {
            r[name] = { result: [] }
            r.result.push({ name, fingerprint, children: r[name].result })
          }

          return r[name]
        }, level)
      })

      return result
    })
  },
  {
    name: 'list-files',
    dependencies: ['application-config'],
  }
)
