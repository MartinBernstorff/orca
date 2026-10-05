import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: { isPackaged: false },
  safeStorage: { isEncryptionAvailable: () => false }
}))

import { ArtifactCloudService } from './artifact-cloud-service'

const createdPaths: string[] = []
const apiUrl = 'http://localhost:3000'
const writeRequest = {
  sourceKey: '/repo/report.html',
  content: '<h1>Hi</h1>',
  contentType: 'text/html' as const,
  fileName: 'report.html',
  apiUrl,
  authToken: 'token-a'
}

function createResponse(slug: string): Response {
  return new Response(
    JSON.stringify({
      artifact: {
        version: 1,
        slug,
        title: null,
        originalFileName: 'report.html',
        sourceContentType: 'text/html',
        renderedContentType: 'text/html',
        createdAt: '2026-08-06T00:00:00.000Z',
        updatedAt: '2026-08-06T00:00:00.000Z',
        expiresAt: '2026-09-06T00:00:00.000Z',
        byteSize: 12,
        deletedAt: null
      },
      shareUrl: `https://share.onorca.dev/a/${slug}`,
      editToken: `edit-${slug}`
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  )
}

async function setup(): Promise<ArtifactCloudService> {
  const path = await mkdtemp(join(tmpdir(), 'orca-artifact-races-'))
  createdPaths.push(path)
  return new ArtifactCloudService(path, () => true)
}

afterEach(async () => {
  vi.unstubAllGlobals()
  await Promise.all(
    createdPaths.splice(0).map((path) => rm(path, { recursive: true, force: true }))
  )
})

describe('ArtifactCloudService same-source races', () => {
  it('runs the next same-source operation after an earlier failure', async () => {
    const service = await setup()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: 'temporary_failure' }), {
          status: 500,
          headers: { 'content-type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(createResponse('artifact-b'))
    vi.stubGlobal('fetch', fetchMock)

    const failedShare = service.share(writeRequest)
    const nextShare = service.share(writeRequest)

    await expect(failedShare).rejects.toMatchObject({ statusCode: 500 })
    await expect(nextShare).resolves.toMatchObject({
      status: 'ok',
      value: { artifact: { slug: 'artifact-b' } }
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
