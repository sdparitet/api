import { Module } from '@nestjs/common'

import { Form_Service } from '~form/form.service'
import { Form_Controller } from '~form//form.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FORMS_DB_CONNECTION } from '~root/src/constants'
import { Form } from '~form/entity/form.entity'
import { Block } from '~form/entity/block.entity'
import { Field } from '~form/entity/field.entity'
import { Template } from '~form/entity/template.entity'
import { JwtService } from '@nestjs/jwt'
import { DataSourceReader } from '~utils/form/dataSourceReader'
import { TagReplacer } from '~utils/form/tagReplacer'


@Module({
   providers: [JwtService, Form_Service, DataSourceReader, TagReplacer],
   controllers: [Form_Controller],
   imports: [
      TypeOrmModule.forFeature([Form, Block, Field, Template], FORMS_DB_CONNECTION),
   ],
   exports: [Form_Service],
})
export class Form_Module {
}
