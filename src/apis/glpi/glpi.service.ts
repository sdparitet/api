import {Injectable, HttpStatus} from "@nestjs/common";
import {InjectDataSource} from "@nestjs/typeorm";
import {DataSource} from "typeorm";
import {Response} from "express";

import {GLPI_DB_CONNECTION} from '~root/src/constants';
import {
    IGetUserTicketsRequestDto,
    IGetUsersInTicketsByAuthorRequestDto,
    IGetUsersInTicketsByAuthorResponse, IGetUserTicketsResponse, IGetTicketInfoRequestDto, IGetTicketInfoResponse,
} from '~glpi/dto/post-request-dto';

@Injectable()
export class GLPI_Service {
    constructor(
        @InjectDataSource(GLPI_DB_CONNECTION) private readonly glpi: DataSource
    ) {
    }

    async GetUserTickets(dto: IGetUserTicketsRequestDto, res: Response) {
        try {
            // Check permission = ?
            const ret: IGetUserTicketsResponse[] = await this.glpi.query('' +
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
        } catch (err: any) {
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
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }
    }

    async GetTicketInfoByID(dto: IGetTicketInfoRequestDto, res: Response) {
        try {
            const ret: IGetTicketInfoResponse[] = await this.glpi.query('' +
                'select t.id,                                                      ' +
                '       t.name,                                                    ' +
                '       t.status,                                                  ' +
                '       t.type,                                                    ' +
                '       c.completename,                                            ' +
                '       t.date_creation,                                           ' +
                '       t.time_to_resolve,                                         ' +
                '       t.solvedate,                                               ' +
                '       t.closedate,                                               ' +
                '       t.content                                                  ' +
                'from glpi_tickets t                                               ' +
                '    left join glpi_itilcategories c on t.itilcategories_id = c.id ' +
                `where t.id = ${dto.id || '0'}` +
                ';')
            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }
    }


    async GetTicketUsersByTicketID(dto: IGetTicketInfoRequestDto, res: Response) {
        try {
            const ret: IGetTicketInfoResponse[] = await this.glpi.query('' +
                'select u.id,                                                ' +
                '       CONCAT(u.firstname, \' \', u.realname) as name,      ' +
                '       type,                                                ' +
                '       1                                    as \'itemType\' ' +
                'from glpi_tickets_users tu                                  ' +
                '         left join glpi_users u                             ' +
                '                   on tu.users_id = u.id                    ' +
                `where tickets_id = ${dto.id || '0'}                         ` +
                'union                                                       ' +
                'select g.id,                                                ' +
                '       g.name,                                              ' +
                '       tg.type,                                             ' +
                '       2 as \'itemType\'                                    ' +
                'from glpi_groups_tickets tg                                 ' +
                '         left join glpi_groups g                            ' +
                '                   on tg.groups_id = g.id                   ' +
                `where tickets_id = ${dto.id || '0'};                        `)
            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }
    }

    async GetTicketFollowupsByTicketID(dto: IGetTicketInfoRequestDto, res: Response) {
        try {
            const ret: IGetTicketInfoResponse[] = await this.glpi.query('' +
                'select f.id,                                           ' +
                '       items_id,                                       ' +
                '       CONCAT(u.firstname, \' \', u.realname) as name, ' +
                '       content,                                        ' +
                '       f.date_creation                                 ' +
                'from glpi_itilfollowups f                              ' +
                '         left join glpi_users u                        ' +
                '                   on f.users_id = u.id                ' +
                'where itemtype = \'Ticket\'                            ' +
                `  and items_id = ${dto.id}                             ` +
                '  and is_private = 0                                   ' +
                'order by f.date_creation;                              ')
            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }
    }
}
