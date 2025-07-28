import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtService } from '@nestjs/jwt'
import { Module } from '@nestjs/common'
import { Form } from '~forms/entity/form.entity'
import { Form_Service } from '~forms/form.service'
import { TagReplacer } from '~u_forms/tagReplacer'
import { Block } from '~forms/entity/block.entity'
import { Field } from '~forms/entity/field.entity'
import { FORMS_DB_CONNECTION } from '~src/constants'
import { Template } from '~forms/entity/template.entity'
import { Form_Controller } from '~forms/form.controller'
import { DataSourceReader } from '~u_forms/dataSourceReader'


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
