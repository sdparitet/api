import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import { GLPI_DB_CONNECTION } from '~root/src/constants';
import { IGetUserTicketsRequestDto, IGetUsersInTicketsByAuthorRequestDto } from '~glpi/dto/post-request-dto';

@Injectable()
export class GLPI_Service {
   constructor(
      @InjectDataSource(GLPI_DB_CONNECTION) private readonly glpi: DataSource
   ) { }

   async GetUserTickets(dto: IGetUserTicketsRequestDto) {
      return await this.glpi.query('' +
         'SELECT t.id' +
         '     , t.type' +
         '     , t.name' +
         '     , t.status' +
         '     , i.completename as category' +
         '     , t.date_creation' +
         '     , t.solvedate    as date_solve' +
         '     , t.date_mod ' +
         'FROM glpi_tickets t' +
         '         LEFT JOIN glpi_itilcategories i ON t.itilcategories_id = i.id ' +
         'WHERE t.id IN (' +
         '    SELECT tickets_id' +
         '    FROM glpi_tickets_users' +
         '    WHERE t.type = 1' +
         '      AND users_id = (' +
         '        SELECT id' +
         '        FROM glpi_users' +
         `        WHERE name = '${dto.name || ''}'` +
         '        )' +
         '    )' +
         ';')
   }

   async GetUsersInTicketsByAuthor(dto: IGetUsersInTicketsByAuthorRequestDto) {
      return await this.glpi.query('' +
         'SELECT tickets_id                           as ticket_id' +
         '     , CONCAT(u.realname, \' \', u.firstname) as name' +
         '     , type ' +
         'FROM glpi_tickets_users tu' +
         '    LEFT JOIN glpi_users u ON tu.users_id = u.id ' +
         'WHERE tickets_id IN (' +
         '    SELECT tickets_id' +
         '    FROM glpi_tickets_users tu2' +
         '        LEFT JOIN glpi_users u2 ON tu2.users_id = u.id' +
         '    WHERE tu2.type = 1' +
         `      AND u.name = '${dto.name || ''}'` +
         '    ) ' +
         'ORDER BY tu.tickets_id' +
         ';')
   }

}
