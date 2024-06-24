import { Injectable, HttpStatus } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Response } from "express";

import { GLPI_DB_CONNECTION } from '~root/src/constants';
import {
   IGetUserTicketsRequestDto,
   IGetUsersInTicketsByAuthorRequestDto,
   IGetUsersInTicketsByAuthorResponse, IGetUserTicketsResponse, IGetTicketInfoRequestDto, IGetTicketInfoResponse,
} from '~glpi/dto/post-request-dto';

@Injectable()
export class GLPI_Service {
   constructor(
      @InjectDataSource(GLPI_DB_CONNECTION) private readonly glpi: DataSource
   ) { }

   async GetUserTickets(dto: IGetUserTicketsRequestDto, res: Response) {
      try {
         // Check permission = ?
         const ret: IGetUserTicketsResponse[]  = await this.glpi.query('' +
            'SELECT t.id ' +
            '     , t.type ' +
            '     , t.name ' +
            '     , t.status ' +
            '     , i.completename as category ' +
            '     , t.date_creation ' +
            '     , t.solvedate    as date_solve ' +
            '     , t.date_mod ' +
            'FROM glpi_tickets t ' +
            '    LEFT JOIN glpi_itilcategories i ON t.itilcategories_id = i.id ' +
            'WHERE t.is_deleted = 0 ' +
            '  AND t.id in ( ' +
            '    SELECT tu.tickets_id ' +
            '    FROM glpi_tickets_users tu ' +
            '    WHERE tu.type = 1 ' +
            `      AND tu.users_id in (SELECT id FROM glpi_users u WHERE u.name = '${dto.name || ''}') ` +
            '  ) ' +
            ';')
         if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
         else res.status(HttpStatus.BAD_REQUEST).json([]);
      }
      catch (err: any) {
         return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
      }
   }

   async GetUsersInTicketsByAuthor(dto: IGetUsersInTicketsByAuthorRequestDto, res: Response) {
      try {
         const ret: IGetUsersInTicketsByAuthorResponse[] = await this.glpi.query('' +
            'SELECT t.id                                 as ticket_id ' +
            '     , CONCAT(u.realname, \' \', u.firstname) as name ' +
            '     , gtu.type ' +
            'FROM glpi_tickets t ' +
            '    LEFT JOIN glpi_tickets_users gtu ON gtu.tickets_id = t.id ' +
            '    INNER JOIN glpi_users u ON u.id = gtu.users_id ' +
            'WHERE t.is_deleted = 0 ' +
            '  AND t.id in ( ' +
            '      SELECT tu.tickets_id ' +
            '      FROM glpi_tickets_users tu ' +
            '      WHERE tu.type = 1 ' +
            `        AND users_id IN (SELECT id FROM glpi_users gu WHERE gu.name = '${dto.name || ''}') ` +
            '    ) ' +
            ';')
         if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
         else res.status(HttpStatus.BAD_REQUEST).json([]);
      }
      catch (err: any) {
         return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
      }
   }

   async GetTicketInfoByID(dto: IGetTicketInfoRequestDto, res: Response) {
      try {
         const ret: IGetTicketInfoResponse[] = await this.glpi.query('' +
            'select t.id,              # number ' +
            '       t.name,            # string ' +
            '       t.status,          # number ' +
            '       t.type,            # number ' +
            '       c.completename,    # string ' +
            '       t.date_creation,   # string ' +
            '       t.time_to_resolve, # string ' +
            '       t.solvedate,       # string ' +
            '       t.closedate,       # string ' +
            '       t.content          # string ' +
            'from glpi_tickets t ' +
            '    left join glpi_itilcategories c on t.itilcategories_id = c.id ' +
            `where t.id = ${String(dto.id) || '0'}` +
            ';')
         if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
         else res.status(HttpStatus.BAD_REQUEST).json([]);
      }
      catch (err: any) {
         return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
      }
   }

}
