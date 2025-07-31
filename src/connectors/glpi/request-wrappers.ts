import { Response } from 'express'
import { GLPI } from '~c_glpi/glpi-api.connector'
import { HttpStatus } from '@nestjs/common'
import { DataSource } from 'typeorm'


export const RequestWrapper = async (res: Response, func: () => void) => {
   try {
      res.setHeader('Suspend-Reauth', 'true')
      func()
   } catch (err: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err)
   }
}

export const GlpiWrapper = async (username: string, res: Response, glpiDS: DataSource, func: (glpi: GLPI) => Promise<unknown>) => {
   const glpi = new GLPI(username, glpiDS)
   await glpi.InitSession()

   if (glpi.authorized) {
      try {
         await func(glpi)
      } catch (err: any) {
         return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ status: 'error', message: err})
      }
   } else {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ status: 'error', message: 'Could not login in GLPI' })
   }
}
