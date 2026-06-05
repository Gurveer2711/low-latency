import { Request, Response } from 'express'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import { s3 } from '../lib/s3'
import { config } from '../config/env'
import { logger } from '../lib/logger' // new

export const requestUploadUrl = async (req: Request, res: Response) => {
  try {
    const { title, contentType } = req.body

    if (!title || !contentType) {
      logger.warn({ title, contentType }, 'Missing required fields') // warn log
      res.status(400).json({ error: 'title and contentType are required' })
      return
    }

    const videoId = uuidv4()
    const rawKey = `raw/${videoId}/${title}`

    const command = new PutObjectCommand({
      Bucket: config.aws.bucket,
      Key: rawKey,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 })

    logger.info({ videoId, rawKey }, 'Presigned upload URL generated') // info log

    res.json({ uploadUrl, videoId, rawKey })

  } catch (error) {
    logger.error({ error }, 'Failed to generate presigned URL') // error log
    res.status(500).json({ error: 'Failed to generate upload URL' })
  }
}